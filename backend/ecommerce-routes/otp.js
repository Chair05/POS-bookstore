const { Router } = require('express');
const crypto = require('crypto');
const { promisePool } = require('../db');

const router = Router();

let transporterPromise = null;
let nodemailer = null;

try {
  nodemailer = require('nodemailer');
  transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
    console.log('Ethereal test account ready:', testAccount.user);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  });
} catch {
  console.log('nodemailer not installed — OTP will be logged to console only');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function sendOtpEmail(email, otp) {
  if (!transporterPromise) {
    console.log(`\n==============================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`==============================\n`);
    return;
  }
  try {
    const transporter = await transporterPromise;
    const info = await transporter.sendMail({
      from: 'LCCB Bookstore <noreply@ethereal.email>',
      to: email,
      subject: 'LCCB Bookstore — Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">LCCB Bookstore</h2>
          <p style="color: #374151; font-size: 15px;">Use the code below to verify your account:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    console.log('OTP email preview:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.log(`\n==============================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`==============================\n`);
    console.error('Email send error:', err.message);
  }
}

router.post('/send', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (purpose !== 'login' && purpose !== 'register') {
      return res.status(400).json({ message: 'Purpose must be login or register' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await promisePool.query(
      'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, purpose, expiresAt]
    );

    await sendOtpEmail(email, otp);

    const [rows] = await promisePool.query(
      'SELECT id FROM otp_codes WHERE email = ? AND purpose = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      [email, purpose]
    );

    res.json({
      message: 'OTP sent to your email',
      otpId: rows.length > 0 ? rows[0].id : null,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: 'Email, OTP, and purpose are required' });
    }

    const [rows] = await promisePool.query(
      'SELECT id, expires_at FROM otp_codes WHERE email = ? AND otp_code = ? AND purpose = ? AND used = 0 ORDER BY id DESC LIMIT 1',
      [email, otp, purpose]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    const record = rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' });
    }

    await promisePool.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [record.id]);

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

module.exports = router;
