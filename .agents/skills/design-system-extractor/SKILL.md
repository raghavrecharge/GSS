---
name: design-system-extractor
description: Extract an evidence-backed UI design system from authorized SaaS screenshots and browser pages. Use to document typography, colours, spacing, grids, responsive behaviour, components, visual states, and recreation-ready design tokens.
---

# Design system extraction

## Inputs
Use reference screenshots and page observations produced by browser reconnaissance. Record viewport and UI state for every reference. Do not infer exact CSS values from appearance alone; label estimates.

## Procedure

### 1. Establish visual foundations
Record:
- viewport dimensions and content width;
- page background, surface layers, borders, shadows;
- typography families, sizes, weights, line heights, letter spacing;
- spacing scale and common gaps;
- radii, control heights, icon sizes;
- grid columns, gutters, breakpoints, sticky/fixed regions.

Use measured browser values if authorized devtools/computed styles are available. Otherwise mark values as visual estimates and state confidence.

### 2. Inventory components
For each reusable component, document:
- name and purpose;
- anatomy and layout;
- variants and sizes;
- default, hover, focus, active, disabled, loading, error, and selected states;
- responsive transformations;
- keyboard and accessibility behaviour;
- evidence IDs.

Include navigation, buttons, inputs, selects, checkboxes, radio controls, cards, tables, badges, alerts, modals, drawers, menus, tabs, pagination, charts, empty states, and notifications as applicable.

### 3. Map responsive behaviour
Compare equivalent routes at the agreed viewport widths. Record:
- breakpoint evidence or estimated ranges;
- columns and stacking;
- navigation collapse;
- table overflow or alternate mobile presentation;
- typography and spacing changes;
- hidden/reordered elements;
- touch target sizing.

Do not invent unsupported breakpoints. Choose implementation breakpoints based on observed layout transitions and test them.

### 4. Create implementation tokens
Use semantic tokens, not one-off values. Example:

```css
:root {
  --color-bg: #ffffff;       /* replace with measured value */
  --color-surface: #f7f8fa;
  --color-text: #172033;
  --color-muted: #667085;
  --color-border: #e4e7ec;
  --color-primary: #3659d9;
  --radius-control: 8px;
  --radius-card: 12px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
}
```

The sample values are placeholders, not claims about the reference. Replace them with evidence-backed values or clearly label estimates.

### 5. Asset policy
Use user-provided, licensed, public-domain, or independently created assets. Do not download/reuse proprietary logos, illustrations, photography, icon packs, fonts, or other protected assets without permission. Use neutral placeholders where necessary.

### 6. Accessibility
Document semantic landmarks, heading order, labels, contrast risks, focus visibility, keyboard interactions, reduced-motion needs, and accessible names. A visual imitation must not regress accessibility.

## Deliverables
- `design-system.md`
- `component-inventory.md`
- `responsive-matrix.md`
- implementation-ready token file in the project's native format

## Quality check
Every token and component should cite one or more evidence IDs or be marked as a deliberate implementation decision. Flag uncertain measurements.
