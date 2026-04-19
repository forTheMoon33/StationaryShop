# Stationery Shop

A browser-based stationery game. You run a small stationery shop — design your own binders in the Workshop, then sell them.

Frontend only. No backend, no login, no persistence (yet).

---

## Running the project

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

> **npm cache issue on this machine:** if `npm install` fails with `EPERM`, use:
> ```bash
> npm install --cache /tmp/npm-cache
> ```

---

## Tech stack

| Layer | Library | Version |
|---|---|---|
| UI framework | React | 18.3 |
| Routing | React Router v6 | 6.26 |
| Bundler | Vite | 5.4 |
| 3D rendering | Three.js | 0.184 |
| Styling | CSS Modules | — |
| Fonts | Lora, Noto Serif SC | Google Fonts |

---

## Design tokens

| Token | Value | Used for |
|---|---|---|
| Background cream | `#F0E4CC` | Page background |
| Dark brown panel | `rgba(45, 25, 10, 0.88)` | Navbar, step bar |
| Accent gold | `#c9a87c` | Active states, highlights |
| Warm brown | `#8B6F47` | Buttons, selected states |
| Text light | `#f5e6c8` | Nav labels |
| Text muted | `#e8d5b0` | Secondary text |

---

## File structure

```
src/
├── App.jsx                          # Route definitions
├── main.jsx
├── index.css
│
├── pages/
│   ├── MainMenu/
│   │   ├── MainMenu.jsx             # Title screen with nav buttons
│   │   └── MainMenu.module.css
│   │
│   ├── Game/
│   │   ├── Game.jsx                 # Tab shell (Shop / Workshop / Online Chat)
│   │   ├── Game.module.css
│   │   └── tabs/
│   │       ├── Shop.jsx             # Placeholder
│   │       ├── Workshop.jsx         # Re-exports pages/Workshop
│   │       ├── OnlineChat.jsx       # Placeholder
│   │       └── Tab.module.css
│   │
│   └── Workshop/
│       ├── index.jsx                # Workshop page — state, layout, wiring
│       └── Workshop.module.css
│
└── components/
    └── Workshop/
        ├── BinderCanvas.jsx         # Three.js scene (binder model + live updates)
        ├── BinderCanvas.module.css
        ├── StepNav.jsx              # 7-step progress bar with glow ring
        ├── StepNav.module.css
        ├── OptionPanel.jsx          # Floating panel wrapper with step label
        ├── OptionPanel.module.css
        ├── ZonePanel.jsx            # Side panel zone list (steps 3 & 4)
        ├── ZonePanel.module.css
        └── steps/
            ├── Step1Size.jsx        # A7 / A6 / M5 size cards
            ├── Step2Zones.jsx       # Zone layout template picker
            ├── Step3Material.jsx    # Per-zone material selector
            ├── Step4Color.jsx       # Per-zone color picker (swatches + HSL wheel)
            ├── Step5Decoration.jsx  # Drag-and-drop decorations onto canvas
            ├── Step6Closure.jsx     # Closure type selector (strap / buckle / snap)
            ├── Step7Accessory.jsx   # Pen loop or none
            └── *.module.css
```

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `MainMenu` | Full-screen title screen |
| `/game` | `Game` | Tab-based game shell |
| `*` | redirect | Falls back to `/` |

The Workshop is accessed via the **Workshop** tab inside `/game`.

---

## Workshop module

A 7-step binder customisation designer. State lives in `pages/Workshop/index.jsx` and flows down as props. The Three.js scene in `BinderCanvas` receives `size` and `zones` as props and rebuilds geometry reactively.

### Step 1 — Size

Pick a binder size. Three cards showing proportional SVG previews with hole counts.

| Option | Dimensions | Holes |
|---|---|---|
| A7 | 105 × 77 mm | 6 |
| A6 | 148 × 105 mm | 6 |
| M5 | 128 × 80 mm | 5 |

Selecting a size immediately updates the Three.js binder model dimensions and ring count.

### Step 2 — Zones

Choose a zone layout template. Five presets divide the cover face into independently styleable regions:

- Full Cover (1 zone)
- Top / Bottom (2 zones, horizontal split)
- Left / Right (2 zones, vertical split)
- Three Rows (3 zones, horizontal thirds)
- Three Columns (3 zones, vertical thirds)

Zones are stored as `{ name, x, y, w, h }` in 0–1 fractional coordinates relative to the cover face, making them renderer-agnostic.

### Step 3 — Material

Side panel lists the confirmed zones. Select a zone, then pick its material. Each material has distinct `roughness` and `metalness` values applied to the Three.js `MeshStandardMaterial`.

| Material | 材质 | Character |
|---|---|---|
| Leather | 真皮 | Grainy texture, warm |
| Transparent PVC | 透明PVC | Glossy, slight transparency |
| Canvas | 帆布 | Matte, woven look |
| PU Leather | PU革 | Smooth, dark, highlight streak |

Next is enabled only when every zone has a material assigned.

### Step 4 — Color

Same side panel. Each zone gets an independent color via:

- **Preset swatches** — 20 warm/neutral/accent colors
- **HSL color wheel** — click or drag to pick hue + saturation; lightness slider below the wheel; cursor indicator follows the selection; switching zones syncs the wheel to that zone's existing color

Color and material combine live on the Three.js zone overlay meshes.

### Step 5 — Decoration

Drag decoration items from the palette onto the binder canvas:

- **Metal Flower** — 6-petal SVG flower, gold
- **Button** — round sewing button with 4 thread holes

Placed decorations are absolutely positioned overlays (HTML, not Three.js). They can be dragged to reposition using pointer capture. A hover ×-button removes individual items; "Clear all" removes all.

Decoration is optional — Next is always enabled.

### Step 6 — Closure

Choose one closure type from three categories:

| Category | Options |
|---|---|
| Strap | Thin Strap, Wide Strap |
| Buckle | Buckle A (rectangular frame), D-ring B |
| Snap | Round Metal Snap, Hidden Magnetic Snap |

Each option has a small SVG illustration of the mechanism. Selecting from one category clears any previous selection.

### Step 7 — Accessory

Final optional detail:

- **Pen Loop** — elastic loop on the spine
- **None** — keep it minimal

Confirm closes the wizard.

---

## State flow

```
Workshop/index.jsx
├── selectedSize  ──────────────────────► BinderCanvas (size prop)
├── zones ─────────────────────────────┐
├── zoneMaterials ──────────────────── ┼─► binderZones (useMemo) ──► BinderCanvas (zones prop)
├── zoneColors ─────────────────────── ┘
├── selectedZoneIndex ──────────────────► ZonePanel + Step3 + Step4
└── decorations ────────────────────────► DecorationOverlay (HTML overlays on canvasArea)
```

`binderZones` is a memoised derived array — `BinderCanvas` only rebuilds zone meshes when materials or colors actually change.

---

## Three.js scene

`BinderCanvas.jsx` owns the entire Three.js lifecycle.

**Geometry** (procedural, swappable for `.glb` later):

- Front cover — `BoxGeometry(coverW, h, 0.06)`
- Back cover — same, mirrored
- Spine — `BoxGeometry(spineW, h, 0.063)`
- Rings — `CylinderGeometry` rotated 90° on X so the circular face shows from front; 6 rings (A6/A7) or 5 rings (M5)
- Zone overlays — thin `BoxGeometry` slices placed just in front of the cover face, one per zone

**Lighting**: ambient (warm cream) + key directional with shadow map + cool fill + warm rim.

**Effects**: three `useEffect` hooks — mount (scene setup, runs once), size (rebuilds geometry), zones (rebuilds material overlays). Cleanup disposes all geometries and materials on unmount.
