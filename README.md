# Honeycomb Curtain Card

A Lovelace custom card to control a two-motor honeycomb curtain (top and bottom rails) in Home Assistant.

## Features
- Displays a stylized honeycomb curtain in hazel taupe with black top box and black bottom rail.
- Shows current position of both motors and a visual status of the curtain.
- Tap the image to move the nearest rail.
- Buttons to fully open, stop, or fully close the curtain.

## Installation (HACS)
1. Add this repository to HACS as a **Custom Repository** (type: **Lovelace**).
2. Install **Honeycomb Curtain Card**.
3. Add the resource:

```yaml
resources:
  - url: /hacsfiles/honeycomb-curtain-card/honeycomb-curtain-card.js
    type: module
```

## Usage
```yaml
type: custom:honeycomb-curtain-card
name: Honeycomb Gordijn
cover_top: cover.bovenste_motor
cover_bottom: cover.onderste_motor
```

## Options
- `name` (optional): Title shown above the card.
- `cover_top` (required): Entity id of the top motor cover.
- `cover_bottom` (required): Entity id of the bottom motor cover.
- `tap_action` (optional): Which rail to move when tapping the image.
  - `nearest` (default): Move the closest rail to the tap position.
  - `top`: Always move the top rail.
  - `bottom`: Always move the bottom rail.

## Behavior
- **Open** button sets: top motor to 0%, bottom motor to 100%.
- **Stop** button sends `stop_cover` to both motors.
- **Close** button sets: top motor to 0%, bottom motor to 0%.

## Notes
- Home Assistant uses positions from `0` to `100`. This card assumes:
  - Top motor: `0 = fully up`, `100 = fully down`.
  - Bottom motor: `0 = fully down`, `100 = fully up`.

If your device reports differently, please let me know and I can add an inversion option.
