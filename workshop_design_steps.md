# Workshop Module — Step 2 & 3 Redesign

## Overview

Replace the current zone/material/color steps with a new flat design tool approach for Step 2 (Exterior Design) and Step 3 (Interior Design). These steps work like a lightweight vector design tool layered over the binder preview.

---

## Binder Face Structure

A binder has 4 designable faces:

**Exterior (Step 2):**
- Exterior Right Page — the front cover, visible when closed
- Exterior Left Page — the back cover, visible when closed
- Spine Exterior — the outer spine strip

**Interior (Step 3):**
- Interior Right Page — inside front cover, visible when open
- Interior Left Page — inside back cover, visible when open
- Spine Interior — inner spine strip

In Step 2, the Three.js preview shows the binder **closed**, rotating so the user can see all exterior faces. In Step 3, the Three.js preview shows the binder **open flat**, so the user can see all interior faces.

---

## Step 2 — Exterior Design / Step 3 — Interior Design

Both steps share the same UI and tool logic. Only the target faces differ.

### Layout

- **Center**: Three.js canvas showing the binder (closed for Step 2, open for Step 3)
- **Left sidebar**: face selector tabs (e.g. "Front", "Back", "Spine") — clicking switches which face is being edited
- **Bottom floating panel**: design tools

### Face Selector (left sidebar)

Show 3 tabs for the current step's faces. The active face is highlighted. Switching tabs updates which face the canvas highlights and which face the design tool writes to.

### Design Tool (bottom panel)

This is a 2D canvas overlay rendered on top of the active binder face in the Three.js scene. It works like a simple vector design tool.

**Shape tools:**
- Rectangle
- Circle
- Heart
- Star

**Shape properties (shown when a shape is selected):**
- Fill color (color swatch picker)
- Fill texture/pattern: solid / leather grain / canvas weave / PVC gloss
- Border style: none / solid / dashed / dotted
- Border color
- Border thickness (thin / medium / thick)

**Canvas interactions:**
- Click a shape tool → click on the face canvas to place it
- Drag placed shapes to reposition
- Drag corner handles to resize
- Shapes have z-order (can be sent forward/backward)
- Delete selected shape

**Layer panel (optional, inside bottom panel):**
- List of placed shapes on the current face
- Click to select, drag to reorder z-index

### Data Model

Each face stores an array of shape objects:

```js
{
  faceId: 'exterior-right', // or 'exterior-left', 'spine-exterior', etc.
  shapes: [
    {
      id: 'shape-1',
      type: 'rectangle', // rectangle | circle | heart | star
      x: 0.1,           // position as fraction of face width (0-1)
      y: 0.2,           // position as fraction of face height (0-1)
      w: 0.5,           // width as fraction of face width
      h: 0.3,           // height as fraction of face height
      fill: '#c07850',
      fillPattern: 'solid', // solid | leather | canvas | pvc
      borderStyle: 'none',  // none | solid | dashed | dotted
      borderColor: '#5a3a20',
      borderWidth: 1,        // 1 | 2 | 3
      zIndex: 0
    }
  ]
}
```

### Three.js Integration

- The 2D design canvas overlay is an HTML canvas element positioned absolutely over the Three.js canvas
- When shapes are placed/edited, re-render this 2D canvas and apply it as a texture to the corresponding Three.js face mesh using `THREE.CanvasTexture`
- The texture updates in real time as the user edits shapes

---

## Implementation Notes

- Each face's shape array is stored in a shared design state (e.g. React context or top-level state in Workshop index)
- Step 2 and Step 3 use the same `<DesignCanvas>` component, just passed different `faceId` targets
- The Three.js binder model must have separate mesh materials for each of the 6 faces so textures can be applied independently
- Keep the size config from Step 1 (A7/A6/M5) as the source of truth for face proportions

---

## File Structure Changes

```
src/components/Workshop/
  DesignCanvas.jsx        ← new: 2D shape tool overlay
  DesignCanvas.module.css
  FaceSelector.jsx        ← new: left sidebar face tabs
  FaceSelector.module.css
  steps/
    Step2ExteriorDesign.jsx   ← replaces old Step2Zones + Step3Material + Step4Color
    Step3InteriorDesign.jsx   ← replaces old Step3/4 for interior
```

Old files that can be removed or emptied:
- Step2Zones.jsx
- Step3Material.jsx
- Step4Color.jsx
- ZonePanel.jsx