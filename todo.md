# Mighty Sky Advanced Chatbot System - TODO

## Phase 1: Database Schema Design
- [x] Design Knowledge Base table (questions, answers, timestamps)
- [x] Design Customer Service Requests table (user email, question, status, assigned staff, timestamps)
- [x] Implement database schema in drizzle/schema.ts
- [x] Push database migrations

## Phase 2: API Research & Selection
- [x] Research WhatsApp Business API or alternative services for group notifications
- [x] Research Email Service Provider (e.g., SendGrid, Resend, Nodemailer)
- [x] Document selected APIs and integration approach

## Phase 3: Backend API Implementation
- [x] Implement tRPC procedure for chatbot query (search knowledge base)
- [x] Implement tRPC procedure for learning new Q&A pairs
- [x] Implement tRPC procedure for creating customer service requests
- [x] Implement database query helpers in server/db.ts

## Phase 4: WhatsApp & Email Integration
- [x] Implement WhatsApp group notification when chatbot cannot answer
- [x] Implement logic to mark request as "done" when staff responds
- [x] Implement email response to customer when answer is available
- [ ] Test the full customer service workflow

## Phase 5: Frontend Integration
- [x] Update existing Vite frontend chatbot to call backend API
- [x] Add email collection form before chatbot interaction
- [x] Update chatbot UI to show loading states and responses
- [ ] Test frontend-backend integration

## Phase 6: Testing & Deployment
- [ ] End-to-end testing of the full workflow
- [ ] Create checkpoint for deployment
- [ ] Document deployment instructions for both frontend and backend
- [ ] Provide user guide for managing the chatbot system
