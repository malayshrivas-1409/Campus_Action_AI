# Campus Action AI - Design System

## Visual Language
Campus Action AI uses a clean, modern educational interface built on Tailwind CSS. The design prioritizes clarity, trustworthiness, and task efficiency (Operate mode).

## Design Tokens

### Color Palette
```
Primary (Trust, Intelligence):
  - indigo-600: #4f46e5 (buttons, active states, links)
  - indigo-700: #4338ca (hover/press)
  - indigo-100: #e0e7ff (backgrounds, badges)
  - indigo-50: #f0f9ff (light backgrounds)

Neutral (Structure):
  - gray-900: #111827 (text, headings)
  - gray-700: #374151 (secondary text)
  - gray-600: #4b5563 (tertiary text)
  - gray-200: #e5e7eb (borders, dividers)
  - gray-50: #f9fafb (page backgrounds)
  - white: #ffffff (containers, cards)

Semantic:
  - red-600: #dc2626 (errors, logout)
  - red-50: #fef2f2 (error backgrounds)
  - blue-50: #f0f9ff (info backgrounds)
  - blue-200: #bfdbfe (info borders)
  - blue-900: #111e3f (info text)
```

### Typography
```
Font Family: System stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif)

Heading Hierarchy:
  - h1: text-2xl font-bold (page titles)
  - h2: text-xl font-semibold (section headers)
  - h3: text-lg font-semibold (subsections)
  - p: text-sm/base font-normal (body text)
  - small: text-xs font-normal (captions, hints)

Weights:
  - font-bold (headings, emphasis)
  - font-semibold (section headers)
  - font-medium (labels, interactive elements)
  - font-normal (body, captions)
```

### Spacing & Layout
```
Grid: 12-column, max-width 7xl (80rem)
Gap: 4px (0.25rem) to 24px (1.5rem) in 4px increments
Padding: 16px (1rem) standard, 24px (1.5rem) sections
Border Radius: 8px (rounded-lg) standard component radius
Borders: 1px solid gray-200 standard

Responsive Breakpoints:
  - Mobile: <640px (stacked, full-width)
  - Tablet: 640px-1024px (single column + 1 side)
  - Desktop: >1024px (full multi-column)
```

## Component Patterns

### Navigation
- **Navbar**: White bg, sticky top, indigo accent for active, emoji icons on mobile
- **Pattern**: Horizontal tabs on desktop, icon buttons on mobile
- **State**: bg-indigo-100 + text-indigo-700 for active state

### Buttons
- **Primary**: bg-indigo-600 text-white, hover:bg-indigo-700
- **Secondary**: text-gray-700 hover:bg-gray-100
- **Disabled**: opacity-50 cursor-not-allowed
- **Size**: px-3/4 py-2 text-sm (compact), px-4 py-2 text-base (default)

### Cards
- **Style**: bg-white rounded-lg shadow p-6, border-b border-gray-200 on headers
- **Spacing**: space-y-2 between elements, space-y-4 between sections
- **Pattern**: Title (h2), content, optional action link

### Input Fields
- **Style**: border border-gray-300, px-4 py-2, rounded-lg
- **Focus**: ring-2 ring-indigo-500 border-transparent
- **Disabled**: opacity-50

### Messages/Chat Bubbles
- **User**: bg-indigo-600 text-white, rounded-lg, max-w-2xl
- **Assistant**: bg-white border border-gray-200, rounded-lg, max-w-2xl
- **Loading**: Animated spinner, "Thinking..." text

### Alerts
- **Error**: bg-red-50 border-red-200 text-red-800
- **Info**: bg-blue-50 border-blue-200 text-blue-900
- **Status**: green checkmark (✓) for success, yellow (⚠) for pending

## Layout Patterns

### Dashboard
- 3-column grid on desktop (1 col on mobile)
- Cards for account info, student profile, quick actions
- Status bar below (blue info banner)

### Chat Page
- Main chat area (flex-1) with header, messages, input
- Info sidebar (hidden on mobile, 16rem on desktop)
- Messages section uses infinite scroll space-y-4 gap

### Document List
- Table or card grid with title, type, size, date, delete action
- Empty state with helpful icon and CTA

### Upload
- Drag-drop zone or file input
- Progress indicator during processing
- Success/error feedback

## Interaction Patterns

### Hover States
- Buttons: background color shift
- Links: text color to indigo-700, underline optional
- Cards: subtle shadow increase (optional)

### Loading States
- Spinner (animated SVG circle)
- "Loading...", "Sending...", "Thinking..." text
- Disabled button state

### Error Handling
- Inline validation errors below inputs
- Toast-like alerts at top/bottom
- Error boundary catches React crashes

### Empty States
- Large centered SVG icon (12-16 size)
- Friendly heading + description
- CTA button to get started
- Example: "Start a Conversation" on Chat

## Accessibility
- **Contrast**: WCAG AA minimum (4.5:1 for text)
- **Focus**: Visible outline on all interactive elements
- **Labels**: All inputs have associated labels
- **Icons**: SVG icons have semantic meaning + text labels
- **Keyboard**: All interactions keyboard-accessible

## Refinement Areas (Current Implementation → Polish)
1. **Empty states**: Need consistent iconography and messaging across all pages
2. **Loading UI**: Add skeleton screens for data-heavy sections
3. **Mobile nav**: Hamburger menu might be better than 4 icon buttons on small screens
4. **Sources in chat**: Better visual hierarchy for document citations
5. **Error recovery**: Clear next steps when things fail
6. **Micro-interactions**: Add subtle transitions on navigation, form submission

## Tech Implementation
- **Framework**: React + TypeScript + Tailwind CSS
- **State**: Zustand for auth, chat, documents, notifications
- **Router**: React Router v6 with private route protection
- **HTTP**: Fetch API with automatic token refresh
- **Build**: Vite for fast dev/build
