# 3D Image Stamping Editor

A React-based 3D image stamping application built with Three.js. Upload images and place them on a 3D tube mesh with interactive resizing and manipulation tools.

## Features

- **Image Upload**: Upload images via the GUI panel
- **3D Placement**: Click on the tube mesh to place stamps at UV coordinates
- **Interactive Widgets**: Visual widgets with X and Y axes for resizing
- **Multiple Interaction Modes**:
  - **Resize Mode**: Click and drag widget axis colliders to resize stamps
  - **Orbit Mode**: Click and drag elsewhere to orbit the camera
  - **Selection Mode**: Select and manipulate placed stamps
  - **Drag Mode**: Move stamps on the surface

## Tech Stack

- **React 18** - UI framework
- **Three.js** - 3D rendering and scene management
- **TypeScript** - Type safety
- **Zustand** - State management
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling

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

## Project Structure

```
src/
├── components/          # React components
│   ├── GuiPanel.tsx    # Main UI panel for image upload
│   ├── ThreeScene.tsx  # Three.js scene setup and rendering
│   └── ui/             # Reusable UI components (shadcn/ui)
├── interaction/         # Interaction system
│   ├── InteractionManager.ts  # Main interaction coordinator
│   ├── Tool.ts         # Base tool interface
│   ├── hitTesting.ts   # Raycasting and hit detection
│   └── tools/          # Tool implementations
│       ├── DragTool.ts
│       ├── OrbitTool.ts
│       ├── ResizeTool.ts
│       └── SelectionTool.ts
├── lib/                # Utilities and helpers
│   ├── geometries.ts   # Custom Three.js geometries
│   ├── utils.ts        # General utilities
│   └── widget.ts       # Widget rendering and hit testing
├── services/           # Service classes
│   ├── CanvasRenderer.ts
│   └── SceneInitializer.ts
├── store/              # State management
│   ├── composedStore.ts
│   ├── editorStore.ts  # Main Zustand store
│   ├── sceneStore.ts
│   ├── stampStore.ts
│   ├── textureStore.ts
│   └── widgetStore.ts
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Usage

1. **Upload an Image**: Use the GUI panel to select and upload an image
2. **Place a Stamp**: Once an image is loaded, click anywhere on the tube mesh to place it
3. **Resize**: Click and drag the widget axis handles to resize the stamp
4. **Navigate**: Click and drag on empty space to orbit the camera around the scene

## Development Notes

- The application uses a canvas-based texture system for stamp placement
- UV coordinates are calculated from raycast intersections with the tube mesh
- Widget colliders are larger than visual elements for easier interaction
- The interaction system supports multiple tools that can be switched dynamically

## License

Private project

