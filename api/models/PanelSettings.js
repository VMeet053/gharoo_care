const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  eyebrow: { type: String, required: true },
  titleTop: { type: String, required: true },
  titleHighlight: { type: String, required: true },
  text: { type: String, required: true },
  bg: { type: String, default: '' },
  side: { type: String, default: '' }
});

const heroSchema = new mongoose.Schema({
  slides: {
    type: [heroSlideSchema],
    default: [
      { eyebrow: 'Find The Best Support You Need Today.', titleTop: 'Current Solutions For', titleHighlight: 'Your Modern Problems', text: 'We provide expert repair services for all your electronic devices with fast turnaround and warranty-backed quality.', bg: '', side: '' },
      { eyebrow: 'Fast & Reliable Service', titleTop: 'Repairing Devices', titleHighlight: 'With Expert Care', text: 'Quick turnarounds and warranty-backed repairs for phones, laptops and appliances by certified technicians.', bg: '', side: '' },
      { eyebrow: 'Convenient Pickup & Delivery', titleTop: 'Doorstep Service', titleHighlight: 'For Your Convenience', text: 'Schedule a pickup and we will return your device fully tested and working — hassle-free service at your door.', bg: '', side: '' }
    ]
  }
});

const aboutFeatureSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true }
});

const aboutExperienceSchema = new mongoose.Schema({
  number: { type: String, default: '25+' },
  line1: { type: String, default: 'Years Experiences' },
  line2: { type: String, default: 'Maintenance Services' }
});

const aboutSchema = new mongoose.Schema({
  eyebrow: { type: String, default: 'ABOUT US' },
  title: { type: String, default: 'Welcome To Repair & Installing Company' },
  description: { type: String, default: 'We are a trusted electronics repair company offering comprehensive solutions for phones, laptops, tablets, and home appliances.' },
  features: {
    type: [aboutFeatureSchema],
    default: [
      { icon: '💰', title: 'Our Affordable Price', desc: 'Transparent pricing with no hidden fees — quality repairs at fair rates.' },
      { icon: '👨‍🔧', title: 'Customer Satisfied', desc: 'Thousands of happy customers trust us for reliable device repairs.' }
    ]
  },
  mainImage: { type: String, default: '' },
  subImage: { type: String, default: '' },
  experience: { type: aboutExperienceSchema, default: () => ({}) }
});

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String, required: true },
  image: { type: String, default: '' }
});

const servicesHeaderSchema = new mongoose.Schema({
  label: { type: String, default: 'WHAT WE DO' },
  title: { type: String, default: 'Our Core Repair Services' },
  description: { type: String, default: 'Expert solutions for every device — fast, affordable, and warranty-backed.' }
});

const servicesSchema = new mongoose.Schema({
  header: { type: servicesHeaderSchema, default: () => ({}) },
  items: {
    type: [serviceSchema],
    default: [
      { title: 'Phone Repair', desc: 'Screen, battery, and component repairs for all major smartphone brands.', icon: '📱' },
      { title: 'Laptop Repair', desc: 'Logic board, keyboard, and display repairs for laptops and notebooks.', icon: '💻' },
      { title: 'Appliance Repair', desc: 'AC, washing machine, and home appliance diagnostics and fixes.', icon: '🔧' },
      { title: 'Diagnostics', desc: 'Comprehensive device health checks with detailed repair estimates.', icon: '🔍' }
    ]
  }
});

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  avatar: { type: String, default: '' },
  rating: { type: Number, default: 5 }
});

const testimonialsSchema = new mongoose.Schema({
  items: { type: [testimonialSchema], default: [] }
});

const pricingHeaderSchema = new mongoose.Schema({
  label: { type: String, default: 'PRICING' },
  title: { type: String, default: 'Choose Your Plan' },
  description: { type: String, default: 'Simple, transparent pricing for all your repair needs.' }
});

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  features: [String],
  popular: { type: Boolean, default: false }
});

const pricingSchema = new mongoose.Schema({
  header: { type: pricingHeaderSchema, default: () => ({}) },
  plans: { type: [pricingPlanSchema], default: [] }
});

const contactSchema = new mongoose.Schema({
  title: { type: String, default: 'Get In Touch' },
  description: { type: String, default: 'Have questions? We are here to help!' },
  phone: { type: String, default: '+91 1234567890' },
  email: { type: String, default: 'contact@gharoocare.com' },
  address: { type: String, default: '123 Main St, City, State' }
});

const statsItemSchema = new mongoose.Schema({
  label: String,
  value: String,
  format: { type: String, default: 'default' },
  icon: { type: String, default: '' }
});

const statsSchema = new mongoose.Schema({
  items: { 
    type: [statsItemSchema], 
    default: [
      { icon: '🛠️', value: '1250', format: 'k', label: 'Successful Projects' },
      { icon: '👷', value: '500', format: 'plus', label: 'Experts Staffs' },
      { icon: '😊', value: '1330', format: 'k', label: 'Happy Customers' },
      { icon: '🏆', value: '100', format: 'percent', label: 'Quality Products' }
    ] 
  }
});

const headerNavLinkSchema = new mongoose.Schema({
  text: String,
  link: String
});

const headerSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  navLinks: {
    type: [headerNavLinkSchema],
    default: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      { text: 'Services', link: '/services' },
      { text: 'Pricing', link: '/pricing' },
      { text: 'Contact', link: '/contact' }
    ]
  }
});

const footerSocialLinkSchema = new mongoose.Schema({
  platform: String,
  url: String
});

const footerSchema = new mongoose.Schema({
  description: { type: String, default: 'Your trusted partner for all electronics repair needs.' },
  copyright: { type: String, default: '© 2024 Gharoocare. All rights reserved.' },
  socialLinks: { type: [footerSocialLinkSchema], default: [] }
});

const brandMarqueeSchema = new mongoose.Schema({
  brands: { 
    type: [String], 
    default: [
      'Apple Repair', 'Samsung Service', 'Dell Support', 'HP Certified',
      'Lenovo Fix', 'Asus Care', 'Sony Repair', 'LG Service',
      'Microsoft', 'Google Pixel', 'OnePlus', 'Xiaomi'
    ] 
  }
});

const newSectionFeatureSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: { type: String, default: '' }
});

const newSectionSchema = new mongoose.Schema({
  features: {
    type: [newSectionFeatureSchema],
    default: [
      { title: 'Skilled Technicians', description: 'Our certified experts handle every repair with precision and care, using industry-standard tools and techniques.' },
      { title: '24/7 Our Service', description: 'Round-the-clock support and emergency repair services so your devices are never out of action for long.' },
      { title: 'Quality Guarantee', description: 'Every repair is backed by our warranty — we stand behind our work with transparent pricing and honest service.' }
    ]
  }
});

const whyChooseCardSchema = new mongoose.Schema({
  title: String,
  desc: String,
  icon: String
});

const whyChooseSchema = new mongoose.Schema({
  eyebrow: { type: String, default: 'WHY CHOOSE US' },
  title: { type: String, default: 'When You Need Repair We Are Always Here' },
  description: { type: String, default: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service. We understand the importance of keeping your devices running smoothly.' },
  mainImage: { type: String, default: '' },
  subImage: { type: String, default: '' },
  cards: {
    type: [whyChooseCardSchema],
    default: [
      { title: 'Warranty Service', desc: 'All repairs come with a comprehensive warranty for your peace of mind.', icon: '📦' },
      { title: 'Customer Service', desc: 'Friendly support team ready to assist you at every step of the process.', icon: '🤝' },
      { title: 'Secured Device', desc: 'Your data and devices are handled with strict security protocols.', icon: '🔒' },
      { title: 'No Virus Threat', desc: 'Thorough malware scans and clean software installs on every device.', icon: '🛡️' }
    ]
  }
});

const completedProjectSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: String
});

const completedProjectsSchema = new mongoose.Schema({
  label: { type: String, default: 'LATEST PROJECTS' },
  title: { type: String, default: 'Our Completed Projects' },
  projects: {
    type: [completedProjectSchema],
    default: []
  }
});

const serviceSliderServiceSchema = new mongoose.Schema({
  title: String,
  desc: String,
  icon: String,
  image: String
});

const serviceSliderSchema = new mongoose.Schema({
  eyebrow: { type: String, default: 'OUR SERVICES' },
  title: { type: String, default: "Let's Check Our Best Repair Services In City" },
  description: { type: String, default: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service.' },
  services: {
    type: [serviceSliderServiceSchema],
    default: [
      { title: 'Hardware Update Service', desc: 'Upgrade components and boost performance with certified parts and expert installation.', icon: '⚙️' },
      { title: 'Tablets & iPad Services', desc: 'Screen, battery and software repairs for all tablet brands and models.', icon: '📱' },
      { title: 'Laptop & Desktop Repair', desc: 'Full diagnostics, logic board repair, and component replacement services.', icon: '💻' },
      { title: 'Software Installation', desc: 'OS installs, driver updates, and malware removal by trained technicians.', icon: '💿' },
      { title: 'Data Recovery', desc: 'Recover lost files from damaged drives, phones, and storage devices.', icon: '🛡️' }
    ]
  }
});

const heroBannerItemSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  redirectUrl: { type: String, default: '/booking' },
  altText: { type: String, default: 'Gharoo Care banner' }
});

const heroBannersSchema = new mongoose.Schema({
  items: {
    type: [heroBannerItemSchema],
    default: [{ image: '', redirectUrl: '/booking', altText: 'Gharoo Care banner' }]
  }
});

const panelSettingsSchema = new mongoose.Schema({
  hero: { type: heroSchema, default: () => ({}) },
  heroBanners: { type: heroBannersSchema, default: () => ({}) },
  about: { type: aboutSchema, default: () => ({}) },
  services: { type: servicesSchema, default: () => ({}) },
  testimonials: { type: testimonialsSchema, default: () => ({}) },
  pricing: { type: pricingSchema, default: () => ({}) },
  contact: { type: contactSchema, default: () => ({}) },
  stats: { type: statsSchema, default: () => ({}) },
  header: { type: headerSchema, default: () => ({}) },
  footer: { type: footerSchema, default: () => ({}) },
  brandMarquee: { type: brandMarqueeSchema, default: () => ({}) },
  newSection: { type: newSectionSchema, default: () => ({}) },
  whyChoose: { type: whyChooseSchema, default: () => ({}) },
  completedProjects: { type: completedProjectsSchema, default: () => ({}) },
  serviceSlider: { type: serviceSliderSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('PanelSettings', panelSettingsSchema);
