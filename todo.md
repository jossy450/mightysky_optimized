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
- [x] Test the full customer service workflow

## Phase 5: Frontend Integration
- [x] Update existing Vite frontend chatbot to call backend API
- [x] Add email collection form before chatbot interaction
- [x] Update chatbot UI to show loading states and responses
- [x] Test frontend-backend integration

## Phase 6: Testing & Deployment
- [x] End-to-end testing of the full workflow
- [x] Create checkpoint for deployment
- [x] Document deployment instructions for both frontend and backend
- [x] Provide user guide for managing the chatbot system

## Phase 7: Staff Dashboard
- [x] Create StaffDashboard page component with authentication
- [x] Implement pending requests table with customer email and question
- [x] Add answer form for each request
- [x] Integrate with existing tRPC endpoints for fetching and answering requests
- [x] Test the full dashboard workflow
- [x] Save checkpoint for deployment

## Phase 8: Role-Based Access Control (RBAC)
- [x] Add admin-only access check to StaffDashboard component
- [x] Display appropriate error message for non-admin users
- [x] Test RBAC with admin and regular user accounts
- [x] Save checkpoint for deployment

## Phase 9: Audit Log Implementation
- [x] Create tRPC endpoint to fetch answered requests with timestamps and staff info
- [x] Add activity history section to staff dashboard
- [x] Display staff performance metrics (requests answered per admin)
- [x] Test audit log display with multiple answered requests
- [x] Save checkpoint for deployment

## Phase 10: Real-time Notifications
- [x] Implement polling logic to check for new customer requests every 10 seconds
- [x] Add toast notifications when new requests are detected
- [x] Track previously seen request IDs to avoid duplicate notifications
- [x] Test real-time notification system
- [x] Save checkpoint for deployment

## Phase 11: Priority System for Customer Requests
- [x] Add priority field (high/medium/low) to customer_service_requests table
- [x] Push database schema changes
- [x] Implement keyword detection logic for automatic priority assignment
- [x] Update createCustomerServiceRequest to assign priority based on keywords
- [x] Sort pending requests by priority in the dashboard
- [x] Add visual priority badges (colored) to the UI
- [x] Test priority system with various keywords
- [x] Save checkpoint for deployment

## Phase 12: Analytics Dashboard
- [x] Create backend API endpoint for average response time by priority
- [x] Create backend API endpoint for staff performance metrics
- [x] Create backend API endpoint for request volume trends
- [x] Create backend API endpoint for priority distribution
- [x] Build Analytics page component with metric cards
- [x] Add response time charts using a charting library
- [x] Add staff performance table
- [x] Add navigation link to Analytics page in the app
- [x] Test analytics dashboard with real data
- [x] Save checkpoint for deployment

## Phase 13: Date Range Filtering for Analytics
- [x] Update backend API endpoints to accept optional startDate and endDate parameters
- [x] Modify database query helpers to filter by date range
- [x] Install date picker library (react-day-picker or similar)
- [x] Add date range picker UI component to Analytics page
- [x] Add preset date range buttons (Last 7 Days, Last 30 Days, etc.)
- [x] Implement state management for selected date range
- [x] Update all analytics queries to pass date range parameters
- [x] Test date filtering with various date ranges
- [x] Save checkpoint for deployment

## Phase 14: CSV Export for Analytics
- [x] Create CSV export utility function to format analytics data
- [x] Add Export Report button to Analytics page header
- [x] Implement CSV generation logic with date range in filename
- [x] Test CSV export with various data sets and date ranges
- [x] Save checkpoint for deployment

## Phase 15: Knowledge Base Management Page
- [x] Create backend API endpoints for listing all Q&A pairs
- [x] Create backend API endpoint for updating a Q&A pair
- [x] Create backend API endpoint for deleting a Q&A pair
- [x] Create backend API endpoint for creating a new Q&A pair
- [x] Create KnowledgeBase page component at /knowledge route
- [x] Implement searchable table with all Q&A pairs
- [x] Add edit functionality with inline editing or modal
- [x] Add delete functionality with confirmation dialog
- [x] Add create new Q&A pair form
- [x] Add admin-only access control
- [x] Test full CRUD workflow
- [x] Save checkpoint for deployment

## Phase 16: Deployment and Frontend Integration
- [x] Verify backend is ready for deployment
- [x] Create final backend checkpoint
- [x] Update frontend chatbot to use backend API
- [x] Configure environment variable for backend URL
- [x] Build final integrated frontend
- [x] Test full end-to-end chatbot workflow
- [x] Provide deployment instructions for both backend and frontend

## Phase 17: User Satisfaction Survey
- [x] Add satisfaction_surveys table to database schema
- [x] Push database schema changes
- [x] Create backend API endpoint for submitting survey responses
- [x] Create backend API endpoint for fetching survey analytics
- [x] Implement survey modal in frontend chatbot widget
- [x] Add survey analytics section to Analytics dashboard
- [x] Test survey submission and analytics display
- [x] Save checkpoint for deployment
## Phase 18: Customer Satisfaction Trend Chart
- [x] Create backend API endpoint for satisfaction trends over past 30 days
- [x] Install Recharts library for data visualization
- [x] Implement line chart component in Analytics dashboard
- [x] Add daily average rating calculation
- [x] Test trend chart with various data scenarios
- [x] Save checkpoint for deployment
## Phase 19: Satisfaction Trend Comparison
- [x] Enhance backend API to support multiple period queries
- [x] Create comparison calculation logic (this month vs last month, etc.)
- [x] Add period selector UI component with preset options
- [x] Implement dual-line chart showing both periods
- [x] Add comparison metrics (average change, percentage difference)
- [x] Test comparison with various time periods
- [x] Save checkpoint for deployment
