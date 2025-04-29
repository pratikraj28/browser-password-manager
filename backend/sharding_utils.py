import json
import boto3
from google.cloud import storage
from botocore.exceptions import ClientError
from encryption_utils import encrypt_password, decrypt_password

# Bucket names
S3_BUCKET_NAME = "password-vault-shards"
GCS_BUCKET_NAME = "vault-password-gcs"


bucket_name_s3 = "password-vault-shards"
bucket_name_gcs = "vault-password-gcs"

s3_client = boto3.client("s3")
gcs_client = storage.Client()
gcs_bucket = gcs_client.bucket(bucket_name_gcs)

def upload_vault(email, vault_data):
    try:
        # Convert to encrypted string
        json_data = json.dumps(vault_data)
        encrypted_data = encrypt_password(json_data).encode()

        # Shard into 3 parts
        total = len(encrypted_data)
        part1 = encrypted_data[:total // 3]
        part2 = encrypted_data[total // 3:2 * total // 3]
        part3 = encrypted_data[2 * total // 3:]

        s3_client.put_object(Bucket=bucket_name_s3, Key=f"{email}_shard1", Body=part1)
        s3_client.put_object(Bucket=bucket_name_s3, Key=f"{email}_shard2", Body=part2)
        blob = gcs_bucket.blob(f"{email}_shard3")
        blob.upload_from_string(part3)

        print("[UPLOAD] Vault shards uploaded successfully.")

    except Exception as e:
        print(f"Upload failed: {e}")

def get_vault(email):
    try:
        shard1_key = f"{email}_shard1"
        shard2_key = f"{email}_shard2"
        shard3_key = f"{email}_shard3"

        # Read shards as raw binary (NOT json!)
        try:
            shard1_obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=shard1_key)
            part1 = shard1_obj['Body'].read()
        except Exception as e:
            print(f"[INFO] Shard1 not found: {e}")
            part1 = b''

        try:
            shard2_obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=shard2_key)
            part2 = shard2_obj['Body'].read()
        except Exception as e:
            print(f"[INFO] Shard2 not found: {e}")
            part2 = b''

        try:
            blob = gcs_client.bucket(GCS_BUCKET_NAME).blob(shard3_key)
            part3 = blob.download_as_bytes()
        except Exception as e:
            print(f"[INFO] Shard3 not found in GCS: {e}")
            part3 = b''

        # Combine all parts
        encrypted_data = part1 + part2 + part3

        if not encrypted_data:
            print("[INFO] Vault not found or empty, returning empty.")
            return {}

        # Decrypt and load vault
        decrypted_json = decrypt_password(encrypted_data.decode())
        vault = json.loads(decrypted_json)
        return vault

    except Exception as e:
        print(f"[ERROR] Failed to load vault: {str(e)}")
        return {}

#backup and restore
def save_to_gcs(path, data):
    client = storage.Client()
    bucket = client.bucket("vault-password-gcs")
    blob = bucket.blob(path)
    blob.upload_from_string(data)
    print(f"[BACKUP] Saved to GCS at {path}")

def load_from_gcs(path):
    try:
        client = storage.Client()
        bucket = client.bucket("vault-password-gcs")
        blob = bucket.blob(path)
        return blob.download_as_text()
    except Exception as e:
        print(f"[RESTORE ERROR] {str(e)}")
        return None