# Product Requirement Document (PRD) - UNIFY

## 1. Executive Summary
UNIFY is an AI-powered B2B procurement intelligence and fair-access platform designed for MSMEs, private suppliers, domain advisors, and enterprise buyers. It replaces legacy keyword-based procurement searches with semantic vector matching, algorithmic fairness rebalancing (VRA), and multi-agent workflow orchestration.

## 2. Core Functional Modules
1. **User Onboarding & Digital Maturity**: GST/Udyam verification, capability portfolio parsing, dense vector generation.
2. **Hybrid Search & Discovery Engine**: BM25 keyword matching + 768-dim Sentence-BERT dense vector similarity via Pinecone.
3. **Algorithmic Fairness Engine**:
   - Capability-Opportunity Matching Score (COMS): COMS(C,R) = (C · R) / (||C|| ||R||)
   - Visibility Rebalancing Algorithm (VRA): VRA_Score = α · COMS + β · Discovery_Weight
   - Opportunity Concentration Index (OCI): Evaluates monopoly patterns across sectors.
4. **B2B Consortium & Collaboration Marketplace**: Matching MSMEs with complementary technical capabilities for joint venture bidding.
5. **Post-Award Milestone Management & Platform Mediation**: Real-time contract verification, SLA monitoring, and AI dispute logging.
6. **SaaS Subscriptions**: Tiered access (Basic ₹999/mo, Intermediate ₹2,999/mo, Expert ₹7,999/mo) with route-level entitlement enforcement.