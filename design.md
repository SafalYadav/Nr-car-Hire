# NR Car Hire — Design System

## Design Direction

Luxury automotive minimalism.

The website should feel:

- Premium
- Modern
- Trustworthy
- Professional
- Automotive
- Clean
- Fast

It must not look cheap, cluttered, cartoonish, overly futuristic or like a generic AI template.

## Colour Palette

```text
Midnight       #0B0D10
Deep Charcoal  #15181D
Graphite       #1E2228
White          #FFFFFF
Cool Gray      #A7ADB7
Light BG       #F5F6F7
Light Surface  #FFFFFF
Premium Gold   #C9A45C
Success        #22C55E
Warning        #F59E0B
Error          #EF4444
Information    #3B82F6
```

Gold is an accent, not the dominant colour.

## Typography

Primary:
`Inter`

Display:
`Manrope`

Maximum recommended font families: 2.

### Display

64–80px desktop, 42–52px mobile, weight 700–800.

### H1

48–64px desktop, 36–44px mobile.

### H2

36–48px.

### H3

24–32px.

### Body

16px, line-height 1.5–1.6.

## Spacing

Use a consistent scale:

```text
4
8
12
16
24
32
48
64
80
96
128
```

## Radius

```text
8px   small
12px  standard
16–20px premium cards
999px pills
```

## UI

Buttons should be at least 44–48px high.

Vehicle cards should clearly show:

- Image
- Make/model
- Category
- Specs
- Price
- Availability
- CTA

## Hero

Hero must quickly communicate:

- What NR Car Hire does
- Why customers should trust it
- What action to take

Primary actions:

- Book Now
- Explore Fleet
- Check Availability

## Motion

Use Framer Motion for meaningful interactions:

- Hero reveals
- Section reveals
- Card interactions
- Booking transitions
- Modals
- Success states

Micro-interactions: approximately 150–250ms.
Larger transitions: approximately 300–600ms.

Respect `prefers-reduced-motion`.

## Accessibility

Target WCAG 2.1 AA principles where practical.

Support:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Labels
- Accessible buttons
- Contrast
- Alt text
- Reduced motion
- Touch-friendly controls

## Responsive

Mobile-first.

The booking flow has highest mobile priority.

## Premium Rule

Premium does NOT mean:

- More gradients
- More animations
- More colours
- More shadows
- More effects

Premium means:

- Better typography
- Better spacing
- Better imagery
- Better hierarchy
- Better interaction
- Better consistency
- Better performance
