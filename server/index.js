require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const PanelSettings = require('./models/PanelSettings');
const WorkOrder = require('./models/WorkOrder');
const Lead = require('./models/Lead');
const ServicePrice = require('./models/ServicePrice');
const PremiumUser = require('./models/PremiumUser');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage (upload to Cloudinary directly)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging
app.use((req, res, next) => {
  console.log('📥 Request:', req.method, req.path);
  next();
});

app.use(cors());
app.use(express.json());

console.log('__dirname:', __dirname);
console.log('User site path:', path.join(__dirname, '../Gharoo/Gharoo_client/dist'));
console.log('Admin path:', path.join(__dirname, '../client/dist'));
console.log('Service man path:', path.join(__dirname, '../service-man-client/dist'));

// Serve user site at root
app.use(express.static(path.join(__dirname, '../Gharoo/Gharoo_client/dist')));

// Serve admin panel at /admin
app.use('/admin', express.static(path.join(__dirname, '../client/dist')));

// Serve service man panel at /service
app.use('/service', express.static(path.join(__dirname, '../service-man-client/dist')));

// In-memory storage fallbacks
let inMemorySettings = null;
let inMemoryUsers = [];
let inMemoryPremiumUsers = [];
let nextUserId = 1;

// Helper function to get default settings
const getDefaultSettings = () => ({
  hero: {
    slides: [
      { eyebrow: 'Find The Best Support You Need Today.', titleTop: 'Current Solutions For', titleHighlight: 'Your Modern Problems', text: 'We provide expert repair services for all your electronic devices with fast turnaround and warranty-backed quality.', bg: '', side: '' },
      { eyebrow: 'Fast & Reliable Service', titleTop: 'Repairing Devices', titleHighlight: 'With Expert Care', text: 'Quick turnarounds and warranty-backed repairs for phones, laptops and appliances by certified technicians.', bg: '', side: '' },
      { eyebrow: 'Convenient Pickup & Delivery', titleTop: 'Doorstep Service', titleHighlight: 'For Your Convenience', text: 'Schedule a pickup and we will return your device fully tested and working — hassle-free service at your door.', bg: '', side: '' }
    ]
  },
  about: {
    eyebrow: 'ABOUT US',
    title: 'Welcome To Repair & Installing Company',
    description: 'We are a trusted electronics repair company offering comprehensive solutions for phones, laptops, tablets, and home appliances.',
    features: [
      { icon: '💰', title: 'Our Affordable Price', desc: 'Transparent pricing with no hidden fees — quality repairs at fair rates.' },
      { icon: '👨‍🔧', title: 'Customer Satisfied', desc: 'Thousands of happy customers trust us for reliable device repairs.' }
    ],
    mainImage: '',
    subImage: '',
    experience: {
      number: '25+',
      line1: 'Years Experiences',
      line2: 'Maintenance Services'
    }
  },
  services: {
    header: { label: 'WHAT WE DO', title: 'Our Core Repair Services', description: 'Expert solutions for every device — fast, affordable, and warranty-backed.' },
    items: [
      { icon: '📱', title: 'Phone Repair', desc: 'Screen, battery, and component repairs for all major smartphone brands.' },
      { icon: '💻', title: 'Laptop Repair', desc: 'Logic board, keyboard, and display repairs for laptops and notebooks.' },
      { icon: '🔧', title: 'Appliance Repair', desc: 'AC, washing machine, and home appliance diagnostics and fixes.' },
      { icon: '🔍', title: 'Diagnostics', desc: 'Comprehensive device health checks with detailed repair estimates.' }
    ]
  },
  testimonials: { items: [] },
  pricing: {
    header: { label: 'PRICING', title: 'Choose Your Plan', description: 'Simple, transparent pricing for all your repair needs.' },
    plans: []
  },
  contact: {
    title: 'Get In Touch', description: 'Have questions? We are here to help!', phone: '+91 1234567890', email: 'contact@gharoocare.com', address: '123 Main St, City, State'
  },
  stats: {
    items: [
      { icon: '🛠️', value: '1250', format: 'k', label: 'Successful Projects' },
      { icon: '👷', value: '500', format: 'plus', label: 'Experts Staffs' },
      { icon: '😊', value: '1330', format: 'k', label: 'Happy Customers' },
      { icon: '🏆', value: '100', format: 'percent', label: 'Quality Products' }
    ]
  },
  header: {
    logo: '/gharoo-logo.png',
    navLinks: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      // { text: 'Services', link: '/services' },
      // { text: 'Pricing', link: '/pricing' },
      { text: 'Contact', link: '/contact' }
    ]
  },
  footer: {
    description: 'Your trusted partner for all electronics repair needs.',
    copyright: '© 2026 Gharoo Care — All rights reserved.',
    socialLinks: [
      { platform: 'Facebook', url: '#' },
      { platform: 'Twitter', url: '#' },
      { platform: 'Instagram', url: '#' },
      { platform: 'LinkedIn', url: '#' }
    ]
  },
  brandMarquee: {
    brands: [
      'Apple Repair', 'Samsung Service', 'Dell Support', 'HP Certified',
      'Lenovo Fix', 'Asus Care', 'Sony Repair', 'LG Service',
      'Microsoft', 'Google Pixel', 'OnePlus', 'Xiaomi'
    ]
  },
  newSection: {
    features: [
      { title: 'Skilled Technicians', description: 'Our certified experts handle every repair with precision and care, using industry-standard tools and techniques.' },
      { title: '24/7 Our Service', description: 'Round-the-clock support and emergency repair services so your devices are never out of action for long.' },
      { title: 'Quality Guarantee', description: 'Every repair is backed by our warranty — we stand behind our work with transparent pricing and honest service.' }
    ]
  },
  whyChoose: {
    eyebrow: 'WHY CHOOSE US',
    title: 'When You Need Repair We Are Always Here',
    description: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service. We understand the importance of keeping your devices running smoothly.',
    mainImage: '',
    subImage: '',
    cards: [
      { title: 'Warranty Service', desc: 'All repairs come with a comprehensive warranty for your peace of mind.', icon: '📦' },
      { title: 'Customer Service', desc: 'Friendly support team ready to assist you at every step of the process.', icon: '🤝' },
      { title: 'Secured Device', desc: 'Your data and devices are handled with strict security protocols.', icon: '🔒' },
      { title: 'No Virus Threat', desc: 'Thorough malware scans and clean software installs on every device.', icon: '🛡️' }
    ]
  },
  completedProjects: { label: 'LATEST PROJECTS', title: 'Our Completed Projects', projects: [] },
  serviceSlider: {
    eyebrow: 'OUR SERVICES',
    title: "Let's Check Our Best Repair Services In City",
    description: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service.',
    services: [
      { title: 'Hardware Update Service', desc: 'Upgrade components and boost performance with certified parts and expert installation.', icon: '⚙️' },
      { title: 'Tablets & iPad Services', desc: 'Screen, battery and software repairs for all tablet brands and models.', icon: '📱' },
      { title: 'Laptop & Desktop Repair', desc: 'Full diagnostics, logic board repair, and component replacement services.', icon: '💻' },
      { title: 'Software Installation', desc: 'OS installs, driver updates, and malware removal by trained technicians.', icon: '💿' },
      { title: 'Data Recovery', desc: 'Recover lost files from damaged drives, phones, and storage devices.', icon: '🛡️' }
    ]
  }
});

// Connect to MongoDB function for serverless environments
let isMongoConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isMongoConnected = true;
    console.log('Connected to MongoDB successfully!');
    
    // Initialize default panel settings if none exists
    const existingSettings = await PanelSettings.findOne();
    if (!existingSettings) {
      const defaultSettings = new PanelSettings(getDefaultSettings());
      await defaultSettings.save();
      console.log('Default panel settings created!');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isMongoConnected = false;
    if (!inMemorySettings) {
      inMemorySettings = getDefaultSettings();
    }
  }
};

// Initiate connection immediately (root scope)
connectDB();

// Middleware to ensure DB connection is active before processing api requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    await connectDB();
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running smoothly!', mongoConnected: isMongoConnected });
});

// Image upload to Cloudinary
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'gharoocare'
    });

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// Get all users (if MongoDB connected, else use in-memory)
app.get('/api/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await User.find();
      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        status: user.status,
        joined: user.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        avatar: user.avatar
      }));
      res.json(formattedUsers);
    } else {
      const formattedUsers = inMemoryUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        team: user.team,
        status: user.status,
        joined: user.joined,
        avatar: user.avatar
      }));
      res.json(formattedUsers);
    }
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get users by role
app.get('/api/users/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    if (isMongoConnected) {
      const users = await User.find({ role });
      const formattedUsers = users.map(user => ({
        _id: user._id,
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        team: user.team,
        service: user.service || '',
        status: user.status,
        joined: user.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: user.createdAt,
        avatar: user.avatar
      }));
      res.json(formattedUsers);
    } else {
      const filteredUsers = inMemoryUsers.filter(user => user.role === role);
      const formattedUsers = filteredUsers.map(user => ({
        _id: user.id,
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        team: user.team,
        service: user.service || '',
        status: user.status,
        joined: user.joined,
        createdAt: user.createdAt,
        avatar: user.avatar
      }));
      res.json(formattedUsers);
    }
  } catch (err) {
    console.error('Get users by role error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, team, service, notes, password } = req.body;

    if (isMongoConnected) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      // Hash password (use provided password or default)
      const userPassword = password || 'password123';
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        role,
        team,
        service: service || '',
        notes,
        password: hashedPassword
      });

      await newUser.save();
      res.json({ success: true, message: 'User created successfully!' });
    } else {
      // Check existing in in-memory
      const existingUser = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const newUser = {
        id: nextUserId++,
        _id: nextUserId - 1,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        role,
        team,
        service: service || '',
        notes,
        password: password || 'password123', // No hash for in-memory, for demo only
        status: 'Active',
        avatar: '/assets/images/avatar/avatar-1.jpg',
        joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date()
      };
      inMemoryUsers.push(newUser);
      res.json({ success: true, message: 'User created successfully!' });
    }
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!isMongoConnected) {
      const user = inMemoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const isPasswordValid = user.password.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Service man login — only users with role "Service Man"
app.post('/api/service-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!isMongoConnected) {
      const user = inMemoryUsers.find(
        u => u.email.toLowerCase() === normalizedEmail && u.role === 'Service Man'
      );
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const isPasswordValid = user.password.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    }

    const user = await User.findOne({ email: normalizedEmail, role: 'Service Man' });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact admin.' });
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('Service login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    let user = null;
    if (isMongoConnected) {
      user = await User.findOne({ email: email.toLowerCase() });
      // Self-healing: if admin email doesn't exist in DB, create/seed it dynamically
      if (!user && email.toLowerCase() === 'gharoocare@gmail.com') {
        const hashedPassword = await bcrypt.hash('Gharoocare!@#$123', 10);
        user = new User({
          firstName: 'Admin',
          lastName: 'User',
          email: 'gharoocare@gmail.com',
          phone: '9974389486',
          role: 'admin',
          team: 'Management',
          status: 'Active',
          password: hashedPassword
        });
        await user.save();
      }
    } else {
      user = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user && email.toLowerCase() === 'gharoocare@gmail.com') {
        user = {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'gharoocare@gmail.com',
          role: 'admin',
          team: 'Management',
          status: 'Active',
          password: 'password123'
        };
        inMemoryUsers.push(user);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address.' });
    }

    // Generate token and expiry
    const crypto = require('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour expiration

    if (isMongoConnected) {
      user.resetPasswordToken = token;
      user.resetPasswordExpires = expires;
      await user.save();
    } else {
      user.resetPasswordToken = token;
      user.resetPasswordExpires = expires;
    }

    // Configure Mailer
    const nodemailer = require('nodemailer');
    const isVercel = !!process.env.VERCEL;
    
    // Get transporter dynamically (using SMTP env, Gmail service env, or dev fallback)
    const getTransporter = async () => {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace(/\s/g, ''),
          },
        });
      }
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, ''),
          }
        });
      }
      // Ethereal only for local dev — unreliable on Vercel serverless
      if (!isVercel && process.env.NODE_ENV !== 'production') {
        try {
          const testAccount = await nodemailer.createTestAccount();
          return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        } catch (err) {
          console.error('Failed to create SMTP test account:', err);
        }
      }
      return {
        sendMail: async (options) => {
          console.log('--- SMTP SIMULATION ---');
          console.log('To:', options.to);
          console.log('Subject:', options.subject);
          console.log('Reset link in body');
          console.log('-----------------------');
          return { messageId: 'simulated-id' };
        }
      };
    };

    const transporter = await getTransporter();
    
    // Build reset link from referer/origin (dev) or APP_URL (production / mobile email)
    const referer = req.headers.referer || req.headers.origin || '';
    const isService = referer.includes('/service');
    const pathPrefix = isService ? '/service' : '/admin';
    let baseUrl;
    try {
      const refUrl = new URL(referer);
      baseUrl = `${refUrl.origin}${pathPrefix}`;
    } catch {
      const appUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
      baseUrl = `${appUrl}${pathPrefix}`;
    }
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const fromAddress = process.env.EMAIL_FROM
      || (process.env.EMAIL_USER ? `"Gharoo Care" <${process.env.EMAIL_USER}>` : '"Gharoo Care" <no-reply@gharoocare.com>');

    const mailOptions = {
      to: user.email,
      from: fromAddress,
      subject: 'Gharoo Care - Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
            `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
            `${resetUrl}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 40px; color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Gharoo Care</h2>
              <p style="margin: 5px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">Admin & Provider Password Reset</p>
            </div>
            <div style="padding: 45px 35px; line-height: 1.6;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600;">Hello ${user.firstName || 'User'},</h3>
              <p style="color: #475569; font-size: 15px;">You are receiving this email because you (or someone else) requested a password reset for your account on Gharoo Care.</p>
              <p style="color: #475569; font-size: 15px; margin-bottom: 30px;">Please click the button below to complete the password reset process. This link will expire in 1 hour.</p>
              <div style="text-align: center; margin-bottom: 35px;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);">Reset Password</a>
              </div>
              <p style="color: #64748b; font-size: 13px;">If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.4;">If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #4f46e5; text-decoration: underline;">${resetUrl}</a></p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions).catch((mailErr) => {
      console.error('Failed to send reset email:', mailErr.message || mailErr);
      return null;
    });
    
    const emailSent = !!(info && info.messageId && info.messageId !== 'simulated-id');
    let isTesting = false;
    let testMessageUrl = '';
    
    if (info && info.messageId && transporter.options && transporter.options.host === 'smtp.ethereal.email') {
      const nodemailerUrl = nodemailer.getTestMessageUrl(info);
      console.log('✉️ Reset email sent to Ethereal. Review message here:', nodemailerUrl);
      console.log('✉️ Password Reset Link:', resetUrl);
      isTesting = true;
      testMessageUrl = nodemailerUrl;
    } else if (info && info.messageId === 'simulated-id') {
      isTesting = true;
    } else if (emailSent) {
      console.log('✉️ Reset email successfully dispatched to:', user.email);
    }

    const hasSmtpConfig = !!((process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || (process.env.EMAIL_USER && process.env.EMAIL_PASS));

    res.json({ 
      success: true, 
      message: emailSent
        ? 'Password reset email sent successfully. Please check your inbox.'
        : hasSmtpConfig
          ? 'Email could not be sent. Use the reset link below to set a new password.'
          : 'Password reset link generated. (No SMTP credentials configured)',
      resetUrl: !emailSent ? resetUrl : undefined,
      testMessageUrl: !emailSent && testMessageUrl ? testMessageUrl : undefined
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send password reset email. Please try again later.' });
  }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    let user = null;
    if (isMongoConnected) {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    } else {
      user = inMemoryUsers.find(u => 
        u.resetPasswordToken === token && 
        u.resetPasswordExpires > Date.now()
      );
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMongoConnected) {
      user.password = hashedPassword;
      user.resetPasswordToken = '';
      user.resetPasswordExpires = undefined;
      await user.save();
    } else {
      user.password = hashedPassword; // in-memory store
      user.resetPasswordToken = '';
      user.resetPasswordExpires = undefined;
    }

    res.json({ success: true, message: 'Your password has been successfully reset! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'An error occurred during password reset. Please try again.' });
  }
});

// Panel Settings API
// Get panel settings
app.get('/api/panel-settings', async (req, res) => {
  try {
    if (isMongoConnected) {
      const settings = await PanelSettings.findOne();
      res.json({ success: true, data: settings });
    } else {
      res.json({ success: true, data: inMemorySettings });
    }
  } catch (err) {
    console.error('Get panel settings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update panel settings
app.put('/api/panel-settings', async (req, res) => {
  try {
    if (isMongoConnected) {
      const updatedSettings = await PanelSettings.findOneAndUpdate(
        {},
        { $set: req.body },
        { returnDocument: 'after', upsert: true, strict: false }
      );
      res.json({ success: true, message: 'Settings updated successfully!', data: updatedSettings });
    } else {
      inMemorySettings = req.body;
      res.json({ success: true, message: 'Settings updated successfully!', data: inMemorySettings });
    }
  } catch (err) {
    console.error('Update panel settings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const formatLead = (lead) => ({
  id: lead._id.toString(),
  _id: lead._id,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  status: lead.status,
  service: lead.service,
  city: lead.city,
  area: lead.area,
  assigned: lead.assigned || 'Unassigned',
  assignedTo: lead.assignedTo,
  createdAt: lead.createdAt
});

const ensureWorkOrderFromLead = async (lead) => {
  const existing = await WorkOrder.findOne({ leadId: lead._id });
  if (existing) return existing;

  const location = [lead.area, lead.city].filter(Boolean).join(', ');
  const workOrder = new WorkOrder({
    leadId: lead._id,
    title: `${lead.service} - ${lead.name}`,
    description: `${lead.service} service required at ${location || 'customer location'}.`,
    customerName: lead.name,
    customerPhone: lead.phone,
    customerAddress: location,
    status: 'assigned',
    priority: 'medium',
    assignedTo: lead.assignedTo,
    serviceType: lead.service,
    notes: `Customer email: ${lead.email}`
  });

  await workOrder.save();
  return workOrder;
};

const resolveAssignedTo = async (assignedName) => {
  if (!assignedName || assignedName === 'Unassigned') {
    return { assigned: 'Unassigned', assignedTo: null };
  }

  const serviceMen = await User.find({ role: 'Service Man' });
  const serviceMan = serviceMen.find(
    (user) => `${user.firstName} ${user.lastName}` === assignedName
  );

  return {
    assigned: assignedName,
    assignedTo: serviceMan ? serviceMan._id : null
  };
};

// Lead Endpoints

app.get('/api/leads', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json([]);
    }
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads.map(formatLead));
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/leads/assigned/:userId', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json([]);
    }
    const { userId } = req.params;
    const leads = await Lead.find({ assignedTo: userId }).sort({ createdAt: -1 });
    res.json(leads.map(formatLead));
  } catch (err) {
    console.error('Get assigned leads error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const newLead = new Lead(req.body);
    await newLead.save();
    res.json({ success: true, message: 'Lead created successfully!', lead: formatLead(newLead) });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/leads/:id/accept', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const { id } = req.params;
    const { userId } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    if (!lead.assignedTo || lead.assignedTo.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this lead' });
    }
    if (lead.status !== 'New') {
      return res.status(400).json({ success: false, message: 'Lead already accepted' });
    }

    lead.status = 'Accepted';
    await lead.save();
    const workOrder = await ensureWorkOrderFromLead(lead);
    res.json({
      success: true,
      message: 'Lead accepted and moved to work orders!',
      lead: formatLead(lead),
      workOrder
    });
  } catch (err) {
    console.error('Accept lead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const { id } = req.params;
    const updateData = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updateData, 'assigned')) {
      const assignment = await resolveAssignedTo(updateData.assigned);
      updateData.assigned = assignment.assigned;
      updateData.assignedTo = assignment.assignedTo;
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, message: 'Lead updated successfully!', lead: formatLead(updatedLead) });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/leads/bulk-assign', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const { leadIds, assigned } = req.body;
    const assignment = await resolveAssignedTo(assigned);

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { assigned: assignment.assigned, assignedTo: assignment.assignedTo }
    );

    const leads = await Lead.find({ _id: { $in: leadIds } });
    res.json({
      success: true,
      message: 'Leads assigned successfully!',
      leads: leads.map(formatLead)
    });
  } catch (err) {
    console.error('Bulk assign leads error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully!' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Service Price Endpoints

app.get('/api/service-prices', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json([]);
    }
    const services = await ServicePrice.find().sort({ createdAt: -1 });
    res.json(services.map((service) => ({
      id: service._id.toString(),
      _id: service._id,
      name: service.name,
      price: service.price,
      description: service.description
    })));
  } catch (err) {
    console.error('Get service prices error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/service-prices', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const newService = new ServicePrice(req.body);
    await newService.save();
    res.json({
      success: true,
      message: 'Service price created successfully!',
      service: {
        id: newService._id.toString(),
        _id: newService._id,
        name: newService.name,
        price: newService.price,
        description: newService.description
      }
    });
  } catch (err) {
    console.error('Create service price error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/service-prices/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const updatedService = await ServicePrice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedService) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({
      success: true,
      message: 'Service price updated successfully!',
      service: {
        id: updatedService._id.toString(),
        _id: updatedService._id,
        name: updatedService.name,
        price: updatedService.price,
        description: updatedService.description
      }
    });
  } catch (err) {
    console.error('Update service price error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/service-prices/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await ServicePrice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service price deleted successfully!' });
  } catch (err) {
    console.error('Delete service price error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Premium User Endpoints
app.get('/api/premium-users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await PremiumUser.find().sort({ createdAt: -1 });
      res.json({ success: true, data: users });
    } else {
      res.json({ success: true, data: inMemoryPremiumUsers });
    }
  } catch (err) {
    console.error('Get premium users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/premium-users', async (req, res) => {
  try {
    const { name, email, phone, plan, price, city, address } = req.body;
    
    // Default expiryDate to 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    if (isMongoConnected) {
      const newUser = new PremiumUser({
        name,
        email,
        phone,
        plan: plan || 'Premium',
        price: price || '$0',
        city: city || '',
        address: address || '',
        expiryDate,
        status: 'Active'
      });
      await newUser.save();
      res.json({ success: true, message: 'Premium user registered successfully!', data: newUser });
    } else {
      const newUser = {
        id: (inMemoryPremiumUsers.length + 1).toString(),
        name,
        email,
        phone,
        plan: plan || 'Premium',
        price: price || '$0',
        city: city || '',
        address: address || '',
        expiryDate: expiryDate.toISOString(),
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      inMemoryPremiumUsers.push(newUser);
      res.json({ success: true, message: 'Premium user registered successfully!', data: newUser });
    }
  } catch (err) {
    console.error('Create premium user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Work Order Endpoints

// Get all work orders
app.get('/api/work-orders', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json([]);
    }
    const workOrders = await WorkOrder.find().populate('assignedTo', 'firstName lastName email');
    res.json(workOrders);
  } catch (err) {
    console.error('Get work orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get work orders assigned to a specific user
app.get('/api/work-orders/assigned/:userId', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json([]);
    }
    const { userId } = req.params;
    const acceptedLeads = await Lead.find({ assignedTo: userId, status: 'Accepted' });
    await Promise.all(acceptedLeads.map((lead) => ensureWorkOrderFromLead(lead)));

    const workOrders = await WorkOrder.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'firstName lastName email');
    res.json(workOrders);
  } catch (err) {
    console.error('Get assigned work orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single work order by id
app.get('/api/work-orders/:id', async (req, res) => {
  console.log('Single work order request for id:', req.params.id);
  try {
    if (!isMongoConnected) {
      console.log('Mongo not connected');
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const workOrder = await WorkOrder.findById(req.params.id).populate('assignedTo', 'firstName lastName email');
    if (!workOrder) {
      console.log('Work order not found for id:', req.params.id);
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    console.log('Found work order:', workOrder._id);
    res.json(workOrder);
  } catch (err) {
    console.error('Get work order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create work order
app.post('/api/work-orders', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const newWorkOrder = new WorkOrder(req.body);
    await newWorkOrder.save();
    await newWorkOrder.populate('assignedTo', 'firstName lastName email');
    res.json({ success: true, message: 'Work order created successfully!', workOrder: newWorkOrder });
  } catch (err) {
    console.error('Create work order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update work order
app.put('/api/work-orders/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const { id } = req.params;
    const updateData = req.body;
    
    // If status is being set to completed, set completedAt
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(id, updateData, { new: true }).populate('assignedTo', 'firstName lastName email');
    res.json({ success: true, message: 'Work order updated successfully!', workOrder: updatedWorkOrder });
  } catch (err) {
    console.error('Update work order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete work order
app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    const { id } = req.params;
    await WorkOrder.findByIdAndDelete(id);
    res.json({ success: true, message: 'Work order deleted successfully!' });
  } catch (err) {
    console.error('Delete work order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fix double panel paths (e.g. /admin/admin/login → /admin/login)
app.use((req, res, next) => {
  if (req.path.startsWith('/admin/admin')) {
    return res.redirect(req.path.replace('/admin/admin', '/admin'));
  }
  if (req.path.startsWith('/service/service')) {
    return res.redirect(req.path.replace('/service/service', '/service'));
  }
  next();
});

// Redirect /login to admin login page
app.get('/login', (req, res) => {
  res.redirect('/admin/login');
});

// Redirect panel roots to login pages
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

app.get('/service', (req, res) => {
  res.redirect('/service/login');
});

// Catch-all routes for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
  if (req.path.startsWith('/service')) {
    return res.sendFile(path.join(__dirname, '../service-man-client/dist/index.html'));
  }
  res.sendFile(path.join(__dirname, '../Gharoo/Gharoo_client/dist/index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`  User site:   http://localhost:${PORT}/`);
    console.log(`  Admin login: http://localhost:${PORT}/admin/login`);
    console.log(`  Service login: http://localhost:${PORT}/service/login`);
  });
}

module.exports = app;
