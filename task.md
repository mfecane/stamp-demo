# Warp Functionality Implementation

## Goal
Implement warp/deformation functionality for stamps using a mesh-based lattice approach in UV space. Replace 2D canvas rendering with WebGL mesh rendering for real-time performance.

## Architecture Overview

### Rendering System
- **WebGL Mesh Rendering**: Replace `CanvasRenderer` with WebGL-based rendering
- **Lattice Mesh**: 10x10 `PlaneGeometry` in UV space (0-1 range)
- **Render Target**: Use `WebGLRenderTarget` to render lattice mesh to texture
- **Source Image**: Applied as texture to the lattice mesh
- **Real-time Updates**: Render deformed mesh to texture with minimal lag

### Lattice System
- Create a **10x10 lattice mesh** (`PlaneGeometry` with 10x10 segments) in UV space
- Mesh vertices positioned in UV coordinate space (0-1 range)
- **Mesh size**: Covers entire stamp area in UV space (using `stampInfo.sizeX`/`sizeY` which are now in UV units)
- **Source image texture**: Fully covers the entire lattice mesh (uses [0,1] texture coordinates)
- **Mesh transformations**: The lattice mesh can be transformed as a whole (move, rotate, scale)
- **Vertex deformations**: Individual vertices can be deformed with the brush tool (in addition to mesh transformations)
- Vertex positions can be manipulated directly via `geometry.attributes.position`
- Vertices can overflow 0-1 bounds (pixels outside bounds are discarded, X-axis wrapping to be added later)
- **Stored in `stampStore`** alongside `stampInfo`
- **Original vertex positions stored** for reset functionality

### Transformations
The lattice mesh supports two types of transformations:

**Mesh-level transformations** (move, scale, rotate):
- Update `stampInfo` and regenerate/update the mesh as a whole
- **Move**: Update `stampInfo.uv`, regenerate mesh at new position
- **Scale**: Update `stampInfo.sizeX`/`sizeY` (in UV units), regenerate mesh with new size
- **Rotate**: Update `stampInfo.rotation`, regenerate mesh with new rotation

**Vertex-level deformations** (brush):
- Deform individual mesh vertices directly
- Mesh position/size/rotation remain unchanged during brush deformation
- Vertices are shifted along the brush direction vector

### StampInfo Changes
- **`stampInfo.sizeX` and `stampInfo.sizeY` are now in UV units** (0-1 range) instead of canvas pixels
- Default size: `0.4` (40% of UV space) instead of `canvas.width * 0.4` pixels
- This simplifies mesh creation as no conversion is needed

### Brush Tool
- Add a new **"Brush" tool** to the context menu
- The brush allows dragging to deform the lattice vertices interactively
- **Default influence radius: 0.1 UV units** (configurable)
- Smooth falloff function (Gaussian or smoothstep)

### Reset Functionality
- Store original lattice vertex positions at initialization
- Add **"Reset Lattice" button** to context menu
- Restore lattice to undeformed state

## Interaction Flow

1. **Mouse Down** (`mousedown`)
   - Initiate a deformation point
   - Store the starting position in screen space
   - Get intersection point and tangent vectors (uAxis, vAxis) at mousedown location

2. **Mouse Move** (`mousemove`)
   - Calculate **screen space direction vector** from previous to current mouse position
   - Transform screen space direction to **tangent space**:
     - Project screen direction onto uAxis and vAxis (projected to screen space)
     - This gives UV direction directly
   - Project current mouse position to **UV space** via raycast
   - For each lattice vertex near the brush point:
     - Calculate distance from brush point in UV space
     - Apply smooth falloff function (Gaussian or smoothstep)
     - Shift vertex along the UV direction vector
     - Vertices can overflow 0-1 bounds (clipping handled during rendering)

3. **Rendering**
   - Render deformed lattice mesh to `WebGLRenderTarget`
   - Copy render target to canvas texture
   - Update tube mesh material texture
   - Real-time updates during brush drag

## Technical Details

### Coordinate Transformations
- **Screen Space → Tangent Space → UV Space**:
  1. Screen space: Mouse movement direction in pixel coordinates
  2. Tangent space: Project onto uAxis/vAxis (projected to screen)
  3. UV space: Direct mapping from tangent space coordinates

### Lattice Mesh
- `PlaneGeometry(1, 1, 10, 10)` - 10x10 grid in UV space
- Vertices positioned in [0,1] x [0,1] UV coordinate space
- Access via `geometry.attributes.position`
- Update with `positions.needsUpdate = true`
- **Mesh size**: Uses `stampInfo.sizeX` and `stampInfo.sizeY` directly (now in UV units, e.g., 0.4 = 40% of UV space)
- **Mesh position**: Centered at `stampInfo.uv` in UV space
- **Source image texture**: Uses [0,1] UV coordinates to fully cover the lattice mesh

### Render Target Setup
- `WebGLRenderTarget` matching canvas size (1024x1024)
- Orthographic camera viewing [0,1] x [0,1] UV range
- Separate scene for rendering lattice to texture
- Source image loaded as `THREE.Texture` and applied to lattice mesh
- **Texture application**: Use `WebGLRenderTarget.texture` directly and apply it to tube mesh material
- **Rendering trigger**: Render every frame if mesh changed (check if vertices or stampInfo updated)

### Performance
- Real-time rendering to texture
- Optimize if needed: throttle updates, lower resolution during drag, etc.
- Use `requestAnimationFrame` for smooth updates

### Clipping & Wrapping
- Vertices can overflow 0-1 UV bounds
- Pixels outside bounds are discarded during rendering
- X-axis wrapping to be implemented later

## Expected Result

This implementation will enable users to:
- Select the brush tool from the context menu
- Click and drag on the stamp to create smooth deformations
- See the image warp in real-time as they drag
- Create artistic effects by manipulating the lattice control points
- Reset the lattice to its original undeformed state
- All stamp operations (move, scale, rotate) work with the lattice mesh system
