# 3D Image Stamping Editor

A React-based 3D image stamping application built with Three.js. Select a pre-loaded image and place it on a 3D tube mesh with interactive resizing, manipulation, and context menu controls.

## Live Demo

**https://mfecane.github.io/stamp-demo/**

## Features

### Core Functionality
- **Image Selection**: Click on the pre-loaded image in the GUI panel to activate stamp placement
- **3D Placement**: Click on the tube mesh to place stamps at precise UV coordinates
- **Interactive Widgets**: Visual widgets with X and Y axes for resizing, aligned with image orientation in 3D space
- **Context Menu**: Right-click or select stamps to access actions (delete, maximize, etc.)

### Interaction Modes
The application automatically switches between interaction modes based on what you click:

- **Resize Mode**: Click and drag widget axis colliders to resize stamps along X or Y axis
- **Orbit Mode**: Click and drag on empty space to orbit the camera around the scene
- **Selection Mode**: Click on stamps to select them and show the context menu
- **Drag Mode**: Move stamps on the surface (when implemented)

### Advanced Features
- **Hover States**: Visual feedback when hovering over interactive elements
- **Hit Testing**: Priority-based raycasting (resize handles → widget body → image handle → mesh)
- **Canvas-Based Textures**: Dynamic texture updates using HTML5 Canvas
- **Camera Controls**: Smooth camera manipulation with automatic matrix updates

## Tech Stack

- **React 18** - UI framework
- **Three.js** - 3D rendering and scene management
- **TypeScript** - Type safety
- **Zustand** - State management (composed stores pattern)
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── GuiPanel.tsx           # Main UI panel for image selection
│   ├── ThreeScene.tsx         # Three.js scene setup and rendering
│   ├── StampContextMenu.tsx   # Context menu for stamp actions
│   └── ui/                    # Reusable UI components (shadcn/ui)
├── interaction/         # Interaction system
│   ├── InteractionManager.ts  # Main interaction coordinator
│   ├── Tool.ts                # Base tool interface
│   ├── ToolFactory.ts         # Factory for creating tools
│   ├── hitTesting.ts          # Raycasting and hit detection
│   ├── HoverStateManager.ts   # Manages hover states
│   ├── utils/                 # Interaction utilities
│   │   ├── cameraUpdates.ts   # Camera matrix updates
│   │   ├── eventNormalization.ts
│   │   └── mousePosition.ts
│   └── tools/                 # Tool implementations
│       ├── DragTool.ts
│       ├── OrbitTool.ts
│       ├── ResizeTool.ts
│       ├── SelectionTool.ts
│       └── constants.ts
├── lib/                # Utilities and helpers
│   ├── geometries.ts   # Custom Three.js geometries
│   ├── utils.ts        # General utilities (worldToScreen, etc.)
│   ├── widget.ts       # Widget rendering and hit testing
│   └── handle.ts       # Handle rendering utilities
├── services/           # Service classes
│   ├── CanvasRenderer.ts      # Canvas-based texture rendering
│   └── SceneInitializer.ts    # Scene setup and initialization
├── store/              # State management (Zustand)
│   ├── composedStore.ts       # Composed store aggregator
│   ├── editorStore.ts         # Main editor store (composed)
│   ├── sceneStore.ts          # Scene state (camera, renderer, etc.)
│   ├── stampStore.ts          # Stamp state and operations
│   ├── textureStore.ts        # Texture and canvas state
│   └── widgetStore.ts         # Widget state and creation
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Usage

### Basic Workflow

1. **Activate Stamp Placement**: 
   - Click on the stamp image in the GUI panel
   - The image will be activated and ready for placement

2. **Place a Stamp**: 
   - Once an image is loaded, click anywhere on the tube mesh
   - The stamp will be placed at the clicked location using UV coordinates
   - A widget will appear at the placement point

3. **Resize a Stamp**: 
   - Click and drag the widget axis handles (X or Y) to resize
   - The stamp will resize proportionally along the selected axis

4. **Select a Stamp**: 
   - Click on a placed stamp to select it
   - A context menu will appear with available actions

5. **Navigate the Scene**: 
   - Click and drag on empty space to orbit the camera
   - Use mouse wheel to zoom (if implemented)

### Context Menu Actions

When a stamp is selected, you can:
- **Delete**: Remove the stamp from the scene
- **Maximize**: Expand the stamp to full size (when implemented)
- **Close**: Deselect the stamp

## Architecture

### State Management

The application uses a **composed store pattern** with Zustand:
- Individual stores for different concerns (scene, stamp, texture, widget)
- `composedStore.ts` aggregates all stores into a single `useEditorStore` hook
- Stores are organized by domain for better maintainability

### Interaction System

The interaction system uses a **tool-based architecture**:
- `InteractionManager` coordinates all interactions
- Tools are created dynamically via `ToolFactory` based on hit test results
- Each tool implements the `Tool` interface with `onPointerDown`, `onPointerMove`, `onPointerUp`
- Tools automatically activate/deactivate based on user actions

### Hit Testing Priority

Hit tests are performed in this order:
1. Resize handles (widget axis colliders)
2. Widget body
3. Image handle (stamp selection)
4. Selectable objects (tube mesh)
5. Empty space

### Texture System

- Uses HTML5 Canvas for dynamic texture updates
- UV coordinates are calculated from raycast intersections
- Canvas is updated when stamps are placed, moved, or resized
- Texture is applied to the tube mesh material

## Development Notes

### Key Technical Details

- **Canvas-Based Textures**: The application uses a canvas-based texture system for stamp placement, allowing dynamic updates without recreating textures
- **UV Coordinate Calculation**: UV coordinates are calculated from raycast intersections with the tube mesh
- **Widget Colliders**: Widget colliders are larger than visual elements for easier interaction and better UX
- **Camera Matrix Updates**: Camera matrix is updated before hit testing to ensure accurate raycasting after orbit controls
- **Event Normalization**: Pointer events are normalized to work consistently across different input devices

### Code Quality Standards

- **No Defensive Programming**: Errors propagate to reveal real problems
- **Component Simplicity**: Components are kept simple and focused, with logic extracted to hooks
- **No Provisional Code**: Only fully functional features are implemented

## Deployment

See [docs/deploy.md](docs/deploy.md) for detailed deployment instructions to GitHub Pages.

## License

Private project

