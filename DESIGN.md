# Design System: Stripe-Inspired UI

Reference source:
https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/stripe/DESIGN.md

This repository now follows a Stripe-inspired visual system.

## 1. Visual Direction
- Bright, premium interface on a clean canvas.
- Core palette: white surfaces, deep navy typography, purple interactions.
- Depth through soft, blue-tinted multi-layer shadows.
- Radius style stays conservative (4px-8px), avoiding heavy pill shapes.

## 2. Color Tokens
- Primary purple: `#533afd`
- Purple hover: `#4434d4`
- Heading navy: `#061b31`
- Secondary text: `#273951`
- Muted text: `#64748d`
- Border default: `#e5edf5`
- Border accent: `#d6d9fc`
- Page background: `#f6f9fc`
- Surface background: `#ffffff`

## 3. Typography
- Display and body: light-to-regular weights (300-500), no heavy/bold visual tone.
- Monospace labels for technical markers via `Source Code Pro`.
- Tight heading tracking for a precise, fintech feel.

## 4. Components
- Buttons: rectangular (`rounded-md`) with purple primary action.
- Inputs/selects/textarea: white surfaces with subtle borders and purple focus.
- Cards/panels: white surfaces, subtle border, blue-tinted elevation shadow.
- Badges: soft tinted backgrounds with compact rectangular shape.
- Data/table UI: dense but readable text on bright surfaces.

## 5. Layout Rules
- Keep spacing measured and consistent (8px base rhythm).
- Favor clear section hierarchy over decorative density.
- Use shadows sparingly and consistently across elevated surfaces.

## 6. Guardrails
- Do not reintroduce dark-mode-only styling as the default theme.
- Do not use high-radius pill buttons for standard actions.
- Do not use black text; prefer the project heading/body token scale.
- Do not change business logic when applying design updates.
