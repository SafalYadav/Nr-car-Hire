# NR Car Hire — Architecture

## 1. Architecture Goal

Build a production-grade full-stack application with clear separation of UI, business logic, data access, authentication, authorization and infrastructure.

## 2. Core Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Zod
- React Hook Form
- Framer Motion
- Lucide React
- Vitest
- Playwright
- Testing Library where appropriate
- AWS infrastructure

## 3. Conceptual Architecture

Browser
↓
Next.js Application
↓
Server/API Layer
↓
Service Layer
↓
Validation + Authorization
↓
Prisma
↓
PostgreSQL

External systems:

- Payment provider
- Email/notifications
- AWS services
- Monitoring

## 4. Responsibilities

### Frontend

Presentation, interaction, client-side state and UX.

### Server

Authentication, authorization, validation, business rules, pricing, availability, booking and payment verification.

### Database

Persistent source of truth.

### Admin

Protected operational interface.

## 5. Suggested Structure

```text
nrcarhire/
├── app/
├── components/
│   ├── ui/
│   └── shared/
├── features/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   ├── services/
│   └── utils/
├── server/
├── prisma/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── docs/
├── .env.example
├── PRD.md
├── architecture.md
├── README.md
├── phase.md
├── design.md
└── memory.md
```

The exact implementation may adapt this structure when justified by the actual framework.

## 6. Critical Rules

- Backend is authoritative for pricing.
- Backend is authoritative for availability.
- Backend is authoritative for authorization.
- Payment success is verified server-side.
- Webhooks are verified and idempotent.
- Never expose secrets to the client.
- Never rely on frontend checks for security.
- Prevent double bookings at the database/business-logic level.

## 7. Authentication

Support customer and admin roles.

Minimum roles:

- CUSTOMER
- ADMIN

Authorization must be enforced server-side.

## 8. Database

PostgreSQL is the intended production relational database and Prisma is the ORM.

Detailed schema should be finalized in a dedicated database design before extensive feature implementation.

## 9. Infrastructure

Production infrastructure should use AWS where appropriate, including:

- Route 53
- TLS/HTTPS
- S3
- CloudFront where useful
- Secrets Manager
- IAM
- CloudWatch
- Production database infrastructure

Do not claim external infrastructure is configured until verified.

## 10. Testing

Use:

- Vitest for unit/integration testing where appropriate
- Playwright for end-to-end testing
- Testing Library for UI behavior where appropriate
