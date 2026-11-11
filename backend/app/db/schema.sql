-- ============================================================
-- UNIFY UI — Supabase Schema + Seed Data
-- Run this entire file in your Supabase SQL Editor once.
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists opportunities (
  id text primary key,
  title text not null,
  sector text,
  location text,
  budget_range text,
  deadline text,
  match_score integer default 0,
  type text,
  posted_by text,
  description text,
  saved boolean default false,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_title text not null,
  status text default 'pending',
  applied_date text,
  sector text,
  budget text,
  created_at timestamptz default now()
);

create table if not exists supply_chain_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  title text not null,
  sector text,
  quantity text,
  budget text,
  location text,
  deadline text,
  description text,
  created_at timestamptz default now()
);

create table if not exists collaborations (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  project_title text not null,
  required_skills text[] default '{}',
  budget text,
  sector text,
  partners_needed integer default 1,
  description text,
  created_at timestamptz default now()
);

create table if not exists government_contracts (
  id text primary key,
  title text not null,
  department text,
  location text,
  budget text,
  deadline text,
  sector text,
  verified boolean default false,
  description text,
  full_description text,
  apply_link text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists government_tenders (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  department text,
  location text,
  budget text,
  deadline text,
  sector text,
  verified boolean default false,
  description text,
  full_description text,
  apply_link text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists conversations (
  id text primary key,
  name text not null,
  company text,
  avatar text,
  unread_count integer default 0,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text references conversations(id) on delete cascade,
  text text not null,
  sender text not null,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id text primary key,
  title text not null,
  description text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists profile (
  id integer primary key,
  company_name text not null,
  industry text,
  employees integer default 0,
  location text,
  capabilities text[] default '{}',
  certifications text[] default '{}',
  bio text,
  past_projects jsonb default '[]',
  updated_at timestamptz default now()
);

-- ─── Add missing columns to existing tables (safe to re-run) ────

alter table government_contracts add column if not exists full_description text;
alter table government_contracts add column if not exists apply_link text;
alter table government_contracts add column if not exists status text default 'active';

-- ─── Row Level Security (allow anon access) ───────────────────

alter table opportunities enable row level security;
alter table applications enable row level security;
alter table supply_chain_requests enable row level security;
alter table collaborations enable row level security;
alter table government_contracts enable row level security;
alter table government_tenders enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table profile enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'opportunities' and policyname = 'allow_all') then
    create policy allow_all on opportunities for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'applications' and policyname = 'allow_all') then
    create policy allow_all on applications for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'supply_chain_requests' and policyname = 'allow_all') then
    create policy allow_all on supply_chain_requests for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'collaborations' and policyname = 'allow_all') then
    create policy allow_all on collaborations for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'government_contracts' and policyname = 'allow_all') then
    create policy allow_all on government_contracts for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'government_tenders' and policyname = 'allow_all') then
    create policy allow_all on government_tenders for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'conversations' and policyname = 'allow_all') then
    create policy allow_all on conversations for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'allow_all') then
    create policy allow_all on messages for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'allow_all') then
    create policy allow_all on notifications for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profile' and policyname = 'allow_all') then
    create policy allow_all on profile for all using (true) with check (true);
  end if;
end $$;

-- ─── Seed Data ────────────────────────────────────────────────

insert into opportunities (id, title, sector, location, budget_range, deadline, match_score, type, posted_by, description) values
  ('1',  'Smart City Infrastructure Development',       'IT & Infrastructure',  'Mumbai',    '₹4Cr - ₹16Cr',  '2026-04-15', 92, 'tender',        'Ministry of Innovation',            'Design and implement IoT-based smart city solutions including traffic management and waste monitoring.'),
  ('2',  'Agricultural Supply Chain Digitization',      'Agriculture & Tech',   'Pune',      '₹4Cr',           '2026-05-01', 87, 'contract',      'AgriTech Corp',                     'Build a digital supply chain platform connecting farmers to markets.'),
  ('3',  'Renewable Energy Component Supply',           'Energy',               'Ahmedabad', '₹2.8Cr',         '2026-04-20', 78, 'outsourcing',   'SolarPlus Ltd',                     'Supply solar panel components and installation services.'),
  ('4',  'Healthcare Data Analytics Platform',          'Healthcare & IT',      'Bengaluru', '₹2.4Cr - ₹8Cr', '2026-05-10', 85, 'tender',        'National Health Authority',          'Develop a comprehensive health data analytics and reporting platform.'),
  ('5',  'E-Commerce Logistics Integration',            'Logistics',            'Delhi NCR', '₹80L - ₹3.2Cr', '2026-04-25', 73, 'collaboration', 'TradeHub India',                     'Integrate logistics and delivery tracking for e-commerce platforms.'),
  ('6',  'Financial Inclusion Mobile Platform',         'FinTech',              'Hyderabad', '₹3.8Cr',         '2026-05-20', 90, 'contract',      'Digital India Finance',             'Build a mobile-first financial inclusion platform for underserved communities.'),
  ('7',  'National Road Safety Management System',      'Transportation & IT',  'New Delhi', '₹6Cr - ₹18Cr',  '2026-04-30', 88, 'tender',        'Ministry of Road Transport',        'Implement an integrated road safety management system.'),
  ('8',  'Water Treatment Facility Modernization',      'Water Management',     'Kolkata',   '₹1.4Cr - ₹5.2Cr','2026-05-05',82, 'tender',        'State Water Board',                 'Upgrade and modernize water treatment facilities.'),
  ('9',  'Renewable Energy Grid Integration',           'Energy & Infrastructure','Karnataka','₹8Cr - ₹22Cr', '2026-06-15', 84, 'tender',        'National Grid Authority',           'Design and deploy renewable energy management systems.'),
  ('10', 'Education Technology Platform Development',   'EdTech & IT',          'Bangalore', '₹2.2Cr - ₹6.8Cr','2026-05-25',86, 'tender',        'Ministry of Education',             'Build comprehensive e-learning platform with AI-powered personalized learning paths.'),
  ('11', 'Cybersecurity Infrastructure Enhancement',    'IT & Cybersecurity',   'Hyderabad', '₹3Cr - ₹9Cr',   '2026-04-20', 91, 'tender',        'National Cyber Security Agency',    'Deploy advanced cybersecurity infrastructure.'),
  ('12', 'Manufacturing Excellence Program - Automation','Manufacturing & IT',  'Gujarat',   '₹4.5Cr - ₹13Cr','2026-05-30', 79, 'tender',        'Ministry of Industry',              'Implement Industry 4.0 solutions.')
on conflict (id) do nothing;

insert into supply_chain_requests (id, company_name, title, sector, quantity, budget, location, deadline, description) values
  ('11111111-0000-0000-0000-000000000001', 'BuildTech Industries', 'Steel Beams & Structural Components', 'Construction', '500 metric tons',       '₹6Cr',   'Mumbai',    '2026-04-30', 'High-grade structural steel for commercial building projects.'),
  ('11111111-0000-0000-0000-000000000002', 'FreshFarm Co.',        'Cold Storage Equipment',              'Agriculture',  '25 units',              '₹1.6Cr', 'Pune',      '2026-05-15', 'Industrial cold storage units for perishable goods.'),
  ('11111111-0000-0000-0000-000000000003', 'TechVentures Ltd',     'Server Infrastructure Setup',         'Technology',   'Data center 200 racks', '₹9.6Cr', 'Bengaluru', '2026-06-01', 'Complete data center setup including servers, networking, and cooling.'),
  ('11111111-0000-0000-0000-000000000004', 'CleanEnergy Corp',     'Solar Panel Manufacturing Materials', 'Energy',       '10,000 panels worth',   '₹4Cr',   'Gujarat',   '2026-05-20', 'Raw materials for solar panel manufacturing including silicon wafers.')
on conflict (id) do nothing;

insert into collaborations (id, company_name, project_title, required_skills, budget, sector, partners_needed, description) values
  ('22222222-0000-0000-0000-000000000001', 'InnovateTech Solutions', 'Pan-India Digital ID System',       ARRAY['Blockchain','Mobile Dev','Security'],         '₹16Cr', 'GovTech',      3, 'Building a decentralized digital identity system for cross-state verification.'),
  ('22222222-0000-0000-0000-000000000002', 'GreenBuild Consortium',  'Sustainable Housing Initiative',    ARRAY['Architecture','Green Energy','Construction'], '₹40Cr', 'Construction', 5, 'Affordable and sustainable housing using local materials and renewable energy.'),
  ('22222222-0000-0000-0000-000000000003', 'HealthBridge AI',        'Telemedicine Network Expansion',    ARRAY['Healthcare IT','AI/ML','Networking'],         '₹12Cr', 'Healthcare',   2, 'Expanding telemedicine capabilities to rural clinics across India.')
on conflict (id) do nothing;

insert into government_contracts (id, title, department, location, budget, deadline, sector, verified, description, full_description, apply_link, status) values
  ('1', 'National Highway Smart Tolling System', 'Ministry of Road Transport & Highways', 'Pan India',          '₹8.5 Cr', '2026-05-15', 'IT & Infrastructure', true,  'Design, develop and deploy smart tolling systems across 200+ toll plazas on national highways.', 'This project involves designing and implementing a comprehensive smart tolling system across national highways. The system should include RFID/ANPR technology for toll collection, real-time traffic monitoring, and integrated payment gateways.', '', 'active'),
  ('2', 'Digital Health Records Platform',       'Ministry of Health & Family Welfare',   'New Delhi',          '₹3.2 Cr', '2026-04-30', 'Healthcare & IT',     true,  'Unified digital health records management system for government hospitals.', 'Development of a unified Electronic Health Records (EHR) system for integration across government hospitals. The platform should support patient data management, prescription tracking, and laboratory results.', '', 'active'),
  ('3', 'Agricultural Commodity Exchange Portal','Ministry of Agriculture',               'Multiple States',    '₹1.8 Cr', '2026-06-01', 'Agriculture & Tech',  true,  'Online portal for agricultural commodity trading and price discovery.', 'Creation of a digital agricultural commodity exchange platform connecting farmers directly to buyers with real-time price discovery, transparent bidding, and payment processing.', '', 'active'),
  ('4', 'Smart Water Management System',         'Jal Shakti Ministry',                   'Rajasthan',          '₹4.5 Cr', '2026-05-20', 'Infrastructure',      true,  'IoT-based water distribution and quality monitoring for rural areas.', 'Implementation of an IoT-based water management and distribution system for rural municipalities including smart meters, real-time water quality monitoring, and leak detection.', '', 'active'),
  ('5', 'Renewable Energy Grid Integration',     'Ministry of New & Renewable Energy',    'Gujarat & Tamil Nadu','₹12 Cr', '2026-07-01', 'Energy',              false, 'Integration of solar and wind energy sources into the national power grid.', 'Develop and deploy a comprehensive renewable energy management system for integrating distributed solar and wind energy sources into state power grids with SCADA systems and forecasting algorithms.', '', 'active')
on conflict (id) do update set
  full_description = excluded.full_description,
  apply_link = excluded.apply_link,
  status = excluded.status;

insert into government_tenders (id, title, department, location, budget, deadline, sector, verified, description, full_description, apply_link, status) values
  ('t1', 'Smart City Infrastructure Development', 'Ministry of Innovation', 'Mumbai', '₹4Cr - ₹16Cr', '2026-04-15', 'IT & Infrastructure', true, 'Design and implement IoT-based smart city solutions including traffic management and waste monitoring.', 'Comprehensive smart city infrastructure development including IoT sensors, data centers, and analytics platforms for traffic management, waste monitoring, and citizen services over 3 years.', '', 'active'),
  ('t2', 'Healthcare Data Analytics Platform', 'National Health Authority', 'Bengaluru', '₹2.4Cr - ₹8Cr', '2026-05-10', 'Healthcare & IT', true, 'Develop a comprehensive health data analytics and reporting platform.', 'Advanced health data analytics platform integrating data from hospitals, clinics, and public health agencies with real-time dashboards and predictive analytics for disease outbreaks.', '', 'active'),
  ('t3', 'National Road Safety Management System', 'Ministry of Road Transport', 'New Delhi', '₹6Cr - ₹18Cr', '2026-04-30', 'Transportation & IT', false, 'Implement an integrated road safety management system.', 'End-to-end road safety management system integrating CCTV, speed cameras, crash reporting, emergency response, and analytics integrated with existing transport infrastructure.', '', 'active')
on conflict (id) do nothing;

insert into conversations (id, name, company, avatar, unread_count, last_message, last_message_at) values
  ('1', 'eshheet raka',   'BuildTech Industries', 'ER', 2, 'Can we discuss the supply chain proposal?', now() - interval '2 minutes'),
  ('2', 'gandharva ugale','AgriTech Corp',         'GU', 0, 'The collaboration agreement looks good!',  now() - interval '1 hour'),
  ('3', 'farhaan khan',   'SolarPlus Ltd',         'FK', 1, 'When can we schedule a call?',             now() - interval '3 hours')
on conflict (id) do nothing;

insert into messages (conversation_id, text, sender, created_at) values
  ('1', 'Hi! We saw your profile on UNIFY and were impressed by your capabilities.',                          'them', now() - interval '40 minutes'),
  ('1', 'Thank you, eshheet! We''d love to collaborate. What''s the project scope?',                          'me',   now() - interval '38 minutes'),
  ('1', 'We need IT infrastructure support for our new construction project. Budget is around ₹50L.',         'them', now() - interval '35 minutes'),
  ('1', 'Can we discuss the supply chain proposal?',                                                           'them', now() - interval '2 minutes'),
  ('2', 'Hi, I wanted to follow up on the agricultural digitization project.',                                 'me',   now() - interval '3 hours'),
  ('2', 'Sure! We''ve reviewed your proposal and it looks promising.',                                         'them', now() - interval '2 hours 45 minutes'),
  ('2', 'The collaboration agreement looks good!',                                                             'them', now() - interval '2 hours 40 minutes'),
  ('3', 'We''re interested in your IoT solutions for our solar farms.',                                        'them', now() - interval '1 day'),
  ('3', 'That sounds great! We have extensive experience in that area.',                                       'me',   now() - interval '23 hours'),
  ('3', 'When can we schedule a call?',                                                                        'them', now() - interval '3 hours');

insert into notifications (id, title, description, link, read, created_at) values
  ('1', 'Application shortlisted',   'Your application for Smart City Infrastructure has been shortlisted.', '/applications',      false, now() - interval '2 hours'),
  ('2', 'New supply chain request',  'BuildTech Industries posted a new procurement requirement.',            '/supply-chain',      false, now() - interval '5 hours'),
  ('3', 'AI Match Found',            'A new 90% match opportunity in FinTech sector is available.',           '/ai-recommendations',true,  now() - interval '1 day'),
  ('4', 'Collaboration invite',      'InnovateTech Solutions invited you to join a consortium.',              '/collaborations',    true,  now() - interval '2 days')
on conflict (id) do nothing;

insert into profile (id, company_name, industry, employees, location, capabilities, certifications, bio, past_projects) values (
  1,
  'C-78 PVT LTD',
  'IT & Infrastructure',
  125,
  'Mumbai, Maharashtra, India',
  ARRAY['Enterprise Software Development','Cloud Infrastructure','IoT Solutions','Data Analytics','Mobile Applications','Blockchain Integration','AI/ML Solutions'],
  ARRAY['ISO 27001:2013','CMMI Level 3','AWS Partner Network','Google Cloud Partner','NASSCOM Certified'],
  'Trusted technology partner for digital transformation, specializing in government and enterprise solutions. With 8+ years of experience, we deliver scalable, secure, and innovative technology solutions across infrastructure, agriculture, healthcare, and fintech sectors.',
  '[
    {"name":"Smart Traffic Management System - Mumbai","client":"Mumbai Municipal Corporation","year":2025},
    {"name":"Agricultural Data Tracking Platform","client":"Ministry of Agriculture & Farmers Welfare","year":2025},
    {"name":"Digital Payment Integration System","client":"Reserve Bank of India","year":2024},
    {"name":"Healthcare Records Management Platform","client":"National Health Authority","year":2024},
    {"name":"Supply Chain Digitization Project","client":"Indian Tea Board","year":2023}
  ]'::jsonb
) on conflict (id) do update set
  company_name   = excluded.company_name,
  industry       = excluded.industry,
  employees      = excluded.employees,
  location       = excluded.location,
  capabilities   = excluded.capabilities,
  certifications = excluded.certifications,
  bio            = excluded.bio,
  past_projects  = excluded.past_projects;
