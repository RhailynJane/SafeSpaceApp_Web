# SafeSpace Web Application

SafeSpace is a comprehensive web-based platform designed for mental health and community support organizations to manage client care, staff workflows, and organizational operations. Built with Next.js and Convex, it provides real-time data synchronization and a modern, accessible user interface.

## Overview

SafeSpace enables mental health professionals, support workers, team leaders, and administrators to:

- **Manage Client Care**: Track client information, session notes, risk assessments, and care plans
- **Schedule Appointments**: Coordinate sessions with calendar integration and availability management
- **Process Referrals**: Handle incoming client referrals with workflow tracking and assignment
- **Document Sessions**: Create detailed session notes with activity tracking and risk assessments
- **Generate Reports**: Analyze caseloads, session metrics, and organizational performance
- **Collaborate**: Real-time chat and notifications for team coordination
- **Monitor Crisis Events**: Track and respond to urgent client situations

## User Roles

The platform supports multiple user roles with tailored permissions:

- **Support Workers**: Manage assigned clients, create session notes, schedule appointments
- **Team Leaders**: Process referrals, assign clients, oversee team caseloads
- **Administrators**: Full organizational management, user administration, system configuration
- **Super Administrators**: Multi-organization oversight and platform-wide administration

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Clerk (user management and SSO)
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Real-time Communication**: SendBird (chat and video calls)
- **Charts & Reporting**: Chart.js
- **Document Generation**: jsPDF, docx

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Convex account ([convex.dev](https://convex.dev))
- Clerk account ([clerk.com](https://clerk.com))
- SendBird account (optional, for chat features)

### Environment Setup

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/workspace

# Convex
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# SendBird (Optional)
NEXT_PUBLIC_SENDBIRD_APP_ID=your_sendbird_app_id
SENDBIRD_API_TOKEN=your_sendbird_api_token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run Convex database setup
npx convex dev

# In a separate terminal, start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Project Structure

```
app/
  ├── workspace/          # Main staff dashboard and workflows
  ├── admin/             # Organization administration
  ├── superadmin/        # Platform-wide administration
  ├── api/               # Backend API routes
  └── ...

convex/
  ├── appointments.ts    # Appointment management
  ├── clients.ts         # Client data management
  ├── notes.ts           # Session notes
  ├── referrals.ts       # Referral processing
  ├── users.ts           # User management
  └── ...

components/
  ├── Notes/             # Session note components
  ├── schedule/          # Appointment scheduling
  ├── clients/           # Client management
  ├── reports/           # Reporting and analytics
  └── ...
```

## Key Features

### Client Management
- Comprehensive client profiles with demographic and clinical information
- Risk level tracking and assessment history
- Assignment to support workers with automated load balancing
- Status tracking (active, inactive, on-hold)

### Session Notes
- Structured session documentation with required fields
- Activity tracking with time allocation
- Risk assessment integration
- Multi-author support for team collaboration
- Export to PDF and Word formats

### Appointment Scheduling
- Visual calendar with day/week/month views
- Availability management for staff
- Conflict detection and validation
- Integration with client records
- Automated notifications

### Referral Management
- Intake form processing
- Team leader review and assignment workflow
- Status tracking (pending, in-review, accepted, declined)
- Communication with referral sources
- Automated routing based on organizational rules

### Reporting & Analytics
- Caseload summaries by worker and team
- Session activity metrics
- Risk distribution analysis
- Custom date range reporting
- Export capabilities (PDF, Excel, Word)

### Security & Compliance
- Role-based access control (RBAC)
- Audit logging for all actions
- Encrypted data transmission
- Session timeout and security policies
- HIPAA-aligned data handling practices

## Development

### Running Tests

```bash
# Run Convex function tests
npx convex test

# Run component tests
npm test
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Database Management

```bash
# Clear Convex development data
npx convex data clear

# Seed database with sample data
npx convex run seed:default
```

## Deployment

### Convex Production Deployment

```bash
# Deploy Convex backend
npx convex deploy

# Update environment variables with production URLs
```

### Vercel Deployment

The application is optimized for deployment on [Vercel](https://vercel.com):

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

For other platforms, build the production bundle:

```bash
npm run build
npm start
```

## Support & Documentation

- **Convex Documentation**: [docs.convex.dev](https://docs.convex.dev)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Clerk Authentication**: [clerk.com/docs](https://clerk.com/docs)
- **Component Library**: [ui.shadcn.com](https://ui.shadcn.com)

## Contributing

This is a private organizational tool. For internal development guidelines, see the project wiki.

## License

Proprietary - All rights reserved by the SafeSpace organization.
