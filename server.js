const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://graceful-dasik-eee9df.netlify.app', // Allow requests from the deployed frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const db = new sqlite3.Database('./trend_request_form.db');

function logError(error) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - Error: ${error.message}\n${error.stack}\n\n`;
  fs.appendFile('server_error.log', logMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
}

async function createAdminUser() {
  const adminEmail = 'admin@example.com';
  const adminPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  db.run('INSERT OR REPLACE INTO users (fullName, email, bigoId, password, role) VALUES (?, ?, ?, ?, ?)',
    ['Admin User', adminEmail, 'ADMIN', hashedPassword, 'admin'],
    function(err) {
      if (err) {
        console.error('Error creating admin user:', err.message);
      } else {
        console.log('Admin user created successfully');
        console.log('Admin email:', adminEmail);
        console.log('Admin password:', adminPassword);
      }
    }
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }
}

app.post('/register', async (req, res) => {
  const { fullName, email, bigoId, password } = req.body;

  if (!fullName || !email || !bigoId || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (fullName, email, bigoId, password) VALUES (?, ?, ?, ?)',
      [fullName, email, bigoId, hashedPassword],
      function(err) {
        if (err) {
          logError(err);
          return res.status(500).json({ error: 'Error registering user' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (error) {
    logError(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      logError(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.json({ token, role: user.role });
    } catch (error) {
      logError(error);
      res.status(500).json({ error: 'An error occurred during login' });
    }
  });
});

app.post('/submit', authenticateToken, (req, res) => {
  const { fullName, email, bigoId, reason } = req.body;

  // Log the received form data
  console.log('Received form data:', { fullName, email, bigoId, reason });

  // Temporarily disable email sending
  // const mailOptions = {
  //   from: process.env.EMAIL_USER,
  //   to: process.env.EMAIL_USER,
  //   subject: 'New Trend Request',
  //   text: `Full Name: ${fullName}\nEmail: ${email}\nBigo ID: ${bigoId}\nReason: ${reason}`
  // };

  // transporter.sendMail(mailOptions, (error, info) => {
  //   if (error) {
  //     logError(error);
  //     return res.status(500).send('Error sending email. Please try again later.');
  //   }
  //   res.status(200).send('Request submitted successfully');
  // });

  try {
    // Send a success response without attempting to send an email
    res.status(200).send('Request submitted successfully');
  } catch (error) {
    logError(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});

app.post('/approve', authenticateToken, (req, res) => {
  const { email } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Trend Request Approved',
    text: 'Your trend request has been approved!'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logError(error);
      return res.status(500).send('Error sending approval email. Please try again later.');
    }
    res.status(200).send('Approval email sent successfully');
  });
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await createAdminUser();
});

async function createAdminUser() {
  const adminEmail = 'admin@example.com';
  const adminPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await db.run('INSERT OR REPLACE INTO users (fullName, email, bigoId, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Admin User', adminEmail, 'ADMIN', hashedPassword, 'admin']);
    console.log('Admin user created successfully');
    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please save these credentials securely and change the password upon first login.');
  } catch (error) {
    logError(error);
    console.error('Error creating admin user');
  }
}
