require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');
const User = require('./models/User');
const PanelSettings = require('./models/PanelSettings');
const WorkOrder = require('./models/WorkOrder');
const Lead = require('./models/Lead');
const ServicePrice = require('./models/ServicePrice');
const PremiumUser = require('./models/PremiumUser');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Cloudinary configuration + flag if config present
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️  Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.warn('⚠️  Cloudinary env vars missing. Using disk upload fallback.');
}

const isVercelRuntime = !!process.env.VERCEL;
const TMP_UPLOADS_DIR = isVercelRuntime ? path.join('/tmp', 'gharoo_uploads') : null;

// Local uploads directory — on Vercel only /tmp is writable (but ephemeral)
const UPLOADS_DIR = isVercelRuntime ? TMP_UPLOADS_DIR : path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('💾 Uploads directory ready:', UPLOADS_DIR, isVercelRuntime ? '(Vercel /tmp - ephemeral)' : '');
} catch (e) {
  console.warn('Could not create uploads dir:', e.message);
}

// Configure Multer - memory storage so same upload works for both Cloudinary + disk
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, SVG.`));
  }
});

// Utility: save buffer to local disk, returns public URL path
function saveBufferToDisk(fileBuffer, originalName) {
  const safeExt = (path.extname(originalName || '') || '.png').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
  const fullPath = path.join(UPLOADS_DIR, safeName);
  fs.writeFileSync(fullPath, fileBuffer);
  return `/uploads/${safeName}`;
}

// Shared Cloudinary upload helper — never throws, returns { success, url, public_id, message }
async function uploadToCloudinary(fileBuffer, mimetype, folder = 'gharoocare') {
  if (!cloudinaryConfigured) {
    return { success: false, message: 'Cloudinary not configured' };
  }
  try {
    const b64 = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      timeout: 60000,
      resource_type: 'auto'
    });
    return { success: true, url: result.secure_url, public_id: result.public_id };
  } catch (cErr) {
    console.error('[Cloudinary] upload failed:', cErr.message, cErr.http_code || '');
    return {
      success: false,
      message: cErr.message || 'Cloudinary upload failed',
      http_code: cErr.http_code || 502
    };
  }
}

const CLOUDINARY_SETUP_MSG =
  'Image upload requires Cloudinary on Vercel. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Vercel Project → Settings → Environment Variables, then redeploy.';


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

// Serve uploaded images at /uploads
app.use('/uploads', express.static(UPLOADS_DIR, { fallthrough: false, maxAge: '30d' }));

// Serve admin panel at /admin
app.use('/admin', express.static(path.join(__dirname, '../client/dist')));

// Serve service man panel at /service
app.use('/service', express.static(path.join(__dirname, '../service-man-client/dist')));

// In-memory storage fallbacks
let inMemorySettings = null;
let inMemoryUsers = [];
let inMemoryPremiumUsers = [];
let nextUserId = 1;

const parseServiceLimit = (plan = {}) => {
  const text = [
    plan.name,
    plan.serviceLimit,
    ...(Array.isArray(plan.features) ? plan.features : [])
  ].filter(Boolean).join(' ');
  const match = text.match(/(\d+)\s*(free\s*)?(service|services|visit|visits)/i);
  if (match) return Number(match[1]);
  if (/(service|services|visit|visits)/i.test(text)) {
    const fallbackMatch = text.match(/\d+/);
    return fallbackMatch ? Number(fallbackMatch[0]) : 0;
  }
  return 0;
};

const generatePremiumMemberId = () => {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GCP-${Date.now().toString().slice(-6)}-${random}`;
};

const getPlanServiceLimit = async (planName) => {
  if (!planName) return 0;
  const settings = isMongoConnected ? await PanelSettings.findOne() : { pricing: inMemorySettings?.pricing };
  const plans = settings?.pricing?.plans || [];
  const plan = plans.find((item) => String(item.name || '').toLowerCase() === String(planName).toLowerCase());
  return parseServiceLimit(plan || { name: planName });
};

const getCurrentPremiumUsage = (premiumUser) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return (premiumUser.serviceUsage || []).filter((entry) => new Date(entry.usedAt) >= yearStart).length;
};

// Helper function to get default settings
const getDefaultSettings = () => ({
  hero: {
    slides: [
      { eyebrow: 'Find The Best Support You Need Today.', titleTop: 'Current Solutions For', titleHighlight: 'Your Modern Problems', text: 'We provide expert repair services for all your electronic devices with fast turnaround and warranty-backed quality.', bg: '', side: '' },
      { eyebrow: 'Fast & Reliable Service', titleTop: 'Repairing Devices', titleHighlight: 'With Expert Care', text: 'Quick turnarounds and warranty-backed repairs for phones, laptops and appliances by certified technicians.', bg: '', side: '' },
      { eyebrow: 'Convenient Pickup & Delivery', titleTop: 'Doorstep Service', titleHighlight: 'For Your Convenience', text: 'Schedule a pickup and we will return your device fully tested and working — hassle-free service at your door.', bg: '', side: '' }
    ]
  },
  heroBanners: {
    items: [
      { image: '', redirectUrl: '/booking', altText: 'Gharoo Care complete AC care AMC plan' }
    ]
  },
  heroBanner: { image: '', redirectUrl: '/booking', altText: 'Gharoo Care hero banner' },
  heroSection: {
    backgroundImage: '',
    eyebrow: 'Gharoo Care',
    title: 'AC Service & AMC Plans',
    subtitle: 'Doorstep service • 24/7 support',
    floatingPlanCards: [
      { image: '', price: '₹1249', planName: 'AC AMC Plan - Basic', redirectUrl: '/booking', altText: 'AC AMC Basic plan ₹1249' },
      { image: '', price: '₹499', planName: 'AC One Time Service', redirectUrl: '/booking', altText: 'AC One Time Service ₹499' }
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

// Image upload — Cloudinary first, fallback to disk (local only)
app.post('/api/upload-image', (req, res) => {
  upload.single('image')(req, res, async (multerErr) => {
    if (multerErr) {
      console.error('[upload-image] Multer error:', multerErr.message);
      const statusCode = multerErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const userMessage =
        multerErr.code === 'LIMIT_FILE_SIZE'
          ? `File too large. Maximum allowed size is ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB.`
          : multerErr.message;
      return res.status(statusCode).json({ success: false, message: userMessage });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided. Make sure form field name is "image".'
        });
      }

      const { buffer, mimetype, originalname, size } = req.file;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ success: false, message: 'Empty upload buffer.' });
      }

      // 1) Try Cloudinary (always on Vercel; recommended for all environments)
      if (cloudinaryConfigured) {
        const result = await uploadToCloudinary(buffer, mimetype, 'gharoocare');
        if (result.success) {
          console.log('☁️  [upload-image] Cloudinary OK ->', result.url, `(${(size / 1024).toFixed(0)}KB)`);
          return res.json({
            success: true,
            url: result.url,
            public_id: result.public_id,
            provider: 'cloudinary'
          });
        }
        // Cloudinary was configured but the call failed (e.g. bad credentials, network)
        if (isVercelRuntime) {
          return res.status(result.http_code || 502).json({
            success: false,
            message: `Cloudinary upload failed: ${result.message}. Verify CLOUDINARY_* env vars in Vercel Project Settings.`
          });
        }
        // Local dev — log and fall through to disk
        console.warn('[upload-image] Cloudinary failed locally, falling back to disk.');
      } else if (isVercelRuntime) {
        // No Cloudinary on Vercel = no reliable upload target (/tmp is ephemeral & not served)
        return res.status(500).json({
          success: false,
          message: CLOUDINARY_SETUP_MSG
        });
      }

      // 2) Fallback: save to local disk (local dev only — NOT reliable on Vercel)
      try {
        const publicPath = saveBufferToDisk(buffer, originalname);
        console.log('💾 [upload-image] Disk fallback OK ->', publicPath, `(${(size / 1024).toFixed(0)}KB)`);
        return res.json({
          success: true,
          url: publicPath,
          provider: 'disk'
        });
      } catch (diskErr) {
        console.error('[upload-image] Disk fallback failed:', diskErr.message);
        if (isVercelRuntime) {
          return res.status(500).json({ success: false, message: CLOUDINARY_SETUP_MSG });
        }
        throw diskErr;
      }

    } catch (err) {
      console.error('[upload-image] Fatal error:', err);
      return res.status(500).json({
        success: false,
        message: isVercelRuntime && !cloudinaryConfigured
          ? CLOUDINARY_SETUP_MSG
          : (err.message || 'Failed to upload image')
      });
    }
  });
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
        avatar: user.avatar,
        profilePic: user.profilePic,
        idProofType: user.idProofType,
        idProofNumber: user.idProofNumber,
        frontIdProofImage: user.frontIdProofImage,
        backIdProofImage: user.backIdProofImage,
        houseNumber: user.houseNumber,
        address: user.address,
        currentLocation: user.currentLocation,
        city: user.city,
        state: user.state,
        pinCode: user.pinCode
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
        avatar: user.avatar,
        profilePic: user.profilePic,
        idProofType: user.idProofType,
        idProofNumber: user.idProofNumber,
        frontIdProofImage: user.frontIdProofImage,
        backIdProofImage: user.backIdProofImage,
        houseNumber: user.houseNumber,
        address: user.address,
        currentLocation: user.currentLocation,
        city: user.city,
        state: user.state,
        pinCode: user.pinCode
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
        avatar: user.avatar,
        profilePic: user.profilePic,
        idProofType: user.idProofType,
        idProofNumber: user.idProofNumber,
        frontIdProofImage: user.frontIdProofImage,
        backIdProofImage: user.backIdProofImage,
        houseNumber: user.houseNumber,
        address: user.address,
        currentLocation: user.currentLocation,
        city: user.city,
        state: user.state,
        pinCode: user.pinCode
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
        avatar: user.avatar,
        profilePic: user.profilePic,
        idProofType: user.idProofType,
        idProofNumber: user.idProofNumber,
        frontIdProofImage: user.frontIdProofImage,
        backIdProofImage: user.backIdProofImage,
        houseNumber: user.houseNumber,
        address: user.address,
        currentLocation: user.currentLocation,
        city: user.city,
        state: user.state,
        pinCode: user.pinCode
      }));
      res.json(formattedUsers);
    }
  } catch (err) {
    console.error('Get users by role error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user
app.post('/api/users', upload.fields([{ name: 'frontIdProofImage', maxCount: 1 }, { name: 'backIdProofImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, team, service, notes, password, idProofType, idProofNumber, houseNumber, address, currentLocation, city, state, pinCode } = req.body;

    const uploadOne = async (file) => {
      if (!file) return null;
      if (cloudinaryConfigured) {
        const r = await uploadToCloudinary(file.buffer, file.mimetype, 'gharoocare/id-proofs');
        if (r.success) return r.url;
        if (isVercelRuntime) throw new Error(`ID proof Cloudinary upload failed: ${r.message}`);
      }
      if (isVercelRuntime) throw new Error(CLOUDINARY_SETUP_MSG);
      return saveBufferToDisk(file.buffer, file.originalname);
    };

    let frontIdProofImageUrl = null;
    let backIdProofImageUrl = null;

    if (req.files?.frontIdProofImage?.[0]) {
      frontIdProofImageUrl = await uploadOne(req.files.frontIdProofImage[0]);
    }
    if (req.files?.backIdProofImage?.[0]) {
      backIdProofImageUrl = await uploadOne(req.files.backIdProofImage[0]);
    }

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
        password: hashedPassword,
        idProofType: idProofType || null,
        idProofNumber: idProofNumber || null,
        frontIdProofImage: frontIdProofImageUrl || null,
        backIdProofImage: backIdProofImageUrl || null,
        houseNumber: houseNumber || '',
        address: address || '',
        currentLocation: currentLocation || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
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
        createdAt: new Date(),
        idProofType: idProofType || null,
        idProofNumber: idProofNumber || null,
        frontIdProofImage: frontIdProofImageUrl || null,
        backIdProofImage: backIdProofImageUrl || null,
        houseNumber: houseNumber || '',
        address: address || '',
        currentLocation: currentLocation || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
      };
      inMemoryUsers.push(newUser);
      res.json({ success: true, message: 'User created successfully!' });
    }
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Service Man Registration
app.post('/api/service-man/register', upload.fields([{ name: 'frontIdProofImage', maxCount: 1 }, { name: 'backIdProofImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      confirmPassword, 
      idProofType, 
      idProofNumber,
      houseNumber,
      address,
      currentLocation,
      city,
      state,
      pinCode
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !idProofType || !address || !currentLocation) {
      return res.status(400).json({ success: false, message: 'All fields are mandatory!' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match!' });
    }
    const validIdProofTypes = ['Pan Card', 'Aadhaar Card', 'Driving License', 'Election Card'];
    if (!validIdProofTypes.includes(idProofType)) {
      return res.status(400).json({ success: false, message: 'Invalid ID proof type!' });
    }

    const formatEmployeeId = (number) => `GRCAC${String(number).padStart(3, '0')}`;
    const getNextEmployeeIdFromList = (users = []) => {
      const maxNumber = users.reduce((max, user) => {
        const match = String(user.employeeId || '').match(/^GRCAC(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return formatEmployeeId(maxNumber + 1);
    };
    const generateEmployeeId = async () => {
      if (isMongoConnected) {
        const serviceMen = await User.find({
          role: 'Service Man',
          employeeId: /^GRCAC\d+$/
        }).select('employeeId').lean();
        return getNextEmployeeIdFromList(serviceMen);
      }
      return getNextEmployeeIdFromList(inMemoryUsers.filter((user) => user.role === 'Service Man'));
    };

    const uploadOne = async (file) => {
      if (!file) return null;
      if (cloudinaryConfigured) {
        const r = await uploadToCloudinary(file.buffer, file.mimetype, 'gharoocare/id-proofs');
        if (r.success) return r.url;
        if (isVercelRuntime) throw new Error(`ID proof Cloudinary upload failed: ${r.message}`);
      }
      if (isVercelRuntime) throw new Error(CLOUDINARY_SETUP_MSG);
      return saveBufferToDisk(file.buffer, file.originalname);
    };

    let frontIdProofImageUrl = null;
    let backIdProofImageUrl = null;

    if (req.files?.frontIdProofImage?.[0]) {
      frontIdProofImageUrl = await uploadOne(req.files.frontIdProofImage[0]);
    }
    if (req.files?.backIdProofImage?.[0]) {
      backIdProofImageUrl = await uploadOne(req.files.backIdProofImage[0]);
    }

    if (isMongoConnected) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: 'Service Man',
        team: 'Technical',
        service: '',
        notes: '',
        status: 'Active',
        idProofType,
        idProofNumber: idProofNumber || null,
        frontIdProofImage: frontIdProofImageUrl,
        backIdProofImage: backIdProofImageUrl,
        employeeId: await generateEmployeeId(),
        houseNumber: houseNumber || '',
        address: address || '',
        currentLocation: currentLocation || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
      });

      await newUser.save();
      return res.json({ success: true, message: 'Service man registered successfully! Please login.' });
    } else {
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
        password,
        role: 'Service Man',
        team: 'Technical',
        service: '',
        notes: '',
        status: 'Active',
        avatar: '/assets/images/avatar/avatar-1.jpg',
        joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date(),
        idProofType,
        idProofNumber: idProofNumber || null,
        frontIdProofImage: frontIdProofImageUrl,
        backIdProofImage: backIdProofImageUrl,
        employeeId: await generateEmployeeId(),
        houseNumber: houseNumber || '',
        address: address || '',
        currentLocation: currentLocation || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
      };
      inMemoryUsers.push(newUser);
      return res.json({ success: true, message: 'Service man registered successfully! Please login.' });
    }
  } catch (err) {
    console.error('Service man register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password: _, ...userWithoutPassword } = user.toObject();
      res.json({ success: true, user: userWithoutPassword });
    } else {
      const user = inMemoryUsers.find(u => u.id == id || u._id == id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    }
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Service man profile
app.get('/api/service-man/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User id is required' });
    }

    if (isMongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      const user = await User.findOne({ _id: id, role: 'Service Man' }).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      return res.json({ success: true, user });
    }

    const user = inMemoryUsers.find(u => String(u.id) === String(id) || String(u._id) === String(id));
    if (!user || user.role !== 'Service Man') {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('Service man profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/service-man/profile-pic', upload.single('profilePic'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !req.file) {
      return res.status(400).json({ success: false, message: 'User id and profile image are required' });
    }

    let profilePicUrl = null;
    if (cloudinaryConfigured) {
      const r = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'gharoocare/profile-pics');
      if (r.success) {
        profilePicUrl = r.url;
      } else if (isVercelRuntime) {
        return res.status(r.http_code || 502).json({
          success: false,
          message: `Profile pic Cloudinary upload failed: ${r.message}`
        });
      }
    } else if (isVercelRuntime) {
      return res.status(500).json({ success: false, message: CLOUDINARY_SETUP_MSG });
    }

    if (!profilePicUrl) {
      profilePicUrl = saveBufferToDisk(req.file.buffer, req.file.originalname);
    }

    if (isMongoConnected) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      const user = await User.findOneAndUpdate(
        { _id: userId, role: 'Service Man' },
        { profilePic: profilePicUrl },
        { new: true }
      ).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      return res.json({ success: true, profilePic: profilePicUrl, user });
    }

    const user = inMemoryUsers.find(u => String(u.id) === String(userId) || String(u._id) === String(userId));
    if (!user || user.role !== 'Service Man') {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    user.profilePic = profilePicUrl;
    res.json({ success: true, profilePic: profilePicUrl, user });
  } catch (err) {
    console.error('Service man profile pic error:', err);
    const msg = isVercelRuntime && !cloudinaryConfigured
      ? CLOUDINARY_SETUP_MSG
      : (err.message || 'Server error');
    res.status(500).json({ success: false, message: msg });
  }
});

// Update user status
app.put('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(id, { status }, { new: true });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, message: 'User status updated successfully!' });
    } else {
      const user = inMemoryUsers.find(u => u.id == id || u._id == id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.status = status;
      res.json({ success: true, message: 'User status updated successfully!' });
    }
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      await User.findByIdAndDelete(id);
      res.json({ success: true, message: 'User deleted successfully!' });
    } else {
      inMemoryUsers = inMemoryUsers.filter(u => u.id != id && u._id != id);
      res.json({ success: true, message: 'User deleted successfully!' });
    }
  } catch (err) {
    console.error('Delete user error:', err);
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
      if (user.status && user.status.toLowerCase() === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your account is inactive. Contact admin.' });
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

    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact admin.' });
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
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
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
    let rawSettings;
    if (isMongoConnected) {
      rawSettings = await PanelSettings.findOne();
    } else {
      rawSettings = inMemorySettings;
    }
    const defaults = getDefaultSettings();
    const rawObj = (rawSettings?.toObject ? rawSettings.toObject() : rawSettings || {});

    const mergeItemArray = (savedItems, defaultItems) => {
      const savedArr = Array.isArray(savedItems) ? savedItems : [];
      if (savedArr.length === 0) return defaultItems;
      return savedArr.map((item, i) => ({
        ...(defaultItems[i] || {}),
        ...(item || {}),
        keyPoints: (item && Array.isArray(item.keyPoints) && item.keyPoints.length)
          ? item.keyPoints
          : ((defaultItems[i] && defaultItems[i].keyPoints) || [])
      }));
    };

    const merged = {
      ...defaults,
      ...rawObj,
      heroBanner: { ...defaults.heroBanner, ...(rawObj.heroBanner || {}) },
      heroSection: {
        ...defaults.heroSection,
        ...(rawObj.heroSection || {}),
        floatingPlanCards: (rawObj.heroSection && Array.isArray(rawObj.heroSection.floatingPlanCards) && rawObj.heroSection.floatingPlanCards.length)
          ? rawObj.heroSection.floatingPlanCards.map((card, i) => ({ ...(defaults.heroSection.floatingPlanCards[i] || {}), ...card }))
          : defaults.heroSection.floatingPlanCards
      },
      about: {
        ...defaults.about,
        ...(rawObj.about || {}),
        features: mergeItemArray(rawObj.about?.features, defaults.about.features)
      },
      services: {
        ...defaults.services,
        ...(rawObj.services || {}),
        items: mergeItemArray(rawObj.services?.items, defaults.services.items)
      },
      newSection: {
        ...defaults.newSection,
        ...(rawObj.newSection || {}),
        features: mergeItemArray(rawObj.newSection?.features, defaults.newSection.features)
      },
      whyChoose: {
        ...defaults.whyChoose,
        ...(rawObj.whyChoose || {}),
        cards: mergeItemArray(rawObj.whyChoose?.cards, defaults.whyChoose.cards)
      },
      completedProjects: {
        ...defaults.completedProjects,
        ...(rawObj.completedProjects || {}),
        projects: Array.isArray(rawObj.completedProjects?.projects) && rawObj.completedProjects.projects.length
          ? rawObj.completedProjects.projects.map((p, i) => ({
              ...(defaults.completedProjects.projects[i] || {}),
              ...p,
              keyPoints: (p && Array.isArray(p.keyPoints) && p.keyPoints.length)
                ? p.keyPoints
                : ((defaults.completedProjects.projects[i] && defaults.completedProjects.projects[i].keyPoints) || [])
            }))
          : defaults.completedProjects.projects
      },
      serviceSlider: {
        ...defaults.serviceSlider,
        ...(rawObj.serviceSlider || {}),
        services: mergeItemArray(rawObj.serviceSlider?.services, defaults.serviceSlider.services)
      }
    };
    res.json({ success: true, data: merged });
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
  houseNumber: lead.houseNumber || '',
  address: lead.address || '',
  currentLocation: lead.currentLocation || '',
  city: lead.city,
  area: lead.area,
  assigned: lead.assigned || 'Unassigned',
  assignedTo: lead.assignedTo ? lead.assignedTo.toString() : null,
  isPremium: Boolean(lead.isPremium),
  premiumPlan: lead.premiumPlan || '',
  premiumPrice: lead.premiumPrice || '',
  createdAt: lead.createdAt
});

const ensureWorkOrderFromLead = async (lead) => {
  const existing = await WorkOrder.findOne({ leadId: lead._id });
  if (existing) return existing;

  const location = [lead.houseNumber, lead.address, lead.area, lead.city].filter(Boolean).join(', ');
  const workOrder = new WorkOrder({
    leadId: lead._id,
    title: `${lead.service} - ${lead.name}`,
    description: `${lead.service} service required at ${location || 'customer location'}.`,
    customerName: lead.name,
    customerPhone: lead.phone,
    customerAddress: location,
    customerCurrentLocation: lead.currentLocation || '',
    status: 'assigned',
    priority: 'medium',
    assignedTo: lead.assignedTo,
    serviceType: lead.service,
    notes: `${lead.isPremium ? `Premium customer${lead.premiumPlan ? ` - ${lead.premiumPlan}` : ''}. ` : ''}Customer email: ${lead.email}`,
    isPremium: Boolean(lead.isPremium),
    premiumPlan: lead.premiumPlan || '',
    premiumPrice: lead.premiumPrice || ''
  });

  await workOrder.save();
  return workOrder;
};

const resolveAssignedTo = async (assignedName, assignedUserId) => {
  if (!assignedName || assignedName === 'Unassigned') {
    return { assigned: 'Unassigned', assignedTo: null };
  }

  if (assignedUserId && mongoose.Types.ObjectId.isValid(assignedUserId)) {
    const serviceManById = await User.findOne({ _id: assignedUserId, role: 'Service Man' });
    if (serviceManById) {
      return {
        assigned: `${serviceManById.firstName} ${serviceManById.lastName}`,
        assignedTo: serviceManById._id
      };
    }
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
    const leadData = { ...req.body };
    if (!leadData.currentLocation) {
      return res.status(400).json({ success: false, message: 'Current location is required' });
    }
    const premiumUser = await PremiumUser.findOne({
      status: 'Active',
      $or: [
        { email: String(leadData.email || '').toLowerCase() },
        { phone: leadData.phone }
      ]
    }).sort({ createdAt: -1 });

    leadData.isPremium = Boolean(leadData.isPremium || premiumUser);
    leadData.premiumPlan = leadData.premiumPlan || premiumUser?.plan || '';
    leadData.premiumPrice = leadData.premiumPrice || premiumUser?.price || '';

    const newLead = new Lead(leadData);
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
      const assignment = await resolveAssignedTo(updateData.assigned, updateData.assignedUserId);
      updateData.assigned = assignment.assigned;
      updateData.assignedTo = assignment.assignedTo;
      delete updateData.assignedUserId;
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
    const { leadIds, assigned, assignedUserId } = req.body;
    const assignment = await resolveAssignedTo(assigned, assignedUserId);

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

app.get('/api/premium-users/pending-count', async (req, res) => {
  try {
    if (isMongoConnected) {
      const count = await PremiumUser.countDocuments({ status: 'Payment Pending' });
      return res.json({ success: true, count });
    }
    const count = inMemoryPremiumUsers.filter((user) => user.status === 'Payment Pending').length;
    res.json({ success: true, count });
  } catch (err) {
    console.error('Get pending premium count error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/premium-users', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      plan,
      price,
      city,
      address,
      status,
      upiId,
      paymentName,
      paymentMethod,
      paymentStatus,
      transactionNote,
      leadData,
      premiumMemberId,
      serviceLimit
    } = req.body;
    
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
        upiId: upiId || '',
        paymentName: paymentName || '',
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: paymentStatus || (status === 'Payment Pending' ? 'Pending Approval' : 'Approved'),
        transactionNote: transactionNote || '',
        leadData: leadData || null,
        premiumMemberId: premiumMemberId || '',
        serviceLimit: Number(serviceLimit || 0),
        expiryDate,
        status: status || 'Active'
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
        upiId: upiId || '',
        paymentName: paymentName || '',
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: paymentStatus || (status === 'Payment Pending' ? 'Pending Approval' : 'Approved'),
        transactionNote: transactionNote || '',
        leadData: leadData || null,
        premiumMemberId: premiumMemberId || '',
        serviceLimit: Number(serviceLimit || 0),
        servicesUsed: 0,
        serviceUsage: [],
        expiryDate: expiryDate.toISOString(),
        status: status || 'Active',
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

app.get('/api/premium-users/lookup/:memberId', async (req, res) => {
  try {
    const memberId = String(req.params.memberId || '').trim().toUpperCase();
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Premium ID is required' });
    }

    if (isMongoConnected) {
      const premiumUser = await PremiumUser.findOne({ premiumMemberId: memberId, status: 'Active' });
      if (!premiumUser) {
        return res.status(404).json({ success: false, message: 'Premium ID not found or not active' });
      }
      const now = new Date();
      if (premiumUser.expiryDate && new Date(premiumUser.expiryDate) < now) {
        return res.status(400).json({ success: false, message: 'Premium plan is expired' });
      }
      const usedThisYear = getCurrentPremiumUsage(premiumUser);
      const serviceLimit = Number(premiumUser.serviceLimit || 0);
      return res.json({
        success: true,
        premiumUser: {
          id: premiumUser._id.toString(),
          premiumMemberId: premiumUser.premiumMemberId,
          name: premiumUser.name,
          phone: premiumUser.phone,
          plan: premiumUser.plan,
          serviceLimit,
          usedThisYear,
          remainingServices: Math.max(serviceLimit - usedThisYear, 0),
          expiryDate: premiumUser.expiryDate
        }
      });
    }

    const premiumUser = inMemoryPremiumUsers.find(
      (user) => String(user.premiumMemberId || '').toUpperCase() === memberId && user.status === 'Active'
    );
    if (!premiumUser) {
      return res.status(404).json({ success: false, message: 'Premium ID not found or not active' });
    }
    const serviceLimit = Number(premiumUser.serviceLimit || 0);
    const usedThisYear = Number(premiumUser.servicesUsed || 0);
    res.json({
      success: true,
      premiumUser: {
        id: premiumUser.id,
        premiumMemberId: premiumUser.premiumMemberId,
        name: premiumUser.name,
        phone: premiumUser.phone,
        plan: premiumUser.plan,
        serviceLimit,
        usedThisYear,
        remainingServices: Math.max(serviceLimit - usedThisYear, 0),
        expiryDate: premiumUser.expiryDate
      }
    });
  } catch (err) {
    console.error('Lookup premium user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/premium-users/:id/approve-payment', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const premiumUser = await PremiumUser.findById(id);
      if (!premiumUser) {
        return res.status(404).json({ success: false, message: 'Premium user not found' });
      }

      premiumUser.status = 'Active';
      premiumUser.paymentStatus = 'Approved';
      if (!premiumUser.premiumMemberId) {
        let nextMemberId = generatePremiumMemberId();
        while (await PremiumUser.exists({ premiumMemberId: nextMemberId })) {
          nextMemberId = generatePremiumMemberId();
        }
        premiumUser.premiumMemberId = nextMemberId;
      }
      if (!premiumUser.serviceLimit) {
        premiumUser.serviceLimit = await getPlanServiceLimit(premiumUser.plan);
      }
      await premiumUser.save();

      let lead = null;
      if (premiumUser.leadData) {
        const existingLead = await Lead.findOne({
          email: premiumUser.email,
          phone: premiumUser.phone,
          premiumPlan: premiumUser.plan,
          premiumPrice: premiumUser.price
        });

        if (!existingLead) {
          const newLead = new Lead({
            ...premiumUser.leadData,
            isPremium: true,
            premiumPlan: premiumUser.plan,
            premiumPrice: premiumUser.price,
            status: 'New'
          });
          await newLead.save();
          lead = formatLead(newLead);
        } else {
          lead = formatLead(existingLead);
        }
      }

      return res.json({
        success: true,
        message: 'Payment approved successfully!',
        data: premiumUser,
        lead
      });
    }

    const index = inMemoryPremiumUsers.findIndex((user) => String(user.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Premium user not found' });
    }
    inMemoryPremiumUsers[index] = {
      ...inMemoryPremiumUsers[index],
      status: 'Active',
      paymentStatus: 'Approved',
      premiumMemberId: inMemoryPremiumUsers[index].premiumMemberId || generatePremiumMemberId(),
      serviceLimit: Number(inMemoryPremiumUsers[index].serviceLimit || 0),
      servicesUsed: Number(inMemoryPremiumUsers[index].servicesUsed || 0),
      serviceUsage: inMemoryPremiumUsers[index].serviceUsage || []
    };
    res.json({
      success: true,
      message: 'Payment approved successfully!',
      data: inMemoryPremiumUsers[index]
    });
  } catch (err) {
    console.error('Approve premium payment error:', err);
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
    const existingWorkOrder = await WorkOrder.findById(id);
    if (!existingWorkOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    if (updateData.status === 'in-progress' && !(updateData.beforeImage || existingWorkOrder.beforeImage)) {
      return res.status(400).json({ success: false, message: 'Before work photo is required to start work' });
    }
    
    // If status is being set to completed, set completedAt
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    if (updateData.status === 'completed') {
      const hasAfterImage = updateData.afterImage || existingWorkOrder.afterImage;
      const workDetails = (updateData.serviceDetails || existingWorkOrder.serviceDetails || '').trim();
      if (!hasAfterImage) {
        return res.status(400).json({ success: false, message: 'After work photo is required to finish work' });
      }
      if (!workDetails) {
        return res.status(400).json({ success: false, message: 'Work details are required to finish work' });
      }
      updateData.serviceDetails = workDetails;
      updateData.finalCost = Number(updateData.finalCost || 0);
      const submittedPremiumId = String(updateData.premiumMemberId || '').trim().toUpperCase();

      if (updateData.finalCost <= 0) {
        if (!submittedPremiumId) {
          return res.status(400).json({ success: false, message: 'Premium ID is required for free service. Otherwise select a paid service price.' });
        }
        const premiumUser = await PremiumUser.findOne({ premiumMemberId: submittedPremiumId, status: 'Active' });
        if (!premiumUser) {
          return res.status(400).json({ success: false, message: 'Premium ID not found or not active' });
        }
        if (premiumUser.expiryDate && new Date(premiumUser.expiryDate) < new Date()) {
          return res.status(400).json({ success: false, message: 'Premium plan is expired. Payment is required.' });
        }
        const serviceLimit = Number(premiumUser.serviceLimit || 0);
        const usedThisYear = getCurrentPremiumUsage(premiumUser);
        const alreadyUsedForThisOrder = (premiumUser.serviceUsage || []).some(
          (entry) => String(entry.workOrderId || '') === String(existingWorkOrder._id)
        );
        if (!alreadyUsedForThisOrder && usedThisYear >= serviceLimit) {
          return res.status(400).json({ success: false, message: `Free service limit over. This plan allows ${serviceLimit} free services per year. Payment is required.` });
        }
        if (!alreadyUsedForThisOrder) {
          premiumUser.serviceUsage.push({ workOrderId: existingWorkOrder._id, usedAt: new Date() });
          premiumUser.servicesUsed = getCurrentPremiumUsage(premiumUser);
          await premiumUser.save();
        }
        updateData.premiumUserId = premiumUser._id;
        updateData.premiumMemberId = premiumUser.premiumMemberId;
        updateData.premiumServiceCovered = true;
        updateData.premiumServiceUsageNumber = alreadyUsedForThisOrder ? existingWorkOrder.premiumServiceUsageNumber : usedThisYear + 1;
        updateData.paymentRequired = false;
        updateData.isPremium = true;
        updateData.premiumPlan = premiumUser.plan;
        updateData.premiumPrice = premiumUser.price;
      } else {
        updateData.premiumMemberId = submittedPremiumId || existingWorkOrder.premiumMemberId || '';
        updateData.premiumServiceCovered = false;
        updateData.paymentRequired = true;
      }
      updateData.earnings = Math.round(updateData.finalCost * 0.2);
      updateData.paymentMethod = 'upi';
    }
    
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(id, updateData, { new: true }).populate('assignedTo', 'firstName lastName email');
    
    // Update corresponding lead's status
    if (updatedWorkOrder.leadId) {
      let newLeadStatus = null;
      if (updatedWorkOrder.status === 'in-progress') {
        newLeadStatus = 'Working';
      } else if (updatedWorkOrder.status === 'completed') {
        newLeadStatus = 'Completed';
      }
      
      if (newLeadStatus) {
        await Lead.findByIdAndUpdate(updatedWorkOrder.leadId, { status: newLeadStatus });
      }
    }

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
