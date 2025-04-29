from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64
import os

# Fixed 16-byte AES key (store in .env or secrets later)
SECRET_KEY = b'ThisIsASecretKey'  # Must be 16, 24, or 32 bytes

def encrypt_password(raw: str) -> str:
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(raw.encode('utf-8'), AES.block_size))
    iv = base64.b64encode(cipher.iv).decode('utf-8')
    ct = base64.b64encode(ct_bytes).decode('utf-8')
    return iv + ":" + ct

def decrypt_password(enc: str) -> str:
    try:
        iv, ct = enc.split(":")
        iv = base64.b64decode(iv)
        ct = base64.b64decode(ct)
        cipher = AES.new(SECRET_KEY, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')
    except Exception as e:
        print(f"Decryption failed: {e}")
        return None