# Dermalift - Aesthetic Clinic Management Platform

## Overview

Dermalift is a B2B SaaS platform for managing aesthetic clinics, offering tools for patient management, dynamic quote generation, procedure tracking, and business intelligence. Built with a full-stack TypeScript architecture (React frontend, Express backend), it's tailored for clinics following the "Dermalift Protocol," categorizing procedures into five pillars: sustentação, estruturação, embelezamento, revitalização, and alem_da_face (Além da Face). The platform aims to streamline clinic operations and enhance the patient consultation experience by focusing on procedure protocols before price revelation, ensuring a professional and value-driven presentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state.

**UI Framework & Design System:** Shadcn/ui (New York style), Radix UI primitives, Tailwind CSS with a custom design system. Features a custom color palette (Deep Purple, Rose Pink, Burnt Orange), Inter and Poppins typography, and a custom elevation system.

**Application Structure:** Page-based routing (Dashboard, Patients, Quote Builder, Procedures, Reports, Clinic Settings), sidebar navigation, theme provider for light/dark mode, and toast notifications.

**Patients Module:** CRM interface displaying patient cards with contact information, tags, and associated quotes. Each patient card shows a list of linked quotes with clickable buttons displaying creation date and total value. Clicking a quote button navigates directly to the presentation view (`/apresentacao/:quoteId`).

**Reports Module:** Real-time analytics dashboard displaying clinic performance metrics. Shows average ticket value, average discount percentage (calculated across ALL quotes including zero-discount ones), and top procedures by sales count and revenue. Data aggregated from quote_items table using SQL GROUP BY operations.

**Quote Builder - Dermalift Protocol:** Patient-centric interface with dialog-based patient selection. Displays five Dermalift pillars (Sustentação, Estruturação, Embelezamento, Revitalização, Além da Face) in a horizontal scrolling layout. Supports interactive procedure selection with unlimited quantity multipliers (no min/max limits) for all procedures, and a discount pricing system with visual indicators. The summary panel displays individual procedure subtotals, discount percentage input, installment calculator, bonus list management, and total investment value in real-time. Real-time calculation prioritizes custom prices over discounted prices, then mL/base prices. Observations/notes can be added per procedure. Discount percentage is applied to the subtotal to calculate the final total. Installment input divides the total by the number of installments and displays the per-installment value.

**Presentation Module:** Dynamic, fullscreen presentation accessible via `/apresentacao/:quoteId`, featuring 8 slides detailing the Dermalift methodology. Utilizes Embla Carousel for transitions. Includes a "Personalized Plan" slide displaying patient details, selected procedures with quantities, and total investment, incorporating discounts and per-procedure notes.

### Backend Architecture

**Technology Stack:** Express.js, TypeScript, Node.js, ESBuild.

**Data Layer:** Drizzle ORM, Supabase PostgreSQL database (via `pg` node-postgres driver with SSL). Features an abstract `IStorage` interface for CRUD operations.

**API Design:** RESTful endpoints (`/api` prefix), logging, error handling, session-based authentication with `express-session` (7-day httpOnly/secure cookies, `SESSION_SECRET`). Session storage uses memorystore in development and PostgreSQL (connect-pg-simple) in production.

**Authentication System:** Email/password authentication using Bcrypt for hashing. Endpoints for registration, login, user info (`/me`), and logout. Frontend forms use `react-hook-form` with Zod validation. Cache clearing with `queryClient.clear()` on login, registration, and logout ensures fresh data and prevents data leakage.

### Data Schema

**Core Entities:**
- **Users:** Authentication and access control (id, email, username, hashed password).
- **Procedures:** Service catalog (id, name, description, price, mlPrice, minMl, maxMl, protocol, category, displayOrder). Supports per-mL pricing and quantity constraints. The displayOrder field (integer, default 0) controls the display sequence in the Quote Builder's protocol lists—procedures are sorted by displayOrder ascending, then by name.
- **Patients:** CRM functionality (id, name, phone, email, cpf, birthDate, address, city, state, origin, tags).
- **Quotes:** Dermalift Protocol-based quotes (id, patientId, total, discount, discountPercentage, installments, bonusList, status, createdAt, notes). Supports percentage-based discounts, installment calculations, and bonus tracking.
- **QuoteItems:** Line items for quotes (id, quoteId, procedureId, quantity, customPrice, subtotal, note). Supports flexible custom pricing and per-item observations.

**Schema Validation:** Zod schemas derived from Drizzle tables for type-safe operations and shared client/server definitions. PostgreSQL enum enforcement.

## External Dependencies

**Database:**
- Supabase PostgreSQL (via `pg` node-postgres driver with SSL)

**Development Tools:**
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)

**Font Services:**
- Google Fonts CDN (Inter, Poppins)

**UI Component Libraries:**
- Radix UI
- cmdk
- react-day-picker
- vaul
- embla-carousel-react
- lucide-react

**State Management:**
- TanStack Query
- React Hook Form
- Hookform Resolvers

**Styling:**
- Tailwind CSS
- PostCSS
- class-variance-authority
- tailwind-merge (via clsx)

**Build & Development:**
- Vite
- TSX
- ESBuild

**Type Safety:**
- Shared TypeScript configuration
- Path aliases (`@/`, `@shared/`)