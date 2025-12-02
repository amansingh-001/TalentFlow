# Design Guidelines: SME Business Automation & Recruiting Platform

## Design Approach
**System-Based Approach** inspired by Linear, Notion, and modern recruiting platforms (Greenhouse, Lever). This productivity-focused application prioritizes clarity, efficiency, and data hierarchy over decorative elements. The design emphasizes professional credibility while remaining approachable for non-technical SME users.

## Core Design Principles
1. **Information Clarity**: Dense data displays with clear visual hierarchy
2. **Workflow Efficiency**: Minimize clicks, maximize visible information
3. **Professional Trust**: Clean, enterprise-grade aesthetic at SME pricing
4. **Scannable Layouts**: Quick comprehension of candidate pipelines and metrics

## Typography System
- **Primary Font**: Inter (Google Fonts) - exceptional readability for data-heavy interfaces
- **Headings**: Inter Bold (text-2xl to text-4xl)
- **Body Text**: Inter Regular (text-sm to text-base)
- **Data/Numbers**: Inter Medium (text-base to text-lg)
- **Labels**: Inter Medium, uppercase, tracking-wide, text-xs

## Layout & Spacing
**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16, 20 (p-4, gap-6, mb-8, etc.)
- Consistent card padding: p-6
- Section spacing: py-12 to py-20
- Component gaps: gap-4 to gap-8
- Tight data spacing: space-y-2 for lists

**Container Strategy**:
- Full dashboard: max-w-screen-2xl mx-auto
- Content cards: Full width within dashboard grid
- Forms: max-w-2xl
- Modals: max-w-4xl for resume viewers, max-w-md for confirmations

## Application Structure

### Dashboard Layout (Post-Login)
**Sidebar Navigation** (w-64, fixed left):
- Logo/brand at top (h-16)
- Navigation items with icons (p-3, gap-3)
- Sections: Dashboard, Jobs, Candidates, Pipeline, Schedule, Settings
- User profile at bottom

**Main Content Area** (ml-64):
- Top bar with page title, search, notifications (h-16, border-b)
- Content grid using flexible widths

### Key Page Layouts

**1. Dashboard Overview**
- 4-column metrics grid (grid-cols-4): Total Applicants, Active Jobs, Interviews Scheduled, Offers Pending
- Recent activity timeline (2-column: timeline + candidate cards)
- Pipeline overview visualization

**2. Candidate Pipeline View**
- Kanban board layout: 5 columns (Applied → Screening → Interview → Offer → Rejected)
- Each column: w-80, candidate cards stack vertically
- Drag-drop visual affordances
- Candidate cards: compact (p-4), show photo placeholder, name, role applied, match score badge

**3. Job Posting Creation/Management**
- 2-column form layout (left: job details, right: requirements preview)
- Rich text editor for job description
- Tag-based skill input with autocomplete
- Multi-platform posting checkboxes with platform logos

**4. Detailed Candidate Profile**
- Split layout: Left sidebar (w-80) with candidate photo, contact, quick actions
- Main area (flex-1): Tabbed interface (Resume, Timeline, Notes, Documents)
- Prominent AI match score visualization at top
- Skills comparison matrix (required vs. candidate skills)

**5. Resume Upload Interface**
- Large dropzone (h-64): dashed border, centered icon and text
- Supported formats clearly labeled
- Upload progress indicators
- Recent uploads list below dropzone

**6. Interview Scheduling**
- Calendar grid on left (w-2/3)
- Availability slots on right (w-1/3)
- Time zone selector
- Automated email preview panel

## Component Library

### Data Display
- **Tables**: Striped rows, hover states, sortable headers with icons, sticky header
- **Cards**: Rounded (rounded-lg), subtle borders, hover elevation effect
- **Badges**: Rounded-full for status (Applied, Screening, etc.), color-coded by stage
- **Match Score**: Circular progress indicator or horizontal bar with percentage

### Forms & Inputs
- **Text Inputs**: Consistent height (h-10), clear labels above, helper text below
- **File Upload**: Drag-drop zone with clear CTAs, file type icons
- **Multi-select**: Tag-based with remove buttons
- **Date Pickers**: Calendar dropdown, time slot selectors

### Navigation & Actions
- **Primary Buttons**: Solid, rounded-md, px-6 py-2.5
- **Secondary Buttons**: Outlined, same dimensions
- **Icon Buttons**: Square (w-10 h-10), rounded-md, for table actions
- **Tabs**: Underline active state, subtle hover

### Data Visualization
- **Pipeline Progress**: Horizontal step indicator with completion percentages
- **Analytics**: Simple bar charts for metrics, line graphs for trends
- **Match Scores**: Color-coded percentage circles (green: 80%+, yellow: 50-79%, red: <50%)

## Icons
**Font Awesome** (via CDN) for consistency:
- Navigation: fa-dashboard, fa-briefcase, fa-users, fa-calendar, fa-cog
- Actions: fa-plus, fa-edit, fa-trash, fa-download, fa-upload
- Status: fa-check, fa-times, fa-clock, fa-star

## Imagery
**No hero image** - This is a productivity application, not a marketing site.

**Essential Images**:
- Candidate profile placeholders (circular avatars)
- Company logo upload area
- Document/resume preview thumbnails
- Empty state illustrations (e.g., "No candidates yet" with simple graphic)

## Accessibility & States
- Clear focus indicators on all interactive elements (ring-2)
- Sufficient contrast for text and data
- Loading states: Skeleton screens for tables/cards
- Empty states: Helpful messaging with action prompts
- Error states: Inline validation with clear messaging

## Responsive Behavior
- Desktop-first design (this is primarily a desktop tool)
- Tablet: Collapsible sidebar, maintain grid layouts
- Mobile: Stack columns, bottom navigation, simplified pipeline view

## Animation Guidance
**Minimal animations** - only functional:
- Modal slide-in/fade
- Dropdown menus: subtle fade + slide
- Drag-drop: Visual feedback during drag
- No decorative animations or parallax effects

This design creates a professional, efficient recruiting platform that feels modern and capable while remaining accessible to non-technical SME users.