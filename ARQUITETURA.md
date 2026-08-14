# Dermalift — Arquitetura do Sistema

> Documentação técnica da plataforma. Para rodar localmente veja o [README](./README.md); para publicar, o [DEPLOY-VERCEL](./DEPLOY-VERCEL.md).

## Overview

Dermalift is a B2B SaaS platform for managing aesthetic clinics, offering tools for patient management, dynamic quote generation, procedure tracking, and business intelligence. Built with a full-stack TypeScript architecture (React frontend, Express backend), it's tailored for clinics following the "Dermalift Protocol," categorizing procedures into five pillars: sustentação, estruturação, embelezamento, revitalização, and alem_da_face (Além da Face). The platform aims to streamline clinic operations and enhance the patient consultation experience by focusing on procedure protocols before price revelation, ensuring a professional and value-driven presentation.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state.

**UI Framework & Design System:** Shadcn/ui (New York style), Radix UI primitives, Tailwind CSS with a custom design system. Features a custom color palette (Deep Purple, Rose Pink, Burnt Orange), Inter and Poppins typography, and a custom elevation system.

**Application Structure:** Page-based routing (Dashboard, Patients, Quote Builder, Procedures, Reports, Clinic Settings), sidebar navigation, theme provider for light/dark mode, and toast notifications.

**Patients Module:** CRM interface displaying patient cards with contact information, tags, and associated quotes. Each patient card shows a list of linked quotes with clickable buttons displaying creation date and total value. Clicking a quote button navigates directly to the presentation view (`/apresentacao/:quoteId`). Patient forms include a complaints/observations textarea for documenting patient concerns. Photo management is available when editing existing patients, allowing upload of images with captions (stored in Supabase Storage), displayed in a 2-column grid with delete functionality on hover.

**Reports Module:** Real-time analytics dashboard displaying clinic performance metrics. Shows average ticket value, average discount percentage (calculated across ALL quotes including zero-discount ones), and top procedures by sales count and revenue. Data aggregated from quote_items table using SQL GROUP BY operations.

**Quote Builder - Dermalift Protocol:** Patient-centric interface with dialog-based patient selection. Displays five Dermalift pillars (Sustentação, Estruturação, Embelezamento, Revitalização, Além da Face) in a horizontal scrolling layout. Supports interactive procedure selection with unlimited quantity multipliers (no min/max limits) for all procedures, and a discount pricing system with visual indicators. The summary panel displays individual procedure subtotals with editable custom prices (click edit icon to modify without affecting catalog prices), discount percentage input, down payment (entrada) input with automatic validation to not exceed total, installment calculator, bonus list management, and total investment breakdown in real-time. Real-time calculation: subtotal → discount → total → down payment → remaining balance (saldo a pagar) → installments. Custom prices are prioritized over discounted prices, then mL/base prices. Observations/notes can be added per procedure. Down payment is automatically clamped to the total value and adjusts when procedures or discounts change.

**Presentation Module:** Dynamic, fullscreen presentation accessible via `/apresentacao/:quoteId`, featuring 8 slides detailing the Dermalift methodology. Utilizes Embla Carousel for transitions. Includes a "Personalized Plan" slide displaying patient details, selected procedures with quantities, and total investment, incorporating discounts and per-procedure notes.

**Receituário Module:** Skincare prescription builder at `/receituario`. Displays 4 time-of-day blocks (Tratamentos Diurnos, Tratamentos da Tarde, Tratamentos Noturnos, Tratamentos Especiais/Corporais). Allows inline creation of skincare products per block (name, usage instructions, optional image upload via Object Storage). Products are click-to-toggle selectable; selected items are highlighted. Optional patient name input. Print button uses `window.print()` with a hidden print-layout div. PDF generation via jsPDF with product images as base64, product cards with step numbers, and block headers. Products stored in `skincare_products` table using `skincare_time_of_day` enum.

### Backend Architecture

**Technology Stack:** Express.js, TypeScript, Node.js, ESBuild.

**Data Layer:** Drizzle ORM, Supabase PostgreSQL database (via `pg` node-postgres driver with SSL). Features an abstract `IStorage` interface for CRUD operations.

**API Design:** RESTful endpoints (`/api` prefix), logging, error handling, session-based authentication with `express-session` (7-day httpOnly/secure cookies, `SESSION_SECRET`). Session storage uses memorystore in development and PostgreSQL (connect-pg-simple) in production ou em qualquer ambiente serverless.

**Authentication System:** Email/password authentication using `bcryptjs` for hashing (compatível com os hashes `$2b$` já existentes). Endpoints for registration, login, user info (`/me`), logout, and password change (`/api/auth/change-password`). Password change endpoint validates current password before updating to new hashed password. Frontend forms use `react-hook-form` with Zod validation. Cache clearing with `queryClient.clear()` on login, registration, and logout ensures fresh data and prevents data leakage.

**Clinic Settings Module:** Comprehensive settings page (`/settings`) with clinic information management (name, CNPJ, address, contact info), business goals configuration (monthly revenue target, conversion rate goal, new patient goal), and user account security. Features dedicated password change form with current password validation and confirmation requirements.

### Data Schema

**Core Entities:**
- **Users:** Authentication and access control (id, email, username, hashed password).
- **Procedures:** Service catalog (id, name, description, price, mlPrice, minMl, maxMl, protocol, category, displayOrder). Supports per-mL pricing and quantity constraints. The displayOrder field (integer, default 0) controls the display sequence in the Quote Builder's protocol lists—procedures are sorted by displayOrder ascending, then by name.
- **Patients:** CRM functionality (id, name, phone, email, cpf, birthDate, address, city, state, origin, tags, complaints, createdAt). The complaints field stores patient observations and concerns as multi-line text.
- **PatientPhotos:** Photo management for patients (id, patientId, photoUrl, caption, uploadedAt). Photos are stored in Supabase Storage under `private/patient-photos/{patientId}/` with optional captions. Supports upload (max 10MB, image files only), listing, and deletion.
- **Quotes:** Dermalift Protocol-based quotes (id, patientId, total, discount, discountPercentage, installments, downPayment, bonusList, status, createdAt, notes). Supports percentage-based discounts, down payment tracking, installment calculations (based on remaining balance after down payment), and bonus tracking.
- **QuoteItems:** Line items for quotes (id, quoteId, procedureId, quantity, customPrice, subtotal, note). Supports flexible custom pricing and per-item observations.

**Schema Validation:** Zod schemas derived from Drizzle tables for type-safe operations and shared client/server definitions. PostgreSQL enum enforcement.

## External Dependencies

**Database:**
- Supabase PostgreSQL (via `pg` node-postgres driver with SSL)

**Object Storage:**
- Supabase Storage (bucket privado) para fotos de pacientes e imagens de produtos
- Provider abstraído em `server/objectStorage.ts`; em desenvolvimento, sem as chaves do Supabase, grava em disco local (`.local-storage/`)
- Prefixos: `private/patient-photos/`, `private/product-images/`

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

## Deploy

O app roda em dois formatos a partir do mesmo `server/app.ts`:

- **Local / servidor Node:** `server/index.ts` abre a porta e liga o Vite (dev) ou os estáticos (prod).
- **Vercel:** `api/index.ts` expõe o mesmo app como função serverless; o frontend é servido como estático a partir de `dist/public`. O roteamento está em `vercel.json`.

Detalhes e variáveis de ambiente em [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md).
