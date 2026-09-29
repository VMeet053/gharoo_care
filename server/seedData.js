const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const WorkOrder = require('./models/WorkOrder');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding!');

    // Clear existing data
    await User.deleteMany({ role: 'Service Man' });
    await WorkOrder.deleteMany({});
    console.log('Cleared existing service men and work orders');

    // Create service men
    const serviceMen = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@gharoocare.com',
        phone: '+91 98765 43210',
        password: await bcrypt.hash('password123', 10),
        role: 'Service Man',
        team: 'Operations',
        status: 'Active'
      },
      {
        firstName: 'Suresh',
        lastName: 'Patel',
        email: 'suresh@gharoocare.com',
        phone: '+91 98765 09876',
        password: await bcrypt.hash('password123', 10),
        role: 'Service Man',
        team: 'Technical',
        status: 'Active'
      },
      {
        firstName: 'Amit',
        lastName: 'Sharma',
        email: 'amit@gharoocare.com',
        phone: '+91 98765 65432',
        password: await bcrypt.hash('password123', 10),
        role: 'Service Man',
        team: 'Support',
        status: 'Active'
      }
    ];

    const createdUsers = await User.create(serviceMen);
    console.log('Created sample service men!');
    console.log('Service Man Logins:');
    createdUsers.forEach(user => {
      console.log(`- ${user.email} / password123`);
    });

    // Create sample work orders
    const workOrders = [
      {
        title: 'AC Repair',
        description: 'Split AC not cooling, need gas refilling and service',
        customerName: 'Ramesh Bhai',
        customerPhone: '+91 90909 09090',
        customerAddress: '123, Main Road, Ahmedabad',
        status: 'assigned',
        priority: 'high',
        assignedTo: createdUsers[0]._id,
        serviceType: 'AC Repair',
        estimatedCost: 2500,
        earnings: 500
      },
      {
        title: 'TV Installation',
        description: '55 inch Smart TV wall mounting and setup',
        customerName: 'Sita Ben',
        customerPhone: '+91 80808 08080',
        customerAddress: '456, Park Street, Ahmedabad',
        status: 'pending',
        priority: 'medium',
        assignedTo: null,
        serviceType: 'TV Installation',
        estimatedCost: 800,
        earnings: 200
      },
      {
        title: 'Washing Machine Repair',
        description: 'Front load machine making loud noise during spin cycle',
        customerName: 'Hari Bhai',
        customerPhone: '+91 70707 07070',
        customerAddress: '789, Green Avenue, Ahmedabad',
        status: 'in-progress',
        priority: 'urgent',
        assignedTo: createdUsers[1]._id,
        serviceType: 'Washing Machine Repair',
        estimatedCost: 1800,
        earnings: 400
      }
    ];

    await WorkOrder.create(workOrders);
    console.log('Created sample work orders!');

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
