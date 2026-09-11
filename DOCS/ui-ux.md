# SKILL: UI/UX for Admin Operations Portals

Applies to: all frontend work. Goal: look like a real internal tool a real ops team would trust, not a generic AI-generated CRUD scaffold.

## Design system (build these once in `components/ui/`, reuse everywhere)

- **Button**: variants `primary | secondary | danger | ghost`, sizes `sm | md`. Disabled state visibly greyed, never just non-functional.
- **Input / Select / Textarea**: label above field, error message below in red, required fields marked with `*`. Every input has a visible focus ring.
- **Table**: sticky header, zebra striping or subtle row borders (not both), row hover state, empty state ("No customers yet — Add your first customer"), loading state (skeleton rows, not a spinner that blocks the whole page).
- **Badge**: status pills — color-coded per status enum (e.g. Draft=grey, Confirmed=green, Cancelled=red; Lead=blue, Active=green, Inactive=grey).
- **Modal**: for create/edit forms where a full page nav would break flow (e.g. quick "add follow-up note").
- **AppShell**: fixed sidebar (nav by module, icon + label, active state highlighted) + topbar (user name, role badge, logout) + scrollable content area.

## Layout conventions

- List pages: page title + primary action button top-right ("+ Add Customer") + search/filter bar + table + pagination footer.
- Detail pages: header card (key info) + tabs or sections below (e.g. customer detail: info card, follow-up notes list, related challans list).
- Forms: single column on mobile, max 2-column grid on desktop, logically grouped fields (contact info together, business info together), primary action button bottom-right, cancel/back to its left.

## Color & type system

- One primary brand color (pick a single blue or indigo, e.g. `#4F46E5`), neutral greys for everything else, semantic colors only for status (green=good/confirmed, amber=warning/low-stock, red=error/cancelled, blue=info/lead).
- One font family (system font stack or a single Google Font, e.g. Inter). Type scale: 12/14/16/20/24px, don't invent more sizes than that.
- Generous whitespace over dense cramming — this is an internal tool people stare at all day, not a marketing page.

## States every screen needs

Loading, empty, error, and populated. An AI-built app is instantly recognizable by screens that only handle the happy path — don't ship that.

## Low-stock / business-signal surfacing

Products below `minStock` should be visually flagged (amber badge or highlighted row) wherever products appear, including inside the challan-creation product picker (warn before someone drafts a challan they can't fulfill).

## Responsive rule

Sidebar collapses to a hamburger/icon-only rail below ~768px. Tables become horizontally scrollable, not crushed. Forms stack to single column.

## What to avoid

Default unstyled browser `<select>`/`<input>` look, pure black on pure white with no grey scale, more than one accent color, centered-everything layouts (admin tools are left-aligned and dense-but-organized), emoji as icons (use a proper icon set — lucide-react is fine).
