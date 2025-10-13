# Dermalift - Aesthetic Clinic Management Platform

## Recent Changes

### October 13, 2025
- **Added procedure-level observations/notes**: Users can now add custom text observations to each procedure in the quote summary (e.g., "região malar direita", "aplicação na testa"). Notes display with a MessageSquare icon and can be edited inline. Notes are fully persisted to the database and restored when loading saved quotes. This allows clinics to specify detailed application areas or special instructions for each procedure.
- **Added quantity multiplier to all procedures**: All procedures now have a quantity multiplier with +/- controls, not just those with mlPrice. Users can select multiple units of any procedure (e.g., "2x Lifting com Fios"). The summary displays the quantity breakdown for all procedures, and the total reflects the multiplied values. Regular procedures allow 1-99 units, while mlPrice procedures use their configured min/max constraints.
- **Reorganized QuoteBuilder layout**: Changed from 2x2 grid layout to a single horizontal row with scroll. All 4 protocol cards (Sustentação, Estruturação, Embelezamento, Revitalização) and the summary card (Resumo do Protocolo) now appear in one horizontal line. Users can scroll horizontally to see all cards, with the summary appearing at the end. Each card has a fixed width of 380px.

### October 7, 2025
- **Fixed procedure form validation**: Updated procedure form to only require name, protocol, and price fields. Optional numeric fields (mlPrice, minMl, maxMl) can now be left empty without validation errors. Created custom Zod schema helper that properly handles empty values while still validating positive numbers when values are provided.
- **Fixed form reset on dialog close**: Procedure form now properly resets all fields to empty values when the dialog is closed. This ensures that after editing a procedure, opening the dialog to add a new one shows completely blank fields.
- **Replaced mock patient data with real API query**: QuoteBuilder (/protocolo-dermalift) now fetches real patients from the database via /api/patients instead of using hardcoded mock data. Patient selection dialog displays actual patient records with proper type safety using the Patient schema.
- **Fixed QuoteBuilder to use database procedures**: The Protocolo Dermalift page (/protocolo-dermalift) now fetches procedures from the database API instead of using hardcoded data. This allows clinic administrators to manage procedures through the /procedures page, and those changes will automatically reflect in the QuoteBuilder. The component properly handles decimal-to-string conversion for price fields (price, mlPrice, minMl, maxMl) as returned by Drizzle ORM.
- **Fixed registration bug**: Corrected user registration flow to properly save the user's name field to the database. The backend route was validating the name but not passing it to the createUser function, causing a database constraint violation (500 error).
- **Reorganized saved quotes**: Moved the saved quotes listing from /protocolo-dermalift to a dedicated page at /apresentacao. The QuoteBuilder (Protocolo Dermalift) page now focuses only on creating/editing quotes, while /apresentacao displays all saved quotes with options to view presentations, edit, or delete.
- **Added personalized dashboard greeting**: Dashboard now displays a time-based greeting (Bom dia/Boa tarde/Boa noite) with the user's name.

## Overview

Dermalift is a B2B SaaS platform designed for managing aesthetic clinics. The application provides comprehensive tools for patient management (CRM), dynamic quote generation, procedure tracking, and business intelligence reporting. Built as a full-stack TypeScript application, it uses a modern React frontend with Express backend architecture.

The platform is specifically tailored for aesthetic clinics following the "Dermalift Protocol" methodology, which categorizes procedures into four main protocols: sustentação (support), estruturação (structuring), embelezamento (beautification), and revitalizacao (revitalization).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management

**UI Framework:**
- Shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible components
- Tailwind CSS for styling with custom design system
- Material Design principles adapted for B2B SaaS

**Design System:**
- Custom color palette with light/dark mode support
- Primary: Deep Purple (275 100% 26%)
- Secondary: Rose Pink (340 74% 62%)
- Accent: Burnt Orange (17 100% 61%)
- Typography: Inter for body text, Poppins for headings
- Custom elevation system using CSS variables for hover/active states

**Application Structure:**
- Page-based routing with main sections: Dashboard, Patients, Quote Builder (Protocolo Dermalift), Procedures, Reports, Clinic Settings
- Sidebar navigation with collapsible mobile support
- Theme provider for light/dark mode switching
- Toast notifications for user feedback

**Quote Builder - Dermalift Protocol:**
- Patient-centric interface with Dialog-based patient selection
- 2x2 grid layout showcasing the 4 Dermalift pillars:
  1. Sustentação (Support) - Purple themed
  2. Estruturação (Structuring) - Pink themed
  3. Embelezamento (Beautification) - Orange themed
  4. Revitalização da Pele (Skin Revitalization) - Green/Blue themed
- Interactive procedure selection with visual feedback
- **Quantity-based pricing (mL/syringes)**: Procedures can have mlPrice with min/max limits, +/- controls for adjusting quantities
- **Custom price editing**: Inline price editing per item with visual indicators for modified prices
- Real-time subtotal and total calculation with priority: customPrice > mlPrice × quantity > basePrice
- Clean, professional design for in-clinic patient presentations

**Presentation Module:**
- Dynamic presentation route: `/apresentacao/:quoteId` loads saved quote data
- Fullscreen presentation mode with 8 slides introducing Dermalift methodology
- Embla Carousel for smooth slide transitions
- Navigation via keyboard (arrows/ESC), mouse (next/prev buttons), and slide dots
- Slides cover: Cover, Concept, 4 Pillars, Why It Works, Before/After, Personalized Plan (with patient data), Safety/Experience, Call-to-Action
- **Personalized Plan slide**: Displays patient name, selected procedures with quantities, subtotals, and total investment from saved quote
- Final slide redirects to Quote Builder (/protocolo-dermalift)
- "Gerar Apresentação" button in saved quotes list navigates to presentation with quote data

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Node.js runtime
- ESBuild for production bundling

**Data Layer:**
- Drizzle ORM for database operations
- Neon serverless PostgreSQL database
- WebSocket support via ws package for Neon connections

**Storage Pattern:**
- Abstract storage interface (IStorage) for CRUD operations
- In-memory implementation (MemStorage) as default
- Designed for easy swap to database-backed storage

**API Design:**
- RESTful endpoints with `/api` prefix
- Request/response logging middleware
- Error handling middleware with status code support
- Session-based authentication with express-session
  - 7-day cookie expiration
  - httpOnly and secure cookies in production
  - SESSION_SECRET environment variable for session encryption

**Authentication System:**
- Email/password authentication (no third-party providers)
- Bcrypt for password hashing (salting and hashing)
- Session-based authentication using express-session
- Authentication endpoints:
  - POST /api/auth/register - Create new user account
  - POST /api/auth/login - Authenticate and create session
  - GET /api/auth/me - Get current authenticated user
  - POST /api/auth/logout - Destroy session
- Frontend pages:
  - /login - Login form with email/password
  - /register - Registration form with email, password, confirm password
  - Both use react-hook-form with Zod validation
  - Toast notifications for success/error feedback

### Data Schema

**Core Entities:**

1. **Users** - Authentication and access control
   - Fields: id, email (unique), username, password (bcrypt hashed)
   - UUID primary keys
   - Email-based authentication system

2. **Procedures** - Service catalog with Dermalift Protocol
   - Fields: id, name, description, price, mlPrice, minMl, maxMl, protocol (pgEnum), category
   - Protocol enum: sustentacao, estruturacao, embelezamento, revitalizacao
   - Decimal pricing with 10,2 precision
   - **mlPrice support**: Optional per-mL pricing for quantity-based procedures (e.g., fillers)
   - **minMl/maxMl**: Constraints for quantity-based procedures
   - Each procedure categorized into one of the 4 Dermalift pillars

3. **Patients** - CRM functionality
   - Fields: id, name, phone, email, cpf, birthDate, address, city, state, origin, tags
   - Contact information and demographics
   - Tagging system for patient categorization

4. **Quotes** - Dermalift Protocol-based quotes
   - Fields: id, patientId, total, discount, status, createdAt, notes
   - Links patients to quote items (via quoteItems table)
   - Tracks quote status (pending, accepted, etc.)

5. **QuoteItems** - Line items for quotes
   - Fields: id, quoteId, procedureId, quantity, customPrice, subtotal
   - Tracks quantity and custom pricing per procedure in a quote
   - Supports flexible pricing: custom override or calculated from quantity × mlPrice

**Schema Validation:**
- Zod schemas derived from Drizzle tables using drizzle-zod
- Type-safe insert/select operations with decimal coercion
- Shared schema definitions between client and server
- PostgreSQL enum enforcement for data integrity

### External Dependencies

**Database:**
- Neon Serverless PostgreSQL - Cloud-hosted database with WebSocket connections
- Connection managed via @neondatabase/serverless package
- Environment variable: DATABASE_URL required

**Development Tools:**
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)
- Only loaded in development environment when REPL_ID is present

**Font Services:**
- Google Fonts CDN for Inter and Poppins font families
- Preconnect hints for performance optimization

**UI Component Libraries:**
- Radix UI - Complete set of accessible UI primitives
- cmdk - Command menu component
- react-day-picker - Date selection
- vaul - Drawer component
- embla-carousel-react - Carousel functionality
- lucide-react - Icon library

**State Management:**
- TanStack Query for server state
- React Hook Form with Hookform Resolvers for form handling

**Styling:**
- Tailwind CSS with PostCSS
- class-variance-authority for component variants
- tailwind-merge via clsx for class merging

**Build & Development:**
- Vite for frontend bundling and dev server
- TSX for running TypeScript in development
- ESBuild for server bundling in production

**Type Safety:**
- Shared TypeScript configuration
- Path aliases: @/ for client, @shared/ for shared code
- Strict mode enabled