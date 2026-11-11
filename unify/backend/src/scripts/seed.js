// One-time Firestore seed script — mirrors the old schema.sql seed data.
// Usage: npm run seed   (run from backend/, with .env populated)
require('dotenv').config();
const { API_KEY } = require('../config/firebase');
const { listDocs, createDoc } = require('../lib/firestoreRest');

const now = () => new Date().toISOString();

// Signs the admin user up (or in, if they already exist) via the Identity
// Toolkit REST API — the same public API the client SDK uses, authenticated
// with just the web API key. Returns { uid, idToken } to write Firestore
// data as that user (firestore.rules' isAdmin() check authorizes the rest).
async function signUpOrSignIn(email, password) {
  const signUp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const signUpBody = await signUp.json();
  if (signUp.ok) return { uid: signUpBody.localId, idToken: signUpBody.idToken };
  if (signUpBody?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(`signUp failed: ${signUpBody?.error?.message || signUp.status}`);
  }

  const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const signInBody = await signIn.json();
  if (!signIn.ok) throw new Error(`signIn failed: ${signInBody?.error?.message || signIn.status}`);
  return { uid: signInBody.localId, idToken: signInBody.idToken };
}

async function seedCollection(name, docs, idToken) {
  const existing = await listDocs(name, { limit: 1 }, idToken);
  if (existing.length) {
    console.log(`skip ${name} (already has data)`);
    return;
  }
  await Promise.all(docs.map(({ id, ...data }) =>
    createDoc(name, { ...data, createdAt: now() }, idToken, id ? { documentId: id } : {})
  ));
  console.log(`seeded ${name}: ${docs.length} docs`);
}

async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log('skip admin user (set ADMIN_EMAILS and ADMIN_SEED_PASSWORD in .env to create one)');
    return null;
  }

  const { uid, idToken } = await signUpOrSignIn(email, password);
  console.log(`admin auth user ready: ${email}`);

  try {
    await createDoc('users', {
      name: 'Admin', email, company: 'UNIFY Admin', isAdmin: true, createdAt: now(),
    }, idToken, { documentId: uid });
    console.log('admin profile written to Firestore');
  } catch (err) {
    if (err.status === 409) {
      console.log('admin profile already exists in Firestore');
    } else {
      throw err;
    }
  }

  return idToken;
}

async function main() {
  const adminIdToken = await seedAdminUser();
  if (!adminIdToken) {
    console.log('no admin credentials — skipping catalog seed (requires an authenticated admin per firestore.rules)');
    return;
  }

  await seedCollection('opportunities', [
    { id: '1', title: 'Smart City Infrastructure Development', sector: 'IT & Infrastructure', location: 'Mumbai', budgetRange: '₹4Cr - ₹16Cr', deadline: '2026-04-15', matchScore: 92, type: 'tender', postedBy: 'Ministry of Innovation', description: 'Design and implement IoT-based smart city solutions including traffic management and waste monitoring.', saved: false },
    { id: '2', title: 'Agricultural Supply Chain Digitization', sector: 'Agriculture & Tech', location: 'Pune', budgetRange: '₹4Cr', deadline: '2026-05-01', matchScore: 87, type: 'contract', postedBy: 'AgriTech Corp', description: 'Build a digital supply chain platform connecting farmers to markets.', saved: false },
    { id: '3', title: 'Renewable Energy Component Supply', sector: 'Energy', location: 'Ahmedabad', budgetRange: '₹2.8Cr', deadline: '2026-04-20', matchScore: 78, type: 'outsourcing', postedBy: 'SolarPlus Ltd', description: 'Supply solar panel components and installation services.', saved: false },
    { id: '4', title: 'Healthcare Data Analytics Platform', sector: 'Healthcare & IT', location: 'Bengaluru', budgetRange: '₹2.4Cr - ₹8Cr', deadline: '2026-05-10', matchScore: 85, type: 'tender', postedBy: 'National Health Authority', description: 'Develop a comprehensive health data analytics and reporting platform.', saved: false },
    { id: '5', title: 'E-Commerce Logistics Integration', sector: 'Logistics', location: 'Delhi NCR', budgetRange: '₹80L - ₹3.2Cr', deadline: '2026-04-25', matchScore: 73, type: 'collaboration', postedBy: 'TradeHub India', description: 'Integrate logistics and delivery tracking for e-commerce platforms.', saved: false },
    { id: '6', title: 'Financial Inclusion Mobile Platform', sector: 'FinTech', location: 'Hyderabad', budgetRange: '₹3.8Cr', deadline: '2026-05-20', matchScore: 90, type: 'contract', postedBy: 'Digital India Finance', description: 'Build a mobile-first financial inclusion platform for underserved communities.', saved: false },
    { id: '7', title: 'National Road Safety Management System', sector: 'Transportation & IT', location: 'New Delhi', budgetRange: '₹6Cr - ₹18Cr', deadline: '2026-04-30', matchScore: 88, type: 'tender', postedBy: 'Ministry of Road Transport', description: 'Implement an integrated road safety management system.', saved: false },
    { id: '8', title: 'Water Treatment Facility Modernization', sector: 'Water Management', location: 'Kolkata', budgetRange: '₹1.4Cr - ₹5.2Cr', deadline: '2026-05-05', matchScore: 82, type: 'tender', postedBy: 'State Water Board', description: 'Upgrade and modernize water treatment facilities.', saved: false },
    { id: '9', title: 'Renewable Energy Grid Integration', sector: 'Energy & Infrastructure', location: 'Karnataka', budgetRange: '₹8Cr - ₹22Cr', deadline: '2026-06-15', matchScore: 84, type: 'tender', postedBy: 'National Grid Authority', description: 'Design and deploy renewable energy management systems.', saved: false },
    { id: '10', title: 'Education Technology Platform Development', sector: 'EdTech & IT', location: 'Bangalore', budgetRange: '₹2.2Cr - ₹6.8Cr', deadline: '2026-05-25', matchScore: 86, type: 'tender', postedBy: 'Ministry of Education', description: 'Build comprehensive e-learning platform with AI-powered personalized learning paths.', saved: false },
    { id: '11', title: 'Cybersecurity Infrastructure Enhancement', sector: 'IT & Cybersecurity', location: 'Hyderabad', budgetRange: '₹3Cr - ₹9Cr', deadline: '2026-04-20', matchScore: 91, type: 'tender', postedBy: 'National Cyber Security Agency', description: 'Deploy advanced cybersecurity infrastructure.', saved: false },
    { id: '12', title: 'Manufacturing Excellence Program - Automation', sector: 'Manufacturing & IT', location: 'Gujarat', budgetRange: '₹4.5Cr - ₹13Cr', deadline: '2026-05-30', matchScore: 79, type: 'tender', postedBy: 'Ministry of Industry', description: 'Implement Industry 4.0 solutions.', saved: false },
  ], adminIdToken);

  await seedCollection('supplyChainRequests', [
    { companyName: 'BuildTech Industries', title: 'Steel Beams & Structural Components', sector: 'Construction', quantity: '500 metric tons', budget: '₹6Cr', location: 'Mumbai', deadline: '2026-04-30', description: 'High-grade structural steel for commercial building projects.' },
    { companyName: 'FreshFarm Co.', title: 'Cold Storage Equipment', sector: 'Agriculture', quantity: '25 units', budget: '₹1.6Cr', location: 'Pune', deadline: '2026-05-15', description: 'Industrial cold storage units for perishable goods.' },
    { companyName: 'TechVentures Ltd', title: 'Server Infrastructure Setup', sector: 'Technology', quantity: 'Data center 200 racks', budget: '₹9.6Cr', location: 'Bengaluru', deadline: '2026-06-01', description: 'Complete data center setup including servers, networking, and cooling.' },
    { companyName: 'CleanEnergy Corp', title: 'Solar Panel Manufacturing Materials', sector: 'Energy', quantity: '10,000 panels worth', budget: '₹4Cr', location: 'Gujarat', deadline: '2026-05-20', description: 'Raw materials for solar panel manufacturing including silicon wafers.' },
  ], adminIdToken);

  await seedCollection('collaborations', [
    { companyName: 'InnovateTech Solutions', projectTitle: 'Pan-India Digital ID System', requiredSkills: ['Blockchain', 'Mobile Dev', 'Security'], budget: '₹16Cr', sector: 'GovTech', partnersNeeded: 3, description: 'Building a decentralized digital identity system for cross-state verification.' },
    { companyName: 'GreenBuild Consortium', projectTitle: 'Sustainable Housing Initiative', requiredSkills: ['Architecture', 'Green Energy', 'Construction'], budget: '₹40Cr', sector: 'Construction', partnersNeeded: 5, description: 'Affordable and sustainable housing using local materials and renewable energy.' },
    { companyName: 'HealthBridge AI', projectTitle: 'Telemedicine Network Expansion', requiredSkills: ['Healthcare IT', 'AI/ML', 'Networking'], budget: '₹12Cr', sector: 'Healthcare', partnersNeeded: 2, description: 'Expanding telemedicine capabilities to rural clinics across India.' },
  ], adminIdToken);

  await seedCollection('governmentContracts', [
    { id: '1', title: 'National Highway Smart Tolling System', department: 'Ministry of Road Transport & Highways', location: 'Pan India', budget: '₹8.5 Cr', deadline: '2026-05-15', sector: 'IT & Infrastructure', verified: true, description: 'Design, develop and deploy smart tolling systems across 200+ toll plazas on national highways.', fullDescription: 'This project involves designing and implementing a comprehensive smart tolling system across national highways.', applyLink: '', status: 'active' },
    { id: '2', title: 'Digital Health Records Platform', department: 'Ministry of Health & Family Welfare', location: 'New Delhi', budget: '₹3.2 Cr', deadline: '2026-04-30', sector: 'Healthcare & IT', verified: true, description: 'Unified digital health records management system for government hospitals.', fullDescription: 'Development of a unified Electronic Health Records (EHR) system for integration across government hospitals.', applyLink: '', status: 'active' },
    { id: '3', title: 'Agricultural Commodity Exchange Portal', department: 'Ministry of Agriculture', location: 'Multiple States', budget: '₹1.8 Cr', deadline: '2026-06-01', sector: 'Agriculture & Tech', verified: true, description: 'Online portal for agricultural commodity trading and price discovery.', fullDescription: 'Creation of a digital agricultural commodity exchange platform connecting farmers directly to buyers.', applyLink: '', status: 'active' },
    { id: '4', title: 'Smart Water Management System', department: 'Jal Shakti Ministry', location: 'Rajasthan', budget: '₹4.5 Cr', deadline: '2026-05-20', sector: 'Infrastructure', verified: true, description: 'IoT-based water distribution and quality monitoring for rural areas.', fullDescription: 'Implementation of an IoT-based water management and distribution system for rural municipalities.', applyLink: '', status: 'active' },
    { id: '5', title: 'Renewable Energy Grid Integration', department: 'Ministry of New & Renewable Energy', location: 'Gujarat & Tamil Nadu', budget: '₹12 Cr', deadline: '2026-07-01', sector: 'Energy', verified: false, description: 'Integration of solar and wind energy sources into the national power grid.', fullDescription: 'Develop and deploy a comprehensive renewable energy management system.', applyLink: '', status: 'active' },
  ], adminIdToken);

  await seedCollection('governmentTenders', [
    { id: 't1', title: 'Smart City Infrastructure Development', department: 'Ministry of Innovation', location: 'Mumbai', budget: '₹4Cr - ₹16Cr', deadline: '2026-04-15', sector: 'IT & Infrastructure', verified: true, description: 'Design and implement IoT-based smart city solutions including traffic management and waste monitoring.', fullDescription: 'Comprehensive smart city infrastructure development including IoT sensors, data centers, and analytics platforms.', applyLink: '', status: 'active' },
    { id: 't2', title: 'Healthcare Data Analytics Platform', department: 'National Health Authority', location: 'Bengaluru', budget: '₹2.4Cr - ₹8Cr', deadline: '2026-05-10', sector: 'Healthcare & IT', verified: true, description: 'Develop a comprehensive health data analytics platform.', fullDescription: 'Development of an advanced health data analytics platform integrating data from hospitals, clinics, and public health agencies.', applyLink: '', status: 'active' },
    { id: 't3', title: 'National Road Safety Management System', department: 'Ministry of Road Transport', location: 'New Delhi', budget: '₹6Cr - ₹18Cr', deadline: '2026-04-30', sector: 'Transportation & IT', verified: false, description: 'Implement an integrated road safety management system.', fullDescription: 'End-to-end road safety management system integrating CCTV, speed cameras, crash reporting, emergency response, and analytics.', applyLink: '', status: 'active' },
  ], adminIdToken);

  await seedCollection('notifications', [
    { id: '1', title: 'Application shortlisted', description: 'Your application for Smart City Infrastructure has been shortlisted.', link: '/applications', read: false },
    { id: '2', title: 'New supply chain request', description: 'BuildTech Industries posted a new procurement requirement.', link: '/supply-chain', read: false },
    { id: '3', title: 'AI Match Found', description: 'A new 90% match opportunity in FinTech sector is available.', link: '/ai-recommendations', read: true },
    { id: '4', title: 'Collaboration invite', description: 'InnovateTech Solutions invited you to join a consortium.', link: '/collaborations', read: true },
  ], adminIdToken);

  const profileExisting = await listDocs('profile', { limit: 1 }, adminIdToken);
  if (!profileExisting.length) {
    await createDoc('profile', {
      companyName: 'C-78 PVT LTD',
      industry: 'IT & Infrastructure',
      employees: 125,
      location: 'Mumbai, Maharashtra, India',
      capabilities: ['Enterprise Software Development', 'Cloud Infrastructure', 'IoT Solutions', 'Data Analytics', 'Mobile Applications', 'Blockchain Integration', 'AI/ML Solutions'],
      certifications: ['ISO 27001:2013', 'CMMI Level 3', 'AWS Partner Network', 'Google Cloud Partner', 'NASSCOM Certified'],
      bio: 'Trusted technology partner for digital transformation, specializing in government and enterprise solutions.',
      pastProjects: [
        { name: 'Smart Traffic Management System - Mumbai', client: 'Mumbai Municipal Corporation', year: 2025 },
        { name: 'Agricultural Data Tracking Platform', client: 'Ministry of Agriculture & Farmers Welfare', year: 2025 },
        { name: 'Digital Payment Integration System', client: 'Reserve Bank of India', year: 2024 },
        { name: 'Healthcare Records Management Platform', client: 'National Health Authority', year: 2024 },
        { name: 'Supply Chain Digitization Project', client: 'Indian Tea Board', year: 2023 },
      ],
      updatedAt: now(),
    }, adminIdToken, { documentId: 'main' });
    console.log('seeded profile/main');
  } else {
    console.log('skip profile (already exists)');
  }

  const convosExisting = await listDocs('conversations', { limit: 1 }, adminIdToken);
  if (!convosExisting.length) {
    await createDoc('conversations', {
      name: 'eshheet raka', company: 'BuildTech Industries', avatar: 'ER', unreadCount: 2,
      lastMessage: 'Can we discuss the supply chain proposal?', lastMessageAt: now(),
    }, adminIdToken, { documentId: '1' });

    const msgs = [
      { text: 'Hi! We saw your profile on UNIFY and were impressed by your capabilities.', sender: 'them' },
      { text: "Thank you, eshheet! We'd love to collaborate. What's the project scope?", sender: 'me' },
      { text: 'We need IT infrastructure support for our new construction project. Budget is around ₹50L.', sender: 'them' },
      { text: 'Can we discuss the supply chain proposal?', sender: 'them' },
    ];
    for (const m of msgs) {
      await createDoc('conversations/1/messages', { ...m, createdAt: now() }, adminIdToken);
    }
    console.log('seeded conversations: 1 (with messages)');
  } else {
    console.log('skip conversations (already has data)');
  }

  console.log('done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
