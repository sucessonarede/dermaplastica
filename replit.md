# Dermalift - Aesthetic Clinic Management Platform

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
- Real-time total calculation
- Clean, professional design for in-clinic patient presentations

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
- Session support via connect-pg-simple (configured but not actively used)

### Data Schema

**Core Entities:**

1. **Users** - Authentication and access control
   - Fields: id, username, password
   - UUID primary keys

2. **Procedures** - Service catalog with Dermalift Protocol
   - Fields: id, name, description, price, protocol (pgEnum), category
   - Protocol enum: sustentacao, estruturacao, embelezamento, revitalizacao
   - Decimal pricing with 10,2 precision
   - Each procedure categorized into one of the 4 Dermalift pillars

3. **Patients** - CRM functionality
   - Fields: id, name, phone, email, cpf, birthDate, address, city, state, origin, tags
   - Contact information and demographics
   - Tagging system for patient categorization

4. **Quotes** - Dermalift Protocol-based quotes
   - Fields: id, patientId, procedureIds (array), total, discount, status, createdAt, notes
   - Links patients to selected procedures
   - Tracks quote status (pending, accepted, etc.)

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