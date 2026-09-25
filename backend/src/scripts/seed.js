/**
 * Seed script — creates demo users and sample tickets.
 * Run: node src/scripts/seed.js
 *
 * Demo credentials (also documented in README):
 *   admin@example.com    / Admin1234!   (role: admin)
 *   agent@example.com    / Agent1234!   (role: agent)
 *   customer@example.com / Customer1234! (role: customer)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supportdb';

const USERS = [
  { name: 'Admin User', email: 'admin@example.com', password: 'Admin1234!', role: 'admin' },
  { name: 'Support Agent', email: 'agent@example.com', password: 'Agent1234!', role: 'agent' },
  {
    name: 'Demo Customer',
    email: 'customer@example.com',
    password: 'Customer1234!',
    role: 'customer',
  },
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({ email: { $in: USERS.map((u) => u.email) } });
  await Ticket.deleteMany({ title: { $regex: /^\[SEED\]/ } });

  // Create users
  const createdUsers = await Promise.all(USERS.map((u) => User.create(u)));
  const adminUser = createdUsers.find((u) => u.role === 'admin');
  const agentUser = createdUsers.find((u) => u.role === 'agent');
  const customerUser = createdUsers.find((u) => u.role === 'customer');

  console.log('👤 Users created:');
  createdUsers.forEach((u) => console.log(`   ${u.role}: ${u.email}`));

  // Sample tickets
  const TICKETS = [
    {
      title: '[SEED] Cannot login to my account',
      description:
        'I have been trying to login for the past hour but keep getting an "Invalid credentials" error even though I am sure my password is correct. Please help!',
      category: 'Technical',
      priority: 'High',
      status: 'Open',
      createdBy: customerUser._id,
      assignedTo: agentUser._id,
    },
    {
      title: '[SEED] Billing charge dispute - $49.99',
      description:
        'I was charged $49.99 on September 1st but I cancelled my subscription on August 25th. I need a refund for this charge immediately.',
      category: 'Billing',
      priority: 'High',
      status: 'In Progress',
      createdBy: customerUser._id,
      assignedTo: agentUser._id,
    },
    {
      title: '[SEED] How do I export my data?',
      description:
        'I would like to export all of my data in CSV format. Is this feature available? If so, where can I find it in the settings?',
      category: 'General',
      priority: 'Low',
      status: 'Open',
      createdBy: customerUser._id,
    },
    {
      title: '[SEED] Dashboard not loading - white screen',
      description:
        'After the latest update, the main dashboard shows a white screen. The console shows: TypeError: Cannot read property map of undefined. This is blocking my work.',
      category: 'Technical',
      priority: 'Critical',
      status: 'Open',
      createdBy: customerUser._id,
    },
    {
      title: '[SEED] Interested in upgrading to Enterprise plan',
      description:
        'We are a team of 50 and are considering upgrading to your Enterprise plan. Could someone from sales reach out to discuss pricing and custom features?',
      category: 'Sales',
      priority: 'Medium',
      status: 'Resolved',
      createdBy: customerUser._id,
      assignedTo: agentUser._id,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ];

  const createdTickets = [];
  for (const ticketData of TICKETS) {
    const ticket = await Ticket.create({
      ...ticketData,
      activityLog: [
        {
          action: 'TICKET_CREATED',
          performedBy: ticketData.createdBy,
          details: 'Ticket created via seed script',
        },
      ],
      aiSuggestion: {
        category: ticketData.category,
        priority: ticketData.priority,
        summary: ticketData.description.slice(0, 100),
        draftReply: `Thank you for contacting support. We have received your request and will respond shortly.`,
        fallback: true,
        generatedAt: new Date(),
      },
    });
    createdTickets.push(ticket);
  }

  console.log(`🎫 ${createdTickets.length} sample tickets created`);
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:    admin@example.com    / Admin1234!');
  console.log('   Agent:    agent@example.com    / Agent1234!');
  console.log('   Customer: customer@example.com / Customer1234!');

  await mongoose.disconnect();
  console.log('\n✅ Seeding complete!');
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
