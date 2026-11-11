# Relational Schema & Vector Store Specification

## 1. PostgreSQL Schema (DDL Blueprint)

```sql
-- Users & Roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('MSME', 'VENDOR', 'CONSULTANT', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MSME Profile & Capabilities
CREATE TABLE msme_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    udyam_registration VARCHAR(100) UNIQUE,
    digital_maturity_score INT DEFAULT 0,
    fairness_score FLOAT DEFAULT 1.0,
    capabilities JSONB NOT NULL,
    certifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities (Tenders / RFQs)
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    organization VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('GOV_TENDER', 'GOV_CONTRACT', 'PRIVATE_SUPPLY_CHAIN', 'COLLABORATION')),
    sector VARCHAR(100) NOT NULL,
    budget_min NUMERIC,
    budget_max NUMERIC,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contracts & Milestones
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id),
    msme_id UUID REFERENCES msme_profiles(id),
    status VARCHAR(50) CHECK (status IN ('UNDER_REVIEW', 'VERIFIED', 'ESCROW_PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED')),
    agreed_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    payout_percentage INT CHECK (payout_percentage BETWEEN 1 AND 100),
    is_completed BOOLEAN DEFAULT FALSE,
    is_released BOOLEAN DEFAULT FALSE,
    due_date DATE NOT NULL
);