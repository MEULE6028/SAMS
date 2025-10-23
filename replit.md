# SAMS - Student Affair Management System

## Project Overview
The Student Affair Management System (SAMS) is a comprehensive institutional management platform built for the University of Eastern Africa, Baraton (UEAB). It integrates three core subsystems into one unified ecosystem:

1. **Chapa360** - Digital finance and payment management
2. **SWSMS** - Student work study management system
3. **SGMS** - Student governance management system

## Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query for state management
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with role-based access control
- **Styling**: Tailwind CSS with custom UEAB branding (Blue #0033A0, Gold #FFD100)

## Key Features

### Authentication & Authorization
- JWT token-based authentication with server-side revocation
- In-memory token blacklist for session invalidation
- Role-based access control (student, admin, supervisor, treasurer, vc)
- Protected routes with role-specific permissions
- Session management with logout functionality
- Self-registration always creates 'student' role (privilege escalation prevented)
- Admin/supervisor/treasurer/vc accounts must be created manually in database

### Chapa360 Finance Module
- Virtual account management with unique account numbers
- Transaction ledger with credits and debits
- Balance tracking and financial analytics
- Admin oversight of all student accounts

### SWSMS Work Study Module
- Student application submission
- Admin vetting dashboard for application approval/rejection
- Digital timecard system with QR code simulation
- Supervisor verification of work hours
- Payment tracking

### SGMS Governance Module
- Student election management
- Candidate nomination and approval
- Voting system with vote tracking
- Leadership handover documentation
- Document management for transitions

### Analytics Dashboard
- Financial trends visualization
- Work study hours tracking
- Election participation metrics
- Recharts-based data visualizations

## Tech Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, Shadcn UI, Tailwind CSS
- **Backend**: Express.js, Drizzle ORM, JWT, Bcrypt
- **Database**: PostgreSQL (Neon)
- **Development**: Vite, TSX, Drizzle Kit
- **UI Components**: Radix UI primitives, Lucide React icons

## Project Structure
```
/client              - Frontend React application
  /src
    /components      - Reusable UI components
    /pages           - Page components for each route
      /chapa360      - Finance module pages
      /swsms         - Work study module pages
      /sgms          - Governance module pages
      /admin         - Admin-only pages
    /lib             - Utilities and configurations
/server              - Backend Express application
  /routes.ts         - API route definitions
  /auth.ts           - Authentication middleware
  /db.ts             - Database configuration
  /seed.ts           - Database seeding script
/shared              - Shared types and schemas
  /schema.ts         - Drizzle database schema
```

## Database Schema

### Core Tables
- **users** - User accounts with roles
- **accounts** - Student financial accounts
- **transactions** - Financial transaction history
- **workApplications** - Work study applications
- **timecards** - Work hour logging
- **payments** - Work study payments
- **elections** - Student elections
- **candidates** - Election candidates
- **votes** - Election votes
- **handovers** - Leadership transition documents

## API Endpoints

### Authentication
- POST `/api/auth/register` - Create new user account
- POST `/api/auth/login` - Authenticate and receive JWT token
- POST `/api/auth/logout` - Logout (invalidate session)
- GET `/api/auth/session` - Validate current session

### Chapa360
- GET `/api/chapa360/account` - Get user's account details
- GET `/api/chapa360/transactions` - Get transaction history
- GET `/api/admin/chapa360/accounts` - Admin: All accounts (admin, treasurer only)

### SWSMS
- GET `/api/swsms/applications` - Get user's applications
- POST `/api/swsms/applications` - Submit new application
- GET `/api/swsms/timecards` - Get user's timecards
- POST `/api/swsms/timecards` - Log work hours
- GET `/api/admin/swsms/applications` - Admin: All applications
- PATCH `/api/swsms/applications/:id/review` - Admin: Review application
- GET `/api/admin/swsms/timecards` - Admin: All timecards
- PATCH `/api/swsms/timecards/:id/verify` - Admin: Verify timecard

### SGMS
- GET `/api/sgms/elections` - Get all elections
- POST `/api/sgms/vote` - Cast a vote
- GET `/api/sgms/handovers` - Get handover documents
- POST `/api/sgms/handovers` - Create handover
- PATCH `/api/sgms/handovers/:id/complete` - Mark handover complete
- GET `/api/admin/sgms/elections` - Admin: Manage elections
- POST `/api/sgms/elections` - Admin: Create election

### Analytics
- GET `/api/analytics/overview` - Dashboard overview stats
- GET `/api/analytics/financial` - Financial trends data
- GET `/api/analytics/work-study` - Work study metrics
- GET `/api/analytics/governance` - Governance participation data

## User Roles

### Student
- View own account balance and transactions
- Submit work study applications
- Log work hours via timecards
- Vote in elections
- Create handover documents

### Admin
- All student capabilities
- Approve/reject work study applications
- Verify timecards
- View all student accounts
- Manage elections

### Supervisor
- Similar to admin for work study oversight
- Verify timecards for assigned departments

### Treasurer
- Financial oversight
- View all accounts and transactions

### VC (Vice Chancellor)
- Election management
- Governance oversight

## Development

### Running the Application
```bash
npm run dev
```
This starts both the Express backend (port 5000) and Vite frontend.

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Seed database with test data
npx tsx server/seed.ts
```

### Test Credentials
- **Student**: student@ueab.ac.ke / password123
- **Admin**: admin@ueab.ac.ke / password123
- **Supervisor**: supervisor@ueab.ac.ke / password123

## Design Guidelines
The application follows institutional design principles with:
- UEAB brand colors (Blue #0033A0, Gold #FFD100)
- Professional, data-dense layouts
- Responsive design for all screen sizes
- Dark/light mode support
- Accessibility compliance (WCAG 2.1 AA)

See `design_guidelines.md` for complete design specifications.

## Future Enhancements
- QuickBooks API integration for live financial synchronization
- M-Pesa payment gateway integration
- University ERP integration for student data
- Real-time notifications (email/SMS)
- Advanced reporting and data export
- Audit trail and compliance features
- Document upload and management
- Multi-factor authentication

## Notes
- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Database uses PostgreSQL with Drizzle ORM
- Frontend uses Zustand for auth state persistence
- API requests include Bearer token authentication
- Role-based middleware protects admin endpoints
