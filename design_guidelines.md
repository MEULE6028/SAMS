# SAMS Design Guidelines

## Design Approach

**Selected Approach:** Design System (Enterprise Dashboard)
**Primary Reference:** Material Design + Fluent Design principles for institutional software
**Rationale:** SAMS is a utility-focused, information-dense management system requiring stability, efficiency, and professional credibility for an academic institution.

## Core Design Principles

1. **Institutional Authority** - Professional, trustworthy interface reflecting UEAB's academic standing
2. **Data Clarity** - Clear information hierarchy with scannable layouts for complex data
3. **Modular Integration** - Unified design language across three distinct subsystems
4. **Accessible Efficiency** - Role-based interfaces optimized for daily administrative tasks

## Color Palette

### Brand Colors (UEAB Official)
- **Primary Blue:** 210 100% 31% (UEAB #0033A0)
- **Secondary Gold:** 48 100% 50% (UEAB #FFD100)
- **Accent Blue Light:** 226 75% 60% (#4A7BE3)
- **Accent Gold Light:** 54 100% 72% (#FFEA70)

### Functional Colors
**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 210 100% 20%
- Text Secondary: 210 20% 40%
- Border: 210 20% 90%

**Dark Mode:**
- Background: 210 50% 8%
- Surface: 210 40% 12%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Border: 210 30% 20%

### Semantic Colors
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%
- Info: 210 100% 31%

## Typography

**Font Stack:** Inter (headings), Inter (body) via Google Fonts CDN

**Hierarchy:**
- **Display (H1):** text-4xl font-bold (institutional headers)
- **Heading (H2):** text-2xl font-semibold (subsystem titles)
- **Subheading (H3):** text-xl font-semibold (section headers)
- **Body Large:** text-base (primary content)
- **Body Regular:** text-sm (data tables, forms)
- **Caption:** text-xs (metadata, timestamps)

**Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Tight spacing: p-2, gap-2 (compact data displays)
- Standard spacing: p-4, gap-4 (form fields, cards)
- Generous spacing: p-8, gap-8 (section separation)
- Page margins: p-6 md:p-8 lg:p-12

**Grid System:**
- Dashboard layout: Sidebar (fixed 240px) + Main content (flex-1)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Data tables: Full-width with responsive horizontal scroll
- Max content width: max-w-7xl for centered layouts

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header, bg-ueab-blue, white text
- UEAB logo placeholder (left), system title "SAMS", user menu (right)
- Height: h-16, shadow-md
- Gold accent on active/hover states

**Sidebar Navigation:**
- Fixed left sidebar, bg-surface
- Three-tier structure: Subsystem groups (Chapa360, SWSMS, SGMS), module navigation, quick actions
- Icons from Heroicons, text-sm
- Active state: border-l-4 border-ueab-gold with blue-light background

### Cards & Surfaces
**Dashboard Cards:**
- Rounded-lg, border, shadow-sm
- White bg (light mode), surface bg (dark mode)
- Padding: p-6
- Header with icon + title (gold accent), body content, optional footer actions

**Stat Cards:**
- Grid layout for metrics overview
- Large number display (text-3xl font-bold in ueab-blue)
- Label (text-sm text-secondary), trend indicator (small arrow + percentage)
- Background subtle gradient from blue-light/5% to transparent

### Forms & Inputs
**Form Fields:**
- Label (text-sm font-medium mb-2)
- Input fields: rounded-md border p-3, focus:ring-2 ring-ueab-blue
- Dark mode compatible with consistent border contrast
- Helper text (text-xs text-secondary)

**Buttons:**
- **Primary:** bg-ueab-blue hover:bg-ueab-blue-light, white text, rounded-md px-6 py-3
- **Secondary:** bg-ueab-gold hover:bg-ueab-gold-light, blue text, rounded-md px-6 py-3
- **Outline:** border-2 border-ueab-blue text-ueab-blue, hover:bg-ueab-blue hover:text-white
- **Ghost:** text-ueab-blue hover:bg-blue-light/10 (for table actions)

### Data Display
**Tables:**
- Striped rows (alternate bg-surface/5%)
- Header: bg-ueab-blue/5, font-semibold, sticky top-0
- Cell padding: px-6 py-4
- Hover: bg-blue-light/5
- Mobile: Responsive cards on small screens

**Status Badges:**
- Rounded-full px-3 py-1 text-xs font-medium
- Pending: bg-warning/20 text-warning
- Approved: bg-success/20 text-success
- Rejected: bg-error/20 text-error
- Active: bg-ueab-blue/20 text-ueab-blue

**Charts (Recharts):**
- Line/Area charts: ueab-blue primary, gold secondary
- Bar charts: blue for positive, gold for comparison
- Pie/Donut: blue scale gradient
- Grid lines: subtle (stroke-width: 1, opacity: 0.1)

### Modals & Overlays
**Modal Dialogs:**
- Backdrop: bg-black/50 backdrop-blur-sm
- Content: max-w-2xl rounded-lg shadow-2xl
- Header with gold accent border-b, body p-6, footer with action buttons

**Toast Notifications:**
- Bottom-right position, slide-in animation
- Color-coded by type (success, error, info, warning)
- Auto-dismiss after 5s

## Dashboard-Specific Guidelines

### Role-Based Views
**Student Dashboard:**
- Single-column focus on personal data (account balance, applications, timecards)
- Quick action cards for common tasks
- Simplified navigation

**Admin/Supervisor Dashboard:**
- Multi-panel layout with overview + detailed data tables
- Filters and search prominently placed
- Bulk action controls

### Subsystem Color Coding (Subtle)
- Chapa360: Blue accent (finance theme)
- SWSMS: Blue-gold combination (work-reward association)
- SGMS: Gold accent (leadership/governance theme)

Use as subtle left border or icon tint, not dominant backgrounds.

## Responsive Behavior

- **Mobile (< 768px):** Collapsed sidebar (hamburger menu), stacked cards, scrollable tables become card lists
- **Tablet (768px - 1024px):** Sidebar toggle, 2-column card grids
- **Desktop (> 1024px):** Full sidebar, 3-column grids, multi-panel dashboards

## Images

**No Hero Images** - This is a dashboard application, not a marketing site. Focus on data density and functional layouts.

**Supporting Imagery:**
- UEAB logo: Top-left in navigation bar (40x40px placeholder)
- Empty state illustrations: Simple line art in ueab-blue for empty tables/lists
- User avatars: 32x32px circular, with initials fallback
- Document previews: Thumbnails in file upload components

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: Fade (150ms)
- Dropdown menus: Slide-down (200ms ease-out)
- Button interactions: Scale (0.98 on active)
- Loading states: Spinner in ueab-blue
- Toast notifications: Slide-in from bottom-right

No distracting animations in data-dense areas.

## Accessibility

- WCAG 2.1 AA compliance
- Consistent focus indicators (ring-2 ring-ueab-blue)
- Dark mode with sufficient contrast ratios (4.5:1 minimum)
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for dynamic content updates