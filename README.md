# Browser-Based Password Manager

A secure, browser-based password manager built using **React.js (frontend)**, **Flask (backend)**, and **MongoDB** for encrypted vault storage. This tool allows users to securely store, manage, and share passwords with features like **AES-256 encryption**, **OTP-based multi-factor authentication**, **virtual keyboard protection**, **cloud backup**, and a fully responsive dashboard.

---

## Features

- AES-256 encryption for password storage  
- OTP-based multi-factor authentication (login and registration)  
- Virtual keyboard to prevent keylogging attacks  
- Password generator with strength meter  
- Secure password sharing via expiring tokens  
- Auto logout configuration for user inactivity  
- Backup & restore using AWS S3 and Google Cloud Storage  
- Dashboard to manage stored credentials  
- Password strength validation during registration/reset  

---

## Tech Stack

### Frontend:
- React.js  
- Tailwind CSS  
- React Router DOM  
- Context API  

### Backend:
- Flask (Python)  
- MongoDB Atlas  
- Boto3 (AWS SDK for Python)  
- Google Cloud Storage SDK  
- AES Encryption using `cryptography` module  

---

2. Install Dependencies
   Backend (Flask):
    cd backend
    pip install -r requirements.txt

   Frontend (React):
     cd ..
     npm install

3. Create Local Config File
  In the backend/ folder, create a file called config_local.py with the following content:
  MONGO_URI = "your-mongodb-uri"
  AES_KEY = b"your-32-byte-secret-aes-key"
NOTE: This file is ignored from GitHub using .gitignore

4. Run the Application
   Start Backend:
   cd backend
   python app.py

  Start Frontend:
  cd ..
  npm start

  Visit: http://localhost:3000

Project Structure

  backend/
  │   app.py
  │   config_local.py
  │   encryption_utils.py
  │   backup_utils.py
  │   ...
  src/
  │   App.js
  │   AuthContext.js
  │   components/
  │     ├── Login.js
  │     ├── Register.js
  │     ├── DashboardView.js
  │     ├── SettingsView.js
  │     └── ...
  public/
  │   images/
  │   index.html


Security Highlights
  -AES-256 encryption ensures safe password storage
  -Secrets and config files are excluded from GitHub
  -OTP-based MFA protects account access
  -Time-limited password sharing tokens prevent misuse

Future Enhancements
  -Mobile App (React Native / Flutter)
  -Dark Web Monitoring for leaked credentials
  -Email alerts on login or vault access


Author
Pratik Raj
pratikraj590@gmail.com
https://github.com/pratikraj28






