export interface Opportunity {
  id: string;
  title: string;
  sector: string;
  location: string;
  budgetRange: string;
  deadline: string;
  matchScore: number;
  type: "tender" | "contract" | "outsourcing" | "collaboration";
  postedBy: string;
  description: string;
  saved?: boolean;
  createdAt?: string;
}

export interface SupplyChainRequest {
  id: string;
  companyName: string;
  title: string;
  sector: string;
  quantity: string;
  budget: string;
  location: string;
  deadline: string;
  description: string;
  createdBy?: string;
}

export interface Collaboration {
  id: string;
  companyName: string;
  projectTitle: string;
  requiredSkills: string[];
  budget: string;
  sector: string;
  partnersNeeded: number;
  description: string;
  fullDescription?: string;
  createdBy?: string;
}

export interface Application {
  id: string;
  opportunityTitle: string;
  opportunityId?: string;
  opportunityType?: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "accepted" | "withdrawn";
  appliedDate: string;
  sector: string;
  budget: string;
  company?: string;
  location?: string;
  description?: string;
  message?: string;
  ownerId?: string;
  applicantId?: string;
  applicantName?: string;
  applicantCompany?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  nextStep?: string;
  contractValue?: string;
  duration?: string;
}

export const opportunities: Opportunity[] = [
  { id: "1", title: "Smart City Infrastructure Development", sector: "IT & Infrastructure", location: "Mumbai", budgetRange: "₹4Cr - ₹16Cr", deadline: "2026-04-15", matchScore: 92, type: "tender", postedBy: "Ministry of Innovation", description: "Design and implement IoT-based smart city solutions including traffic management and waste monitoring.", saved: false },
  { id: "2", title: "Agricultural Supply Chain Digitization", sector: "Agriculture & Tech", location: "Pune", budgetRange: "₹4Cr", deadline: "2026-05-01", matchScore: 87, type: "contract", postedBy: "AgriTech Corp", description: "Build a digital supply chain platform connecting farmers to markets.", saved: true },
  { id: "3", title: "Renewable Energy Component Supply", sector: "Energy", location: "Ahmedabad", budgetRange: "₹2.8Cr", deadline: "2026-04-20", matchScore: 78, type: "outsourcing", postedBy: "SolarPlus Ltd", description: "Supply solar panel components and installation services.", saved: false },
  { id: "4", title: "Healthcare Data Analytics Platform", sector: "Healthcare & IT", location: "Bengaluru", budgetRange: "₹2.4Cr - ₹8Cr", deadline: "2026-05-10", matchScore: 85, type: "tender", postedBy: "National Health Authority", description: "Develop a comprehensive health data analytics and reporting platform with real-time dashboards, patient records management, and predictive analytics for disease outbreaks.", saved: false },
  { id: "5", title: "E-Commerce Logistics Integration", sector: "Logistics", location: "Delhi NCR", budgetRange: "₹80L - ₹3.2Cr", deadline: "2026-04-25", matchScore: 73, type: "collaboration", postedBy: "TradeHub India", description: "Integrate logistics and delivery tracking for e-commerce platforms.", saved: false },
  { id: "6", title: "Financial Inclusion Mobile Platform", sector: "FinTech", location: "Hyderabad", budgetRange: "₹3.8Cr", deadline: "2026-05-20", matchScore: 90, type: "contract", postedBy: "Digital India Finance", description: "Build a mobile-first financial inclusion platform for underserved communities.", saved: false },
  { id: "7", title: "National Road Safety Management System", sector: "Transportation & IT", location: "New Delhi", budgetRange: "₹6Cr - ₹18Cr", deadline: "2026-04-30", matchScore: 88, type: "tender", postedBy: "Ministry of Road Transport", description: "Implement an integrated road safety management system with real-time traffic monitoring, accident prevention alerts, and centralized incident response coordination across highways and urban roads.", saved: false },
  { id: "8", title: "Water Treatment Facility Modernization", sector: "Water Management", location: "Kolkata", budgetRange: "₹1.4Cr - ₹5.2Cr", deadline: "2026-05-05", matchScore: 82, type: "tender", postedBy: "State Water Board", description: "Upgrade and modernize water treatment facilities with advanced filtration systems, automated quality monitoring, and smart water distribution networks for urban municipalities.", saved: false },
  { id: "9", title: "Renewable Energy Grid Integration", sector: "Energy & Infrastructure", location: "Karnataka", budgetRange: "₹8Cr - ₹22Cr", deadline: "2026-06-15", matchScore: 84, type: "tender", postedBy: "National Grid Authority", description: "Design and deploy renewable energy management systems for optimal grid integration, load balancing, and energy storage solutions across state power networks.", saved: false },
  { id: "10", title: "Education Technology Platform Development", sector: "EdTech & IT", location: "Bangalore", budgetRange: "₹2.2Cr - ₹6.8Cr", deadline: "2026-05-25", matchScore: 86, type: "tender", postedBy: "Ministry of Education", description: "Build comprehensive e-learning platform with AI-powered personalized learning paths, virtual classrooms, assessment tools, and accessibility features for students with disabilities.", saved: false },
  { id: "11", title: "Cybersecurity Infrastructure Enhancement", sector: "IT & Cybersecurity", location: "Hyderabad", budgetRange: "₹3Cr - ₹9Cr", deadline: "2026-04-20", matchScore: 91, type: "tender", postedBy: "National Cyber Security Agency", description: "Deploy advanced cybersecurity infrastructure including threat detection systems, incident response platforms, and security operations center setup for critical government institutions.", saved: false },
  { id: "12", title: "Manufacturing Excellence Program - Automation", sector: "Manufacturing & IT", location: "Gujarat", budgetRange: "₹4.5Cr - ₹13Cr", deadline: "2026-05-30", matchScore: 79, type: "tender", postedBy: "Ministry of Industry", description: "Implement Industry 4.0 solutions including IoT sensors, robotic automation, AI-based quality control, and digital supply chain management for manufacturing units.", saved: false },
];

export const supplyChainRequests: SupplyChainRequest[] = [
  { id: "1", companyName: "BuildTech Industries", title: "Steel Beams & Structural Components", sector: "Construction", quantity: "500 metric tons", budget: "₹6Cr", location: "Mumbai", deadline: "2026-04-30", description: "High-grade structural steel for commercial building projects." },
  { id: "2", companyName: "FreshFarm Co.", title: "Cold Storage Equipment", sector: "Agriculture", quantity: "25 units", budget: "₹1.6Cr", location: "Pune", deadline: "2026-05-15", description: "Industrial cold storage units for perishable goods." },
  { id: "3", companyName: "TechVentures Ltd", title: "Server Infrastructure Setup", sector: "Technology", quantity: "Data center for 200 racks", budget: "₹9.6Cr", location: "Bengaluru", deadline: "2026-06-01", description: "Complete data center setup including servers, networking, and cooling." },
  { id: "4", companyName: "CleanEnergy Corp", title: "Solar Panel Manufacturing Materials", sector: "Energy", quantity: "10,000 panels worth", budget: "₹4Cr", location: "Gujarat", deadline: "2026-05-20", description: "Raw materials for solar panel manufacturing including silicon wafers." },
];

export const collaborations: Collaboration[] = [
  { id: "1", companyName: "InnovateTech Solutions", projectTitle: "Pan-India Digital ID System", requiredSkills: ["Blockchain", "Mobile Dev", "Security"], budget: "₹16Cr", sector: "GovTech", partnersNeeded: 3, description: "Building a decentralized digital identity system for cross-state verification." },
  { id: "2", companyName: "GreenBuild Consortium", projectTitle: "Sustainable Housing Initiative", requiredSkills: ["Architecture", "Green Energy", "Construction"], budget: "₹40Cr", sector: "Construction", partnersNeeded: 5, description: "Affordable and sustainable housing using local materials and renewable energy." },
  { id: "3", companyName: "HealthBridge AI", projectTitle: "Telemedicine Network Expansion", requiredSkills: ["Healthcare IT", "AI/ML", "Networking"], budget: "₹12Cr", sector: "Healthcare", partnersNeeded: 2, description: "Expanding telemedicine capabilities to rural clinics across India." },
];

export const applications: Application[] = [
  { id: "1", opportunityTitle: "Smart City Infrastructure Development", status: "shortlisted", appliedDate: "2026-03-10", sector: "IT & Infrastructure", budget: "₹4Cr - ₹16Cr" },
  { id: "2", opportunityTitle: "Agricultural Supply Chain Digitization", status: "pending", appliedDate: "2026-03-12", sector: "Agriculture & Tech", budget: "₹1.6Cr - ₹6.5Cr" },
  { id: "3", opportunityTitle: "E-Commerce Logistics Integration", status: "reviewed", appliedDate: "2026-03-08", sector: "Logistics", budget: "₹80L - ₹3.2Cr" },
  { id: "4", opportunityTitle: "Water Treatment Plant Modernization", status: "rejected", appliedDate: "2026-02-28", sector: "Infrastructure", budget: "₹8Cr - ₹24Cr" },
  { id: "5", opportunityTitle: "Mobile Banking Platform Development", status: "accepted", appliedDate: "2026-02-20", sector: "FinTech", budget: "₹2.4Cr - ₹7.2Cr" },
];

export const dashboardMetrics = {
  totalOpportunities: 1247,
  recommendedOpportunities: 38,
  applicationsSubmitted: 12,
  activeCollaborations: 4,
  supplyChainRequests: 89,
};

export const sectorData = [
  { name: "IT & Tech", opportunities: 342, growth: 23 },
  { name: "Construction", opportunities: 218, growth: 12 },
  { name: "Agriculture", opportunities: 195, growth: 18 },
  { name: "Energy", opportunities: 167, growth: 31 },
  { name: "Healthcare", opportunities: 143, growth: 15 },
  { name: "FinTech", opportunities: 112, growth: 28 },
  { name: "Logistics", opportunities: 70, growth: 9 },
];

export const trendData = [
  { month: "Oct", opportunities: 89, applications: 12, matches: 8 },
  { month: "Nov", opportunities: 112, applications: 18, matches: 14 },
  { month: "Dec", opportunities: 98, applications: 15, matches: 11 },
  { month: "Jan", opportunities: 134, applications: 22, matches: 17 },
  { month: "Feb", opportunities: 156, applications: 28, matches: 21 },
  { month: "Mar", opportunities: 178, applications: 31, matches: 26 },
];

export const fairnessData = {
  marketFairnessScore: 74,
  msmeParticipationRate: 62,
  topCompanyShare: 28,
  smallBusinessShare: 72,
  distributionData: [
    { name: "Large Corps", share: 28, count: 45 },
    { name: "Medium Enterprises", share: 35, count: 89 },
    { name: "Small Businesses", share: 25, count: 156 },
    { name: "Micro Enterprises", share: 12, count: 210 },
  ],
  monthlyFairness: [
    { month: "Oct", score: 68, participation: 55 },
    { month: "Nov", score: 70, participation: 58 },
    { month: "Dec", score: 71, participation: 59 },
    { month: "Jan", score: 72, participation: 60 },
    { month: "Feb", score: 73, participation: 61 },
    { month: "Mar", score: 74, participation: 62 },
  ],
};

export const userProfile = {
  companyName: "C-78 PVT LTD",
  industry: "IT & Infrastructure",
  employees: 125,
  location: "Mumbai, Maharashtra, India",
  capabilities: ["Enterprise Software Development", "Cloud Infrastructure", "IoT Solutions", "Data Analytics", "Mobile Applications", "Blockchain Integration", "AI/ML Solutions"],
  pastProjects: [
    { name: "Smart Traffic Management System - Mumbai", client: "Mumbai Municipal Corporation", year: 2025 },
    { name: "Agricultural Data Tracking Platform", client: "Ministry of Agriculture & Farmers Welfare", year: 2025 },
    { name: "Digital Payment Integration System", client: "Reserve Bank of India", year: 2024 },
    { name: "Healthcare Records Management Platform", client: "National Health Authority", year: 2024 },
    { name: "Supply Chain Digitization Project", client: "Indian Tea Board", year: 2023 },
  ],
  certifications: ["ISO 27001:2013", "CMMI Level 3", "AWS Partner Network", "Google Cloud Partner", "NASSCOM Certified"],
  bio: "Trusted technology partner for digital transformation, specializing in government and enterprise solutions. With 8+ years of experience, we deliver scalable, secure, and innovative technology solutions across infrastructure, agriculture, healthcare, and fintech sectors.",
};
