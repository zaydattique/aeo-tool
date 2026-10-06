# Final Dashboard UI Reference

Status: **Design requirement recorded 2026-10-05**  
Applies to: **Phase 16 final UI/UX rebuild**

## Source

The owner supplied a dashboard reference image in the project conversation on 2026-10-05. It shows an "AEO Insight" style analytics dashboard and is the visual source of truth for the final Threezero AEO dashboard.

This document records the requirements so future implementation agents do not have to rely on conversation memory.

## Required interpretation

"Exact same" means the final dashboard should reproduce the reference's overall layout composition, information hierarchy, navigation structure, spacing rhythm, card proportions, dark premium visual language, analytics density, and interaction pattern as closely as practical.

The product content must remain Threezero AEO content and must use real product data. Do not copy another company's branding, proprietary text, or identity.

## Layout requirements

The reference contains:

1. A dark application shell.
2. A left sidebar with product navigation.
3. A top bar with:
   - search
   - date range
   - workspace switcher
   - notification control
   - account control
4. A top row of KPI cards.
5. A large central citation-performance analytics card.
6. A right-side top cited pages panel.
7. A right-side competitor gap visualization.
8. A recent AI mentions table spanning the main content width.
9. Dense but organized analytics with clear hierarchy.
10. Rounded cards and subtle depth.
11. Dark data visualizations that remain readable.
12. Compact controls integrated into the analytics surface.

## Product mapping

Reference metric areas map to real Threezero AEO data:

- AI Visibility Score
- Total Citations
- Share of Voice
- Average Position in AI Answers
- Citation Performance
- Top Cited Pages
- Competitor Gap
- Recent AI Mentions

These must not be hardcoded demo numbers in the finished product.

## Visual direction

Combine the reference with the owner's existing claymorphism requirement.

Use:

- premium dark surfaces
- soft depth
- controlled shadows
- rounded surfaces
- tactile controls
- subtle highlights
- restrained chart glow
- clear typography
- high data readability

Do not turn every component into a large soft 3D blob. Tables, dense analytics, filters, and operational controls must remain practical.

## Mobile-first requirement

The desktop screenshot is not permission to build desktop first.

The implementation must be designed from mobile upward:

- mobile navigation
- mobile KPI layout
- chart scrolling or alternative presentation
- filter behavior
- table behavior
- accessible action menus
- notification interaction
- client/workspace switching
- readable density
- touch targets

Then expand the same component system to tablet and desktop.

Do not create separate duplicated mobile and desktop dashboard code.

## Accessibility requirements

The visual design must coexist with WCAG 2.2 AA.

Charts must provide:

- accessible title
- short summary
- semantic data representation
- underlying table/data where the chart communicates important information
- keyboard-accessible controls

Important status must not depend on color alone.

Notifications must not depend on sound alone.

Keyboard users need a logical focus order and visible focus.

Screen-reader users must be able to understand the same decisions that a sighted user can make from the dashboard.

## Final implementation gate

The dashboard is not considered complete when it merely looks similar in a screenshot.

It must also pass:

- real data rendering
- loading states
- empty states
- partial data states
- provider failure states
- permission states
- stale-data states
- mobile browser testing
- keyboard navigation
- screen-reader smoke tests
- contrast checks
- reduced-motion checks
- chart accessibility checks
- responsive breakpoint testing
- visual review against the supplied reference

## Related product requirements

The final UI must also respect:

- Super Admin managed company information
- admin-managed media
- dollar-based pricing
- notification preferences
- tenant isolation
- real analytics methodology
- live/cached/estimated labeling
- no duplicate component systems
- no layered CSS overrides
- no hardcoded business data

The final UI/UX rebuild is intentionally Phase 16. Earlier phases build and validate the underlying product so Phase 16 can be based on real behavior rather than assumptions.
