from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from cryptography.fernet import Fernet  # AES encryption for passwords
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import os
import base64

# Key and IV generation (for AES encryption)
key = os.urandom(32)  # AES-256 requires a 32-byte key
iv = os.urandom(16)   # Initialization Vector (16 bytes for AES)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
CORS(app, origins=["http://localhost:3000"])

client = MongoClient("mongodb://localhost:27017/")
db = client["Project"]
users_collection = db["users"]
vault_collection = db["vault"]  # New collection for passwords

otp_storage = {}

# Generate a key for AES encryption
key = b"mysecretaeskey16"  # Exactly 16 bytes for AES-128
 # Example: AES-128 key (16 bytes)

# Ensure the key length is valid (16, 24, or 32 bytes)
if len(key) not in [16, 24, 32]:
    raise ValueError("Encryption key must be 16, 24, or 32 bytes long")

# Function to encrypt the password
def encrypt_password(plain_password):
    try:
        # Generate a random 16-byte IV for encryption
        iv = os.urandom(16)

        # Padding to ensure the password length is a multiple of block size (16 bytes)
        padder = padding.PKCS7(128).padder()
        padded_password = padder.update(plain_password.encode()) + padder.finalize()

        # Create cipher object with AES and CBC mode
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        # Encrypt the padded password
        encrypted_password = encryptor.update(padded_password) + encryptor.finalize()

        # Combine IV and encrypted password, then encode as Base64
        encrypted_data = iv + encrypted_password  # IV + encrypted data
        encrypted_data_b64 = base64.urlsafe_b64encode(encrypted_data).decode()

        return encrypted_data_b64

    except Exception as e:
        print(f"Encryption failed: {str(e)}")
        return None


# Function to decrypt the password
def decrypt_password(encrypted_password_b64):
    try:
        # Decode the Base64-encoded encrypted password (with IV prepended)
        encrypted_data = base64.urlsafe_b64decode(encrypted_password_b64)

        # Extract the IV (first 16 bytes) and the encrypted password
        iv = encrypted_data[:16]  # First 16 bytes are the IV
        encrypted_password_bytes = encrypted_data[16:]  # Remaining bytes are the encrypted password

        # Create cipher object with AES and CBC mode
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()

        # Decrypt the encrypted password
        decrypted_padded_password = decryptor.update(encrypted_password_bytes) + decryptor.finalize()

        # Unpad the decrypted password using PKCS7 padding
        unpadder = padding.PKCS7(128).unpadder()  # PKCS7 unpadding
        decrypted_password = unpadder.update(decrypted_padded_password) + unpadder.finalize()

        # Return the decrypted password as a string
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


@app.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required."}), 400

        if users_collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Email already registered."}), 200

        otp = random.randint(100000, 999999)
        otp_storage[email] = {"otp": otp, "password": password, "timestamp": time.time()}

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
        timestamp = otp_data["timestamp"]

        if time.time() - timestamp > 600:
            return jsonify({"status": "error", "message": "OTP expired. Please register again."}), 201

        if user_otp != stored_otp:
            return jsonify({"status": "error", "message": "Incorrect OTP. Please try again."}), 201

        encrypted_password = encrypt_password(password)

        user_data = {
            "email": email,
            "password": encrypted_password,
            "timeout": 10
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
        timeout = data.get("timeout")  # Time in minutes

        # Validate input
        if not email or timeout is None:
            print(email, timeout)
            return jsonify({"status": "error", "message": "Missing email or timeout"}), 400

        # Update the timeout field in the user document
        users_collection.update_one(
            {"email": email},  # Query to find the user by email
            {'$set': {'timeout': float(timeout)}}  # Update the timeout field
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
        email = data.get('email')  # Extract the email from the request body
        website = data.get('website')
        username = data.get('username')
        password = data.get('password')

        print(email, username, website, username, password)
        # Validate required fields
        if not email or not website or not username or not password:
            return jsonify({"status": "error", "message": "All fields are required."}), 400

        # Encrypt password before saving
        encrypted_password = encrypt_password(password)

        if not encrypted_password:
            return jsonify({"status": "error", "message": "Error encrypting password."}), 500

        # If email exists, add the password to the user's array
        result = vault_collection.update_one(
            {"email": email},  # Find the user by email
            {"$push": {"passwords": {"website": website, "username": username, "password": encrypted_password}}},
            upsert=True  # If no document is found with the email, create a new document
        )

        # After updating or creating the document, check for success
        if result.matched_count > 0 or result.upserted_id:
            return jsonify({"status": "success", "message": "Password stored successfully!"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to add password."}), 500

    except Exception as e:
        return jsonify({"status": "error", "message": f"Error adding password: {str(e)}"}), 500


from bson import ObjectId
from flask import jsonify

# Function to convert ObjectId to string
def object_id_to_str(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@app.route('/get-passwords', methods=['GET'])
def get_passwords():
    try:
        email = request.args.get('email')  # Get email from the request parameters
        if not email:
            return jsonify({"status": "error", "message": "Email is required."}), 400

        # Retrieve user's passwords based on email
        user_data = vault_collection.find_one({"email": email})
        if not user_data or "passwords" not in user_data:
            return jsonify({"status": "error", "message": "No passwords found for this email."}), 404

        passwords = []
        for pw in user_data["passwords"]:
            # Decrypt password before sending
            decrypted_password = decrypt_password(pw['password'])
            if decrypted_password:
                pw["password"] = decrypted_password
            else:
                pw["password"] = "Error decrypting"
            passwords.append(pw)

        return jsonify(passwords), 200

    except Exception as e:
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

        print(email, website, username)

        if not email or not website or not username:
            return jsonify({"status": "error", "message": "Email, website, and username are required."}), 400

        # Remove password entry from the user's passwords array
        result = vault_collection.update_one(
            {"email": email},
            {"$pull": {"passwords": {"website": website, "username": username}}}
        )

        if result.modified_count == 0:
            return jsonify({"status": "error", "message": "Password not found."}), 404

        return jsonify({"status": "success", "message": "Password deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/edit-password', methods=['PUT'])
def edit_password():
    try:
        data = request.get_json()
        email = data.get('email')
        website = data.get('website')
        username = data.get('username')
        new_password = data.get('password')
        new_website = data.get('new_website')  # New website field
        new_username = data.get('new_username')  # New username field

        if not email or not website or not username or (not new_password and not new_website and not new_username):
            return jsonify({"status": "error", "message": "All fields are required."}), 400

        # Prepare update payload
        update_data = {}
        if new_password:
            encrypted_password = encrypt_password(new_password)
            update_data["password"] = encrypted_password
        if new_website:
            update_data["website"] = new_website
        if new_username:
            update_data["username"] = new_username

        # Find and update the password entry
        result = vault_collection.update_one(
            {"email": email, "passwords.website": website, "passwords.username": username},
            {"$set": {"passwords.$.password": update_data.get("password"),
                      "passwords.$.website": website,
                      "passwords.$.username": username}}
        )

        if result.matched_count == 0:
            return jsonify({"status": "error", "message": "Password not found."}), 404

        return jsonify({"status": "success", "message": "Password updated successfully!"}), 200

    except Exception as e:
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




@app.route('/secure-login', methods=['POST'])  # New name
def secure_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({"status": "error", "message": "User not found. Please register first."})

    if decrypt_password(user['password']) != password:
        return jsonify({"status": "error", "message": "Incorrect password. Please try again."})

    # Check if MFA is enabled
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

if __name__ == "__main__":
    app.run(debug=True)
