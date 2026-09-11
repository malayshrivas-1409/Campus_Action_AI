# Frontend Audit - Remediation Roadmap

## Quick Reference: Fixes by Impeccable Command

### Phase 1: Critical Accessibility (P0 - Week 1)

#### Command: `/impeccable harden`
**Time estimate:** 12-16 hours | **Files affected:** 8-10

**Scope:**
- Fix form label associations in FormGroup component
- Add ARIA labels to Icon component
- Add focus trapping to modals
- Add visible focus indicators to buttons
- Add form validation error styling
- Add required field indicators
- Add aria-invalid and aria-describedby to inputs

**Specific changes:**
1. Update `UI.tsx` FormGroup to wire `htmlFor` to input `id`
2. Update `Icon.tsx` to accept `isDecorative`, `ariaLabel`, `role` props
3. Update `index.css` to add button `:focus-visible` styling
4. Update all form pages to add `id` attributes to inputs
5. Add `aria-required="true"` to required fields
6. Add error styling: `border-error` class on invalid inputs

**Files to modify:**
- `src/components/UI.tsx` (FormGroup)
- `src/components/Icon.tsx`
- `src/index.css`
- `src/pages/Login.tsx`
- `src/pages/DocumentUpload.tsx`
- `src/pages/Search.tsx`
- `src/components/Button.tsx`

---

### Phase 2: Responsive & Touch (P1 - Week 1-2)

#### Command: `/impeccable adapt`
**Time estimate:** 10-14 hours | **Files affected:** 6-8

**Scope:**
- Increase button sizes to 44x44px minimum
- Fix touch target sizes throughout app
- Fix horizontal overflow on mobile
- Add responsive text scaling
- Test on 375px viewport
- Ensure no content cutoff on narrow screens

**Specific changes:**
1. Update `Button.tsx` size styles: sm→40px, md→48px, lg→56px
2. Add `min-h-[44px] min-w-[44px]` to interactive elements
3. Update form inputs: `py-2 md:py-3` (bigger on all sizes)
4. Fix responsive padding: `px-4 md:px-6 lg:px-8`
5. Update heading sizes: `text-2xl md:text-3xl`
6. Add `max-w-full` to card containers
7. Test on iPhone SE (375px) viewport

**Files to modify:**
- `src/components/Button.tsx`
- `src/index.css` (button sizes)
- `src/components/UI.tsx`
- `src/pages/Chat.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Search.tsx`

---

### Phase 3: Design System Alignment (P1 - Week 2)

#### Command: `/impeccable colorize`
**Time estimate:** 8-10 hours | **Files affected:** 10+

**Scope:**
- Map all Tailwind colors to CSS custom properties
- Replace 40+ hard-coded color classes
- Configure Tailwind to use CSS variables
- Update Button component to use tokens
- Add dark mode support structure

**Specific changes:**
1. Create `tailwind.config.js` with color mappings:
   ```js
   colors: {
     primary: 'var(--color-primary)',
     secondary: 'var(--color-secondary)',
     // ... etc
   }
   ```
2. Replace `bg-blue-600` with `bg-primary`
3. Replace `text-red-600` with `text-error`
4. Replace `border-emerald-200` with `border-success`
5. Update all 40+ instances across components
6. Add dark mode variants in CSS

**Files to modify:**
- Create `tailwind.config.js`
- `src/components/Button.tsx`
- `src/pages/Login.tsx`
- `src/pages/DocumentUpload.tsx`
- `src/pages/Dashboard.tsx`
- All component files using colors

---

### Phase 4: Performance & Polish (P1-P2 - Week 2-3)

#### Command: `/impeccable optimize`
**Time estimate:** 6-8 hours | **Files affected:** 3-4

**Scope:**
- Add GPU acceleration to animations
- Add prefers-reduced-motion support
- Optimize spinner animation frames
- Add will-change hints for expensive animations
- Benchmark on low-end mobile

**Specific changes:**
1. Add media query to `index.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
2. Update spin animation: `animation: spin 1s steps(12) infinite;`
3. Add transforms: `transform: translateZ(0);` to animated elements
4. Add `will-change: transform;` to `.animate-spin`

**Files to modify:**
- `src/index.css`
- `src/components/UI.tsx` (LoadingSpinner)

---

#### Command: `/impeccable clarify`
**Time estimate:** 4-6 hours | **Files affected:** 5-6

**Scope:**
- Improve error messages (specific, actionable)
- Add inline form validation feedback
- Add help text and hints
- Improve empty state messaging
- Consistent error messaging language

**Specific changes:**
1. Login errors: "Invalid email format" instead of "Login failed"
2. Upload errors: "File must be PDF, max 50MB" with highlighting
3. Form helpers: Show real-time validation (e.g., "✓ Strong password")
4. Error icons inline: `<Icon name="alertCircle" /> Email is required`
5. Add aria-describedby linking error to input

**Files to modify:**
- `src/pages/Login.tsx`
- `src/pages/DocumentUpload.tsx`
- `src/pages/Search.tsx`
- `src/components/UI.tsx`

---

#### Command: `/impeccable layout`
**Time estimate:** 6-8 hours | **Files affected:** 8-10

**Scope:**
- Fix spacing and visual hierarchy
- Improve card layouts
- Standardize gap/padding values
- Align items consistently
- Improve form field spacing

**Specific changes:**
1. Standardize card padding: compact=4, normal=6, large=8
2. Update button groups: `gap-3 md:gap-4`
3. Improve form field spacing: `mb-6` with `md:mb-8`
4. Align form labels and inputs consistently
5. Update grid gaps: `gap-4 md:gap-6 lg:gap-8`

**Files to modify:**
- `src/index.css`
- `src/components/UI.tsx`
- `src/pages/*` (spacing updates)

---

### Phase 5: Polish & Enhancement (P2-P3 - Week 3)

#### Command: `/impeccable polish`
**Time estimate:** 4-6 hours | **Files affected:** 3-4

**Scope:**
- Enhance disabled state styling
- Improve alert box presentation
- Add button focus ring styling
- Improve visual feedback
- Refine hover states

**Specific changes:**
1. Disabled button: Grayscale + reduced opacity + striped pattern
2. Alert icons: Add `flex-shrink-0` to ensure visibility
3. Button focus: `outline-2 outline-secondary outline-offset-2`
4. Hover states: Consistent shadow lift on cards/buttons
5. Loading indicators: Better visual design with brand colors

**Files to modify:**
- `src/index.css`
- `src/components/Button.tsx`
- `src/components/UI.tsx` (Alert, Badge)

---

## Implementation Timeline

### Sprint 1 (Week 1): Foundation
```
Day 1-2: /impeccable harden (Forms + A11y)
         - Form labels, ARIA, focus management
         - Estimated: 12-16 hrs

Day 3-4: /impeccable adapt (Responsive + Touch)
         - Button sizes, touch targets, mobile viewport
         - Estimated: 10-14 hrs

Remaining: Testing and review
```

### Sprint 2 (Week 1-2): System Alignment
```
Day 1-2: /impeccable colorize (Design Tokens)
         - Color mapping, Tailwind config, token enforcement
         - Estimated: 8-10 hrs

Day 3-4: /impeccable clarify (Error Messages)
         - Form validation feedback, error text, help text
         - Estimated: 4-6 hrs

Day 5: /impeccable optimize (Performance)
       - Animations, prefers-reduced-motion, GPU hints
       - Estimated: 6-8 hrs
```

### Sprint 3 (Week 2-3): Refinement
```
Day 1-2: /impeccable layout (Spacing & Hierarchy)
         - Card layouts, padding/gaps, form alignment
         - Estimated: 6-8 hrs

Day 3-4: /impeccable polish (Final Polish)
         - Disabled states, focus rings, hover effects
         - Estimated: 4-6 hrs

Day 5: Testing & verification
       - Accessibility audit, responsive test, performance check
```

---

## Testing Between Phases

### After Phase 1 (Harden):
```bash
# Test checklist
- [ ] Tab through all pages - focus visible everywhere
- [ ] Screen reader test on 1-2 pages
- [ ] Form submission with errors - input highlights
- [ ] Required fields marked visibly
```

### After Phase 2 (Adapt):
```bash
# Test checklist
- [ ] 375px viewport - no overflow, no cut-off content
- [ ] 768px tablet - layout works
- [ ] 1024px+ desktop - spacing looks good
- [ ] Tap all buttons - easy to hit on mobile
- [ ] Zoom to 200% - no layout breaks
```

### After Phase 3 (Colorize):
```bash
# Test checklist
- [ ] All colors use token system
- [ ] No hard-coded Tailwind colors
- [ ] Dark mode CSS variables ready
- [ ] Contrast ratios still pass
```

### After Phase 4 (Optimize + Clarify + Layout):
```bash
# Test checklist
- [ ] Animations smooth on low-end device
- [ ] No animations with prefers-reduced-motion enabled
- [ ] Error messages clear and specific
- [ ] Spacing consistent throughout
- [ ] Lighthouse score improved
```

### After Phase 5 (Polish):
```bash
# Test checklist
- [ ] Disabled buttons look clearly disabled
- [ ] Focus rings visible on all interactive elements
- [ ] Hover effects consistent
- [ ] Overall polish pass
```

---

## Score Improvement Projection

| Phase | Action | Expected Score Improvement |
|-------|--------|---------------------------|
| Current | — | **13/20** |
| Phase 1 | `/impeccable harden` | +3 → **16/20** |
| Phase 2 | `/impeccable adapt` | +1.5 → **17.5/20** |
| Phase 3 | `/impeccable colorize` | +1 → **18.5/20** |
| Phase 4 | `/impeccable optimize` + others | +1 → **19.5/20** |
| Phase 5 | `/impeccable polish` | +0.5 → **20/20** |

**Target:** 20/20 (Excellent) after all phases

---

## Risk Mitigation

### High-Risk Changes (Require Testing)
1. **Color refactoring** - Ensure no visual regressions across 10+ components
2. **Button size changes** - May affect form layouts, spacing
3. **Tailwind config changes** - Could break existing class usage

### Testing Strategy
- Create feature branches for each major command
- Test on actual mobile devices (not just DevTools)
- Have a11y expert review accessibility changes
- Performance test on low-end device (Chrome DevTools throttling)
- Full regression test after each phase

### Rollback Plan
- Each command should be reversible
- Keep git commits atomic per command
- If a change breaks major functionality, revert and investigate

---

## Success Criteria

### Phase 1 ✅
- [ ] All form fields have visible labels associated via id/htmlFor
- [ ] Focus indicator visible when tabbing through all interactive elements
- [ ] All icons have appropriate ARIA attributes
- [ ] Error messages tied to inputs with aria-describedby
- [ ] Accessibility score: 3/4 or higher

### Phase 2 ✅
- [ ] All touch targets 44×44px minimum
- [ ] No horizontal scroll on 375px viewport
- [ ] Text readable at 200% zoom
- [ ] Form inputs easily tappable on mobile
- [ ] Responsive score: 4/4

### Phase 3 ✅
- [ ] 0 hard-coded Tailwind color classes
- [ ] All colors use CSS custom properties via Tailwind config
- [ ] Color changes in one place propagate everywhere
- [ ] Dark mode CSS structure in place
- [ ] Theming score: 4/4

### Phase 4 ✅
- [ ] Animations smooth at 60fps on low-end device
- [ ] Respect prefers-reduced-motion setting
- [ ] Error messages specific and actionable
- [ ] Spacing consistent throughout app
- [ ] Performance score: 4/4

### Phase 5 ✅
- [ ] Disabled buttons visually distinct
- [ ] Focus rings visible and styled correctly
- [ ] Overall visual polish improved
- [ ] Implementation score: 3/4 or higher

### Final Goal ✅
- **Audit Score: 19-20/20** (Excellent)
- **WCAG AA Compliance:** Verified with axe-core
- **Responsive:** Works perfectly on 375px to 1920px
- **Performance:** Lighthouse score 85+
- **UX:** All error states and edge cases handled

---

## Command Cheat Sheet

```bash
# Run all recommended commands in order:
/impeccable harden    # Forms, A11y, focus, validation
/impeccable adapt     # Responsive, touch targets, mobile
/impeccable colorize  # Design tokens, colors, dark mode
/impeccable optimize  # Animations, performance, prefers-reduced-motion
/impeccable clarify   # Error messages, help text, labeling
/impeccable layout    # Spacing, hierarchy, alignment
/impeccable polish    # Final visual refinements

# After each command, verify with:
/impeccable audit     # Run audit again to see score improve
```

---

## Questions Before Starting?

- **Q:** How much will score improve per command?  
  **A:** See "Score Improvement Projection" section above

- **Q:** Can I skip any phase?  
  **A:** Not recommended - each builds on previous. P0 (Phase 1) is mandatory.

- **Q:** How long total?  
  **A:** 40-60 hours total, ~2-3 weeks with concurrent tasks

- **Q:** Do I need to run all commands?  
  **A:** For Excellent (20/20) score, yes. For Good (17+), skip Phase 5.

---

**Next Step:** Confirm timeline and priority level, then run Phase 1 commands in order.

You can ask me to run these one at a time, or combine multiple commands in a single workflow.

Re-run `/impeccable audit` after each phase to track progress toward your target score.
