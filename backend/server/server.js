// server.js (Backend server)
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Simulate OTP sending (replace with your own OTP service)
app.post('/send-otp', (req, res) => {
  const { email } = req.body;

  // Generate a fake OTP for demonstration
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  // Send OTP to the user's email (using nodemailer)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send({ status: 'error', message: 'OTP sending failed' });
    }
    res.status(200).send({ status: 'success', otp }); // Send OTP to client for demo purposes
  });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { otp, email } = req.body;

  // In a real app, compare with the OTP generated and sent
  if (otp === '123456') {
    return res.status(200).send({ status: 'success' });
  }

  res.status(400).send({ status: 'error', message: 'Invalid OTP' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
