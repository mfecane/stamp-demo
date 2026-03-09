# 3D Tattoo Editor Demo

A real-time 3D tattoo placement and shaping demo built with React, TypeScript, and Three.js.

This project demonstrates a production-style editing workflow:
- drag and drop tattoo references directly onto a 3D arm model,
- project them into UV space,
- transform or warp them with in-scene tools,
- and iterate safely with command-based undo/redo.

All 3D modeling and all default tattoo images in this project were created by me as a modeller and tattoo artist.

Instagram: **[@mfecanics](https://instagram.com/mfecanics)**

## Live Demo

[https://mfecane.github.io/tattoo-editor-demo/](https://mfecane.github.io/tattoo-editor-demo/)

## Why This Project Is Interesting

Most "image on mesh" demos stop at simple decal placement. This editor goes further:
- **Full editing loop** from image import to final texture preview.
- **Projection strategies** for both free-form stamps and sleeve-style cylindrical layouts.
- **In-scene manipulation UI** (move/scale/rotate/warp) without leaving the viewport.
- **Command-driven history** that keeps editing operations deterministic and reversible.
- **React + Three.js bridge** that keeps UI responsive while runtime rendering remains centralized.

## Feature Highlights

- **Project image workflow**
  - Built-in starter tattoo images.
  - Upload your own files (multiple at once).
  - Drag assets from the side panel into the 3D viewport.

- **3D placement pipeline**
  - Hit-test on the arm mesh with raycasting.
  - Convert click/drop intersections to UV coordinates.
  - Prompt projection type on placement.

- **Projection modes**
  - `Stamp`: unrestricted move/resize/rotate behavior.
  - `Cylindrical Lattice`: sleeve-oriented behavior with constrained transforms (full-width X, no rotation).

- **Stamp editing tools**
  - Select, Move, Resize, Rotate.
  - Brush-based lattice warping with adjustable size and strength.
  - Delete, reorder, and reselect stamps from the side strip.

- **Visual controls and inspection**
  - Toggle widget visibility.
  - Rotate scene lighting in real time.
  - Open a texture overlay to inspect rendered texture-space output.

- **Editing safety**
  - Undo/redo backed by command objects.
  - History state reflected in the header UI.

## End-to-End User Flow

1. Pick or upload a tattoo image in `Project Images`.
2. Drag the image onto the model surface.
3. Choose `Stamp` or `Cylindrical Lattice` projection.
4. Refine with move/resize/rotate or brush warp.
5. Reorder or delete stamps as needed.
6. Use undo/redo to compare alternatives.
7. Verify final result in the viewport and texture overlay.

## Technical Architecture

The editor is organized into clear layers so rendering, interaction, and UI remain decoupled.

- **UI layer (`src/editor/components`)**
  - Panels, context menus, overlays, and controls.
  - Drag-and-drop orchestration via `@dnd-kit`.

- **Runtime core (`src/editor/main`)**
  - `Editor` bootstraps Three.js scenes, camera, controls, renderer, composer, and resize handling.
  - `EditorController` coordinates active tools, selection, placement, and stamp updates.
  - `HistoryController` executes undoable commands with bounded history stacks.

- **Command system (`src/editor/main/commands`)**
  - Add, update, reorder, remove, clear, and selection commands.
  - Single source of truth for reversible editor mutations.

- **Interaction system (`src/editor/interaction`)**
  - Pointer/canvas events routed through specialized handlers (select, move, rotate, resize, brush, orbit).
  - Clear separation between interaction intent and command execution.

- **Projection + deformation (`src/editor/lib/lattice`)**
  - Strategy-based projection rules (`StampProjectionStrategy`, `CylindricalLatticeStrategy`).
  - Lattice mesh transforms for local warping behavior.

- **Rendering services (`src/editor/services`)**
  - Texture compositing and render-target workflows.
  - Geometry projection, pointer math, and widget transform utilities.
  - Registered via DI container for explicit runtime wiring.

- **State bridge (`src/editor/store` + React bridge)**
  - Zustand store for React state.
  - React bridge exposes runtime actions/state snapshots to UI components.

## Stack

- React 18 + TypeScript
- Three.js (custom editor runtime + postprocessing)
- Zustand (state)
- `@dnd-kit` (drag and drop)
- Vite (build/dev tooling)
- Tailwind CSS + shadcn/ui primitives

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

### Build (Production)

```bash
npm run build
```

## Deployment

This repository is configured for GitHub Pages deployment.

- Runtime base path is resolved in `vite.config.ts` from `GITHUB_REPOSITORY`.
- Full deployment guide: `docs/deploy.md`
- Current live deployment: [https://mfecane.github.io/tattoo-editor-demo/](https://mfecane.github.io/tattoo-editor-demo/)

## Notes

- This is a client-side demo runtime (no backend persistence).
- `useEditorLoader` currently initializes project/design data in-memory for demo purposes.

## License

MIT. See `LICENSE.md`.

