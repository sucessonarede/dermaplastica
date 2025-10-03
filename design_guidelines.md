# Dermalift Design Guidelines

## Design Approach: Material Design System (Adapted)

**Rationale**: Dermalift is a utility-focused B2B SaaS platform requiring efficiency, clear information hierarchy, and complex data management. Material Design provides robust patterns for forms, tables, dashboards, and multi-step workflows essential for clinic management software.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 275 100% 26% (Deep Purple)
- Secondary: 340 74% 62% (Rose Pink) 
- Accent: 17 100% 61% (Burnt Orange) - use sparingly for CTAs and important actions
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 0 0% 13%
- Text Secondary: 0 0% 38%
- Border: 0 0% 89%
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%

**Dark Mode:**
- Primary: 275 100% 75% (Lighter purple for contrast)
- Secondary: 340 74% 70%
- Accent: 17 100% 70%
- Background: 0 0% 7%
- Surface: 0 0% 12%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Border: 0 0% 22%

### B. Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - body text, UI elements, forms
- Secondary: Poppins (via Google Fonts) - headings, emphasis

**Hierarchy:**
- H1: Poppins, 32px/36px, 700 weight
- H2: Poppins, 24px/32px, 600 weight
- H3: Poppins, 20px/28px, 600 weight
- H4: Poppins, 18px/24px, 600 weight
- Body Large: Inter, 16px/24px, 400 weight
- Body: Inter, 14px/20px, 400 weight
- Body Small: Inter, 13px/18px, 400 weight
- Caption: Inter, 12px/16px, 400 weight
- Button: Inter, 14px/20px, 500 weight

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Micro spacing (elements): p-2, gap-2, m-2
- Component spacing: p-4, gap-4, m-4
- Section spacing: p-6, py-8, my-12
- Page spacing: p-8, py-16, my-20

**Grid System:**
- Dashboard: 12-column grid with sidebar (260px fixed on desktop, collapsible on mobile)
- Forms: Single column on mobile, 2-column on tablet+, max-width of 800px for readability
- Data tables: Full-width with horizontal scroll on mobile
- Cards: Grid layout with responsive columns (1/2/3/4 based on viewport)

### D. Component Library

**Navigation:**
- Top Bar: Fixed header with logo, global search, notifications, user menu (64px height)
- Sidebar: Collapsible navigation with icon + label, grouped sections, active state with purple background
- Breadcrumbs: Show page hierarchy in multi-level sections

**Forms:**
- Input Fields: Outlined style with floating labels, purple focus ring, validation states
- Select Dropdowns: Material-style with search capability for long lists
- File Upload: Drag-and-drop zones with preview thumbnails for images
- Multi-step Forms: Stepper component at top showing progress (clinic onboarding, quote builder)

**Data Display:**
- Cards: Elevated (shadow-md) with 16px padding, hover lift effect
- Tables: Sticky headers, alternating row colors (subtle), sortable columns, pagination
- Stats Cards: Large number display with trend indicators (up/down arrows) and sparklines
- Badges: Pill-shaped for tags, status indicators (lead origin, patient status)

**Actions:**
- Primary Buttons: Filled with primary purple, white text, 40px height
- Secondary Buttons: Outlined with purple border, purple text
- Accent CTAs: Filled with burnt orange for high-priority actions (Accept Proposal, Generate PDF)
- Icon Buttons: 40px square with hover background

**Overlays:**
- Modals: Centered with backdrop blur, max-width 600px for forms, larger for PDF preview
- Slideovers: Right-side panel (400px) for quick edits, patient details
- Tooltips: Dark background, white text, 8px from trigger
- Toast Notifications: Top-right corner, auto-dismiss, color-coded by type

**Dashboard Widgets:**
- KPI Cards: Large number with label, trend percentage, comparison period
- Charts: Use Chart.js for line/bar graphs with purple gradient fills
- Recent Activity: Timeline-style list with icons and timestamps
- Quick Actions: Grid of cards with icons linking to common tasks

### E. Page Layouts

**Clinic Onboarding:** Multi-step wizard with progress indicator, back/next navigation, save draft capability

**Patient Management:** List view with search/filter sidebar, card view toggle, patient detail slideover

**Quote Builder:** Three-panel layout - patient search (left), procedure selection (center), live preview (right), sticky footer with total and actions

**Reports:** Dashboard with date range selector, filterable metrics grid, downloadable charts, drill-down capability

**Admin Panel:** Tabs for different settings sections, two-column layout for configuration forms

### F. Animations

**Minimal, Purposeful Only:**
- Page transitions: Subtle fade (150ms)
- Modal/slideover: Slide-in from direction (200ms ease-out)
- Button states: No custom animations - rely on default hover/active states
- Loading states: Skeleton screens for data-heavy views, spinner for actions

---

## Images

**Dashboard/App Interface**: No hero images - this is a utility application focused on data and workflow efficiency. Use icons from Heroicons throughout the interface for actions, navigation, and visual indicators.