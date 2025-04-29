import json
import os
import base64
import re
from datetime import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from google.cloud import storage as gcs_storage
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from sharding_utils import upload_vault  # for restoring final vault

backup_key = b"mysecretaeskey16"

# Bucket names
AWS_BUCKET = "vault-password-s3"
GCS_BUCKET = "vault-password-gcs"

# === Encryption / Decryption ===
def encrypt_data(data, key):
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(data.encode()) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()
    return base64.urlsafe_b64encode(iv + ciphertext).decode()

def decrypt_data(data, key):
    decoded = base64.urlsafe_b64decode(data.encode())
    iv, ciphertext = decoded[:16], decoded[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted = decryptor.update(ciphertext) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    return unpadder.update(decrypted) + unpadder.finalize()

# === Sharding ===
def shard_data(data_dict):
    items = list(data_dict.items())
    total = len(items)

    if total <= 3:
        # Return 1 item per shard
        return [{k: v} for k, v in items] + [{}] * (3 - total)

    third = (total + 2) // 3
    return [dict(items[i:i+third]) for i in range(0, total, third)]

# === BACKUP ===
def shard_and_upload_backup(email, backup_data):
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    shards = shard_data(backup_data)
    email_tag = email.replace('@', '_')

    for i, shard in enumerate(shards, 1):
        encrypted = encrypt_data(json.dumps(shard), backup_key)
        filename = f"{email_tag}_backup_shard{i}_{timestamp}.json"
        key_path = f"backups_sharded/{filename}"

        if i in [1, 2]:
            try:
                s3 = boto3.client("s3")
                s3.put_object(Bucket=AWS_BUCKET, Key=key_path, Body=encrypted)
                print(f"[BACKUP] Shard {i} uploaded to S3 as {key_path}")
            except NoCredentialsError:
                print("[ERROR] AWS credentials not found.")
            except ClientError as e:
                print(f"[ERROR] AWS S3 Error: {e}")
        else:
            try:
                print(f"[DEBUG] Uploading shard {i} to GCS at {key_path}")
                gcs_client = gcs_storage.Client()
                bucket = gcs_client.bucket(GCS_BUCKET)
                blob = bucket.blob(key_path)
                blob.upload_from_string(encrypted)
                print(f"[BACKUP] Shard {i} uploaded to GCS as {key_path}")
            except Exception as e:
                print(f"[ERROR] GCS Upload Error: {e}")

# === RESTORE ===
def restore_from_sharded_backup(email):
    email_tag = email.replace('@', '_')
    s3 = boto3.client("s3")
    gcs_client = gcs_storage.Client()

    try:
        aws_objects = s3.list_objects_v2(Bucket=AWS_BUCKET, Prefix="backups_sharded/")
        aws_files = [obj['Key'] for obj in aws_objects.get("Contents", []) if email_tag in obj['Key']]
    except ClientError as e:
        print(f"[RESTORE ERROR] AWS S3 list failed: {e}")
        aws_files = []

    try:
        gcs_blobs = list(gcs_client.bucket(GCS_BUCKET).list_blobs(prefix="backups_sharded/"))
        gcs_files = [blob.name for blob in gcs_blobs if email_tag in blob.name]
    except Exception as e:
        print(f"[RESTORE ERROR] GCS list failed: {e}")
        gcs_files = []

    timestamps = set()
    all_files = aws_files + gcs_files

    for f in all_files:
        match = re.search(rf"{email_tag}_backup_shard\d+_(\d{{4}}-\d{{2}}-\d{{2}}_\d{{2}}-\d{{2}}-\d{{2}})\.json$", f)
        if match:
            timestamps.add(match.group(1))

    if not timestamps:
        raise FileNotFoundError("No backup shards found.")

    latest = sorted(timestamps)[-1]
    print(f"[RESTORE] Using backup timestamp: {latest}")

    merged_data = {}

    for i in range(1, 4):
        filename = f"{email_tag}_backup_shard{i}_{latest}.json"
        key_path = f"backups_sharded/{filename}"
        encrypted_data = None

        try:
            if i in [1, 2]:
                obj = s3.get_object(Bucket=AWS_BUCKET, Key=key_path)
                encrypted_data = obj["Body"].read().decode()
            else:
                blob = gcs_client.bucket(GCS_BUCKET).blob(key_path)
                if not blob.exists():
                    raise FileNotFoundError(f"Shard {i} not found in GCS.")
                encrypted_data = blob.download_as_text()
        except Exception as e:
            print(f"[RESTORE ERROR] Failed to fetch shard {i}: {e}")
            raise

        decrypted = decrypt_data(encrypted_data, backup_key).decode()
        shard_part = json.loads(decrypted)
        merged_data.update(shard_part)

    upload_vault(email, merged_data)
    print(f"[RESTORE] Vault restored from sharded backup for {email}")
