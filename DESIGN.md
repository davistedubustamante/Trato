# Design System — Trato

## Mood

Night curb under sea-glass street light — decisive, mineral teal, fair deal.

## Color strategy

Restrained product. Brand lives in primary teal + coral CTA; surfaces stay clean for outdoor legibility.

## Palette (OKLCH)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `oklch(1 0 0)` | App background |
| `--surface` | `oklch(0.985 0.008 170)` | Sheets, panels |
| `--ink` | `oklch(0.22 0.02 170)` | Body text |
| `--muted` | `oklch(0.45 0.02 170)` | Secondary |
| `--line` | `oklch(0.90 0.015 170)` | Dividers |
| `--primary` | `oklch(0.42 0.09 170)` | Brand, map pin, links |
| `--primary-soft` | `oklch(0.94 0.03 170)` | Selected chips |
| `--accent` | `oklch(0.58 0.14 35)` | Primary CTA / accept bid |
| `--danger` | `oklch(0.52 0.18 25)` | Cancel / SOS |
| `--ok` | `oklch(0.55 0.12 150)` | Online / success |
| `--map-dim` | `oklch(0.28 0.02 230)` | Map chrome contrast |

## Typography

- Family: **Figtree** (Google), weights 500–800.
- Scale (rem): 12 / 14 / 16 / 20 / 28 / 36.
- UI labels: 14 medium. Fare numbers: 28–36 extrabold tabular.

## Layout

- Max app shell: 480px centered on desktop (mobile-first phone frame).
- Bottom sheet ~42–58vh over full-bleed map.
- Safe-area insets respected (`env(safe-area-inset-*)`).

## Motion

- Sheet rise 200ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- Bid list stagger 40ms.
- Live pulse on driver marker 1.6s ease-out (disabled if reduced motion).

## Components

- Primary button: accent fill, 48px height, 14px radius.
- Fare stepper: − / amount / +.
- Bid row: amount + ETA + trust, tap to accept.
- No cards in hero/map; cards only for interactive bid rows.
