# Miko extended movement package

Builds on `miko-good-front-back-package` by adding the three animations that the
earlier manual-patch attempts failed on: `idle` (blink), `walk-left`, and
`walk-right`. Total: 5 states × 3 frames = 15 transparent 192x208 sprites.

## What is in here

- `frames/<state>/01-03.png` — transparent 192x208 PNG frames, bottom-aligned.
- `gifs/miko_<state>.gif` — transparent looping GIFs at 192x208.
- `previews/miko_<state>_preview.gif` — same loops on a dark purple background.
- `previews/miko_all_states_preview.gif` — one combined cycle: idle → walk-front → walk-back → walk-left → walk-right.
- `contact_sheet.png` — 3-column × 5-row grid of every frame, purple background.
- `manifest.json` — file listing + generation metadata.

Carried over verbatim from the previous package:
- `walk-front`, `walk-back` — they were already accepted as good and stayed
  faithful to the source reference sheet.

Newly added in this package:
- `idle` — eyes open / eyes closed / eyes open (3-frame blink loop, with the
  middle frame held briefly so the eyes feel like a blink, not a stare).
- `walk-left`, `walk-right` — side-profile walk cycles with visibly alternating
  feet.

## How the new states were generated

The earlier manual repairs for idle and side-walk failed because they patched
individual eye or shoe pixels onto compressed 192x208 frames. The original
methodology recommends generating a complete strip from scratch when a missing
action is needed. This package follows that:

1. Provider: `nanobanana` (147ai bridge), model `gpt-image-2-high`, aspect
   ratio `21:9`, source character image passed as `--ref` to lock identity.
2. One full 3-frame row strip per state, generated against a flat green chroma
   key, with prompts written to require:
   - exactly 3 evenly spaced full-body poses
   - chroma-key-clean background, no shadows / motion lines / dust
   - visible alternating feet for the two side-walks
   - eyes-open / eyes-closed-dash / eyes-open for idle
3. The generated strips live at `../gen-output/miko-{idle,walk-left,walk-right}-strip*.png`.

## How the strips were processed

`extract_frames.py` does all the deterministic work:

- Split each strip into N equal-width slices (3 in every case).
- Auto-detect the actual chroma key from corner samples — the model never
  outputs perfect `#00FF00`; the real keys we saw were around `(4-22, 225-238, 14-29)`.
- Two-band chroma removal:
  - Squared-distance ≤ 3500 + green-dominant → fully transparent.
  - 3500–9000 + still green-dominant → partial alpha with edge despill.
  - Elsewhere green-tinted pixels get a milder despill to neutralize spill on
    pink hair, white outfit, and brown prop.
- Connected-component cleanup: drop isolated tiny alpha components
  (the rare loose pixel left from chroma noise on the prop edge).
- Trim to non-transparent bounding box, then fit into the 192x208 cell with
  bottom-aligned vertical centering and an 8 px horizontal / 6 px vertical
  safe margin. Never upscale.

`build_gifs.py` composes both the transparent GIF and the purple-preview GIF
for each state. Timings:
- `idle` durations `[2000, 150, 2000]` ms — long hold on eyes open, quick
  blink, long hold on eyes open.
- `walk-left`, `walk-right` durations `[180, 180, 180]` ms — matches the
  cadence of the already-accepted walk-front / walk-back GIFs from the
  original package.

`build_extras.py` builds the contact sheet and the combined-all-states preview.

## What worked

- Generating full row strips instead of patching individual frames preserved
  pixel style, palette, and identity across the cycle.
- Passing the original character art as the `--ref` to `gpt-image-2-high` kept
  hair color, fox ears, hair ornaments, outfit, and prop consistent.
- Auto-sampling the chroma key from corner pixels handled the fact that the
  model never returns pixel-perfect `#00FF00`; the real key is around
  `(15, 230, 25)` with variation between strips.
- Tiny-component cleanup removed a stray brown speck near walk-right frame 2
  without touching the main sprite.

## What did not work the first time

- The first `idle` prompt phrased the blink as "eyes fully closed" — the
  provider returned a fully black image (likely a content filter or model
  refusal; nanobanana bills failure too, so this counted). Re-prompting with
  "two short flat dashes (closed-eye sprite-style content look)" produced a
  clean blink frame on the second try. Prompt v1 is at
  `../gen-prompts/idle.txt`, v2 at `../gen-prompts/idle-v2.txt`.

## What still belongs to the source reference

The two carried-over states (`walk-front`, `walk-back`) were extracted directly
from a source reference sheet, not regenerated. That choice from the original
methodology still holds: when the reference already contains the action,
extraction beats regeneration.
