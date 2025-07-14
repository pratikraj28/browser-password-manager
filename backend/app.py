from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask import render_template
import random
import time
import datetime
import smtplib
import json
import boto3
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from uuid import uuid4
from sharding_utils import upload_vault, get_vault
from encryption_utils import encrypt_password, decrypt_password
from backup_utils import shard_and_upload_backup
from backup_utils import restore_from_sharded_backup
from google.cloud import storage as storage
from datetime import datetime
from bson import ObjectId
from config_local import MONGO_URI, AES_KEY

import os
import base64



AWS_BUCKET = "vault-password-s3"
GCS_BUCKET = "vault-password-gcs"


key = os.urandom(32)
iv = os.urandom(16)

access_key = os.getenv('AWS_ACCESS_KEY_ID')
secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
region = os.getenv('AWS_DEFAULT_REGION')

s3_client = boto3.client(
    's3',
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name=region
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
# CORS(app, origins=["http://localhost:3000"])
CORS(app, origins=["https://password-manager-frontend-298931957092.us-central1.run.app"])

# client = MongoClient("mongodb://localhost:27017/")
# db = client["Project"]
# users_collection = db["users"]
# vault_collection = db["vault"]
# activities_collection = db['recent_activities']

# Replace this with your actual Atlas connection string
client = MongoClient(MONGO_URI)

db = client["passwordManager"]

users_collection = db["users"]
activities_collection = db["recent_activities"]

otp_storage = {}
shared_links = {}


key = AES_KEY

if len(key) not in [16, 24, 32]:
    raise ValueError("Encryption key must be 16, 24, or 32 bytes long")

def serialize_activity(activity):
    return {
        "_id": str(activity["_id"]),
        "action": activity["action"],
        "website": activity["website"],
        "timestamp": activity["timestamp"].strftime("%Y-%m-%d %H:%M:%S") if hasattr(activity["timestamp"], "strftime") else activity["timestamp"]
    }

def encrypt_password(plain_password):
    try:
        iv = os.urandom(16)

        padder = padding.PKCS7(128).padder()
        padded_password = padder.update(plain_password.encode()) + padder.finalize()

        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        encrypted_password = encryptor.update(padded_password) + encryptor.finalize()

        encrypted_data = iv + encrypted_password
        encrypted_data_b64 = base64.urlsafe_b64encode(encrypted_data).decode()

        return encrypted_data_b64

    except Exception as e:
        print(f"Encryption failed: {str(e)}")
        return None


def decrypt_password(encrypted_password_b64):
    try:
        encrypted_data = base64.urlsafe_b64decode(encrypted_password_b64)

        iv = encrypted_data[:16]
        encrypted_password_bytes = encrypted_data[16:]

        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()

        decrypted_padded_password = decryptor.update(encrypted_password_bytes) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        decrypted_password = unpadder.update(decrypted_padded_password) + unpadder.finalize()

        return decrypted_password.decode()

    except ValueError as e:
        print(f"Decryption failed: {str(e)}")
        return None
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None
    
def send_otp_email(email, otp):
    sender_email = "pratikraj590@gmail.com"
    sender_password = "hxbx kxuu fbmd mqsq"
    receiver_email = email

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = "Your OTP Code"
    body = f"Your OTP code is {otp}. It will expire in 10 minutes."
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, receiver_email, text)
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
    return True

@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        users = list(users_collection.find().limit(5))
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required."}), 400

        if users_collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Email already registered."}), 200
        
        otp = random.randint(100000, 999999)
        otp_storage[email] = {
            "otp": otp,
            "password": password,
            "username": username,
            "timestamp": time.time()
        }


        if send_otp_email(email, otp):
            return jsonify({"status": "success", "message": "OTP sent for verification!"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to send OTP. Try again later."}), 500

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": "An error occurred during registration."}), 500

@app.route('/verify-register-otp', methods=['POST'])
def verify_register_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        user_otp = int(data.get('otp'))

        if email not in otp_storage:
            return jsonify({"status": "error", "message": "OTP not found. Please register again."}), 201

        otp_data = otp_storage[email]
        stored_otp = otp_data["otp"]
        password = otp_data["password"]
        username = otp_data["username"]
        timestamp = otp_data["timestamp"]

        if time.time() - timestamp > 600:
            return jsonify({"status": "error", "message": "OTP expired. Please register again."}), 201

        if user_otp != stored_otp:
            return jsonify({"status": "error", "message": "Incorrect OTP. Please try again."}), 201

        encrypted_password = encrypt_password(password)

        user_data = {
            "email": email,
            "password": encrypted_password,
            "username": username,
            "timeout": 10,
            "profile_pic": None
        }

        users_collection.insert_one(user_data)
        del otp_storage[email]

        return jsonify({"status": "success", "message": "Registration successful!"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": "An error occurred during OTP verification."}), 500

@app.route("/set-auto-logout", methods=["POST"])
def set_auto_logout():
    try:
        data = request.json
        email = data.get("email")
        timeout = data.get("timeout")

        if not email or timeout is None:
            print(email, timeout)
            return jsonify({"status": "error", "message": "Missing email or timeout"}), 400

        users_collection.update_one(
            {"email": email},
            {'$set': {'timeout': float(timeout)}}
        )

        return jsonify({"status": "success", "message": "Auto-logout updated successfully"})
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({"status": "error", "message": "User not found. Please register first."})
    print(user)
    print(decrypt_password(user['password']))
    if decrypt_password(user['password']) != password:
        return jsonify({"status": "error", "message": "Incorrect password. Please try again."})

    otp = random.randint(100000, 999999)
    otp_storage[email] = {"otp": otp, "timestamp": time.time()}

    if send_otp_email(email, otp):
        return jsonify({"status": "success", "message": "OTP sent successfully!"})
    else:
        return jsonify({"status": "error", "message": "Failed to send OTP. Try again later."})

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    user_otp = int(data.get('otp'))

    if email not in otp_storage:
        return jsonify({"status": "error", "message": "OTP not found. Please request a new OTP."})

    otp_data = otp_storage[email]
    stored_otp = otp_data["otp"]
    timestamp = otp_data["timestamp"]

    if time.time() - timestamp > 600:
        return jsonify({"status": "error", "message": "OTP expired. Please request a new OTP."})

    if user_otp == stored_otp:
        del otp_storage[email]
        return jsonify({"status": "success", "message": "OTP verified successfully!"})
    else:
        return jsonify({"status": "error", "message": "Incorrect OTP. Please try again."})

@app.route('/add-password', methods=['POST'])
def add_password():
    try:
        data = request.get_json()
        email = data.get('email')
        website = data.get('website')
        username = data.get('username')
        password = data.get('password')

        print(f"[POST] New password being added for: email={email}, website={website}, username={username}")

        if not all([email, website, username, password]):
            return jsonify({"status": "error", "message": "All fields are required."}), 400

        encrypted = encrypt_password(password)

        # 1. To fetch the current vault
        vault = get_vault(email)
        if not vault:
            vault = {}

        if website not in vault:
            vault[website] = []

        # 2. For new entry
        vault[website].append({
            "username": username,
            "password": encrypted
        })

        # 3. Upload updated vault
        upload_vault(email, vault)
        print("[UPLOAD] Vault shards uploaded successfully.")

        activities_collection.insert_one({
    "email": email,
    "action": "Added password",
    "website": website,
    "timestamp": datetime.now()
})



        return jsonify({"status": "success", "message": "Password added"}), 200

    except Exception as e:
        print(f"Error in /add-password: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

from bson import ObjectId
from flask import jsonify

def object_id_to_str(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@app.route('/get-passwords', methods=['GET'])
def get_passwords():
    try:
        email = request.args.get('email')
        print(f"[GET] Fetching vault for {email}")
        vault = get_vault(email)
        if not vault:
            return jsonify([]), 200
        
        flat_list = []

        for site in vault:
            for pw in vault[site]:
                decrypted = decrypt_password(pw["password"])
                flat_list.append({
                    "website": site,
                    "username": pw["username"],
                    "password": decrypted if decrypted else "Decryption Error"
                })

        return jsonify(flat_list), 200

    except Exception as e:
        print(f"Error in /get-passwords: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route('/update-password', methods=['PUT'])
def update_password():
    try:
        data = request.get_json()
        website = data.get('website')
        username = data.get('username')
        new_password = data.get('password')

        if not website or not username or not new_password:
            return jsonify({"status": "error", "message": "All fields are required."}), 400

        encrypted_password = encrypt_password(new_password)
        result = vault_collection.update_one({"website": website, "username": username},
                                             {"$set": {"password": encrypted_password}})

        if result.matched_count == 0:
            return jsonify({"status": "error", "message": "Password not found."}), 404

        return jsonify({"status": "success", "message": "Password updated successfully!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/delete-password', methods=['DELETE'])
def delete_password():
    try:
        data = request.get_json()
        email = data.get('email')
        website = data.get('website')
        username = data.get('username')

        print(f"[DELETE] {email} {website} {username}")

        if not email or not website or not username:
            return jsonify({"status": "error", "message": "Email, website, and username are required."}), 400


        vault = get_vault(email)
        if not vault or website not in vault:
            return jsonify({"status": "error", "message": "Website not found"}), 404

        original_len = len(vault[website])
        vault[website] = [pw for pw in vault[website] if pw["username"] != username]

        if not vault[website]:
            del vault[website]

        if len(vault.get(website, [])) != original_len:
            upload_vault(email, vault)

            activities_collection.insert_one({
    "email": email,
    "action": "Deleted password",
    "website": website,
    "timestamp": datetime.now()
})


        return jsonify({"status": "success", "message": "Password deleted"}), 200

    except Exception as e:
        print(f"Error in /delete-password: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/edit-password', methods=['PUT'])
def edit_password():
    try:
        data = request.get_json()
        email = data.get('email')
        website = data.get('website')
        username = data.get('username')
        new_password = data.get('password')

        print(f"[EDIT] Request for {email} - {website} - {username}")

        if not all([email, website, username, new_password]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        vault = get_vault(email)
        if not vault or website not in vault:
            return jsonify({"status": "error", "message": "Password entry not found"}), 404

        updated = False
        for entry in vault[website]:
            if entry["username"] == username:
                entry["password"] = encrypt_password(new_password)
                updated = True
                break

        if not updated:
            return jsonify({"status": "error", "message": "Password entry not found"}), 404

        upload_vault(email, vault)
        print("[EDIT] Password updated and vault re-uploaded.")

        activities_collection.insert_one({
    "email": email,
    "action": "Edited password",
    "website": website,
    "timestamp": datetime.now()
})


        return jsonify({"status": "success", "message": "Password updated"}), 200

    except Exception as e:
        print(f"Error in /edit-password: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/enable-mfa', methods=['POST'])
def enable_mfa():
    try:
        data = request.get_json()
        email = data.get('email')
        enable = data.get('enable')

        if enable:
            users_collection.update_one({"email": email}, {"$set": {"mfa_enabled": True}})
            return jsonify({"status": "success", "message": "MFA enabled."}), 200
        else:
            users_collection.update_one({"email": email}, {"$set": {"mfa_enabled": False}})
            return jsonify({"status": "success", "message": "MFA disabled."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/secure-login', methods=['POST'])
def secure_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({"status": "error", "message": "User not found. Please register first."})

    if decrypt_password(user['password']) != password:
        return jsonify({"status": "error", "message": "Incorrect password. Please try again."})

    if user.get("mfa_enabled"):
        otp = random.randint(100000, 999999)
        otp_storage[email] = {"otp": otp, "timestamp": time.time()}
        if send_otp_email(email, otp):
            return jsonify({"status": "mfa_required", "message": "OTP sent successfully!"})
        else:
            return jsonify({"status": "error", "message": "Failed to send OTP. Try again later."})

    return jsonify({"status": "success", "message": "Login successful!"})


@app.route('/change-password', methods=['POST'])
def change_password():
    try:
        data = request.get_json()
        email = data.get('email')
        old_password = data.get('old_password')
        new_password = data.get('new_password')


        user = users_collection.find_one({"email": email})
        print(email)
        print(user)
        print(old_password)
        print(decrypt_password(user["password"]))
        if not user or decrypt_password(user["password"]) != old_password:
            return jsonify({"status": "error", "message": "Old password is incorrect."}), 401

        encrypted_password = encrypt_password(new_password)
        users_collection.update_one({"email": email}, {"$set": {"password": encrypted_password}})

        return jsonify({"status": "success", "message": "Password changed successfully!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get-user-settings', methods=['POST'])
def get_user_settings():
    try:
        data = request.get_json()
        email = data.get('email')

        user = users_collection.find_one({"email": email}, {"_id": 0, "mfa_enabled": 1, "auto_logout": 1})
        if not user:
            return jsonify({"status": "error", "message": "User not found."}), 404

        return jsonify(user), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/share-password', methods=['POST'])
def share_password():
    data = request.get_json()
    sender = data['sender_email']
    recipient = data['recipient_email']
    website = data['website']
    username = data['username']
    password = data['password']
    expiry_minutes = data['expiry']

    token = str(uuid4())
    expiry_time = time.time() + (expiry_minutes * 60)

    shared_links[token] = {
        "sender": sender,
        "website": website,
        "username": username,
        "password": password,
        "expires_at": expiry_time
    }

    shared_url = f"https://password-manager-backend-298931957092.us-central1.run.app/shared/{token}"
    email_body = f"""
Hi,

{sender} has shared a password with you.

Website: {website}
Username: {username}
Link to view the password (valid for {expiry_minutes} minute(s)):
{shared_url}

If the link has expired, please request it again.

- Secure Vault Team
"""

    if send_otp_email(email=recipient, otp=email_body):
        return jsonify({"status": "success", "message": "Password shared via link!"}), 200
    else:
        return jsonify({"status": "error", "message": "Failed to share password. Try again later."}), 500


@app.route('/shared/<token>', methods=['GET'])
def access_shared_password(token):
    shared_data = shared_links.get(token)

    if not shared_data:
        return render_template('link_expired.html'), 404

    if time.time() > shared_data['expires_at']:
        del shared_links[token]
        return render_template('link_expired.html'), 403

    return render_template(
        'shared_password.html',
        website=shared_data['website'],
        username=shared_data['username'],
        password=shared_data['password']
    )

@app.route("/backup", methods=["POST"])
def backup_data():
    try:
        data = request.get_json()
        email = data.get("email")

        vault = get_vault(email)
        if not vault:
            return jsonify({"status": "error", "message": "No vault data to back up."}), 400

        shard_and_upload_backup(email, vault)

        return jsonify({"status": "success", "message": "Backup saved to GCS in shards."}), 200

    except Exception as e:
        print(f"[BACKUP ERROR] {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/restore", methods=["POST"])
def restore_data():
    try:
        data = request.get_json()
        email = data.get("email")

        restore_from_sharded_backup(email)

        return jsonify({"status": "success", "message": "Vault restored from backup."}), 200
    except Exception as e:
        print(f"[RESTORE ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/get-backup-history", methods=["POST"])
def get_backup_history():
    email = request.json.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    email_tag = email.replace('@', '_')
    s3 = boto3.client("s3")
    gcs = storage.Client()

    s3_keys = []
    gcs_keys = []

    try:
        aws_objects = s3.list_objects_v2(Bucket=AWS_BUCKET, Prefix="backups_sharded/")
        s3_keys = [obj["Key"] for obj in aws_objects.get("Contents", []) if email_tag in obj["Key"]]
    except Exception as e:
        print(f"[HISTORY ERROR] S3 listing failed: {e}")

    try:
        gcs_blobs = gcs.bucket(GCS_BUCKET).list_blobs(prefix="backups_sharded/")
        gcs_keys = [blob.name for blob in gcs_blobs if email_tag in blob.name]
    except Exception as e:
        print(f"[HISTORY ERROR] GCS listing failed: {e}")

    all_keys = s3_keys + gcs_keys
    timestamps = set()

    for key in all_keys:
        match = re.search(rf"{email_tag}_backup_shard\d+_(\d{{4}}-\d{{2}}-\d{{2}}_\d{{2}}-\d{{2}}-\d{{2}})\.json$", key)
        if match:
            timestamps.add(match.group(1))

    print(f"[DEBUG] Found backup timestamps: {sorted(timestamps)}")

    return jsonify([{"timestamp": ts} for ts in sorted(timestamps)])


@app.route("/log-activity", methods=["POST"])
def log_activity():
    data = request.get_json()
    email = data.get("email")
    action = data.get("action")
    website = data.get("website")

    if not all([email, action, website]):
        return jsonify({"status": "error", "message": "Missing fields"}), 400

    activity = {
        "email": email,
        "action": action,
        "website": website,
        "timestamp": datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    }

    db.recent_activities.insert_one(activity)
    return jsonify({"status": "success", "message": "Activity logged"}), 200

@app.route("/get-activities", methods=["POST"])
def get_activities():
    data = request.get_json()
    email = data.get("email")

    activities = list(activities_collection.find({"email": email}).sort("timestamp", -1))
    serialized_activities = [serialize_activity(act) for act in activities]

    return jsonify({"activities": serialized_activities})


@app.route("/delete-activity", methods=["DELETE"])
def delete_activity():
    data = request.get_json()
    activity_id = data.get("id")

    if not activity_id:
        return jsonify({"status": "error", "message": "Activity ID is required"}), 400

    db.recent_activities.delete_one({"_id": ObjectId(activity_id)})
    return jsonify({"status": "success", "message": "Activity deleted"})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    email = data.get('email')
    profile_pic = data.get('profile_pic')

    if not email:
        return jsonify({"status": "error", "message": "Email is required"}), 400

    result = users_collection.update_one(
        {"email": email},
        {"$set": {"profile_pic": profile_pic}}
    )

    if result.matched_count == 0:
        return jsonify({"status": "error", "message": "User not found"}), 404

    return jsonify({"status": "success", "message": "Profile updated!"}), 200

@app.route('/get-user-profile', methods=['POST'])
def get_user_profile():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400

        user = users_collection.find_one(
            {"email": email},
            {"_id": 0, "username": 1, "profile_pic": 1, "email": 1}
        )

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify({"status": "success", "user": user}), 200

    except Exception as e:
        print("Error fetching user profile:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/reset-password', methods=['POST'])
def reset_password():
        try:
            data = request.get_json()
            email = data.get("email")
            token = data.get("token")
            new_password = data.get("new_password")

            user = users_collection.find_one({"email": email})

            if not user or user.get("reset_token") != token:
                return jsonify({"status": "error", "message": "Invalid or expired token."}), 400

            if datetime.now() > user.get("reset_token_expiry"):
                return jsonify({"status": "error", "message": "Token expired."}), 400

            encrypted = encrypt_password(new_password)

            users_collection.update_one({"email": email}, {
                "$set": {"password": encrypted},
                "$unset": {"reset_token": "", "reset_token_expiry": ""}
            })

            return jsonify({"status": "success", "message": "Password reset successful!"}), 200
        except Exception as e:
            print(f"Error in reset-password: {e}")
            return jsonify({"status": "error", "message": "Something went wrong."}), 500
        

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get("email")

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "Email not registered"}), 404

        reset_link = f"https://password-manager-frontend-298931957092.us-central1.run.app/reset-password?email={email}"

        msg = MIMEMultipart()
        msg['From'] = "pratikraj590@gmail.com"
        msg['To'] = email
        msg['Subject'] = "Password Reset Request"

        body = f"""
        Hello,

        You requested a password reset for your account.

        Click the link below to reset your password:
        {reset_link}

        If you did not make this request, you can safely ignore this email.

        Thanks,
        Password Manager Team
        """
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login("pratikraj590@gmail.com", "hxbx kxuu fbmd mqsq")
            server.send_message(msg)

        return jsonify({"status": "success", "message": "Password reset email sent."})

    except Exception as e:
        print(f"Error in /forgot-password: {str(e)}")
        return jsonify({"status": "error", "message": "Something went wrong"}), 500

        

@app.route('/forgot-reset-password', methods=['POST'])
def forgot_reset_password():
    try:
        data = request.get_json()
        email = data.get("email")
        new_password = data.get("password")

        if not email or not new_password:
            return jsonify({"status": "error", "message": "Missing email or new password"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        encrypted_password = encrypt_password(new_password)
        users_collection.update_one(
            {"email": email},
            {"$set": {"password": encrypted_password}}
        )

        return jsonify({"status": "success", "message": "Password updated successfully!"}), 200

    except Exception as e:
        print(f"Error in /forgot-reset-password: {str(e)}")
        return jsonify({"status": "error", "message": "Something went wrong"}), 500


# if __name__ == "__main__":
#     app.run(debug=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)

