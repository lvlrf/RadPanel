# UI/UX Design Decisions - RAD Panel

## Design Philosophy

**Principle**: Minimal, functional, Persian-first

### Core Values
- Clarity over beauty
- Speed over animations  
- Function over form
- Mobile-friendly from day one

---

## Color Palette

### Primary Colors
- **Brand**: Blue (#3B82F6) - Trust, technology
- **Success**: Green (#10B981) - Approved, positive
- **Warning**: Orange (#F59E0B) - Pending, attention
- **Danger**: Red (#EF4444) - Rejected, negative
- **Neutral**: Gray (#6B7280) - Text, borders

### Dark Mode
- Supported via Tailwind
- Toggle in header
- Persisted in localStorage

---

## Typography

### Persian
- **Primary**: Vazirmatn (modern, clean)
- **Fallback**: Tahoma, Arial
- **Direction**: RTL

### English
- **Code/Numbers**: JetBrains Mono
- **Fallback**: monospace

### Sizes
- Heading: 24px, 20px, 18px
- Body: 16px
- Small: 14px
- Tiny: 12px

---

## Layout

### Desktop (>1024px)
- Sidebar navigation (left)
- Main content (center)
- Optional right panel

### Tablet (768px-1024px)
- Collapsible sidebar
- Full-width content

### Mobile (<768px)
- Bottom navigation
- Stacked content
- Hamburger menu

---

## Components

### Buttons
- Primary: Filled blue
- Secondary: Outline
- Danger: Filled red
- Text: No background

### Forms
- Labels above inputs
- Persian placeholders
- Inline validation
- Clear error messages

### Tables
- Striped rows
- Hover highlight
- Sticky header
- Responsive (cards on mobile)

### Modals
- Backdrop blur
- Esc to close
- Focus trap
- Confirm before destructive actions

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators visible
- Color contrast WCAG AA

---

## Persian UI Patterns

### Number Display
```
✅ 1,234,567 تومان
❌ ۱,۲۳۴,۵۶۷ تومان (avoid Persian digits)
```

### Date Display
```
✅ 1403/10/12
✅ 2025-01-01
```

### Forms
- Labels in Persian
- Placeholders in Persian
- Errors in Persian

---

## Mobile Considerations

- Touch targets: 44px minimum
- No hover states (use :active)
- Swipe gestures where appropriate
- Bottom navigation for key actions

---

**Status**: MVP Guidelines  
**Review**: After user testing
