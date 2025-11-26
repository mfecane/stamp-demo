import * as THREE from 'three'

/**
 * WebGL-based renderer for lattice mesh to texture.
 * Replaces CanvasRenderer for stamp rendering.
 */
export class LatticeRenderer {
	public renderTarget: THREE.WebGLRenderTarget // Make public for debug access
	private renderScene: THREE.Scene
	private camera: THREE.OrthographicCamera

	constructor(canvasSize: number = 1024) {
		// Create render target matching canvas size
		this.renderTarget = new THREE.WebGLRenderTarget(canvasSize, canvasSize, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
		})

		// Create separate scene for rendering lattice to texture
		this.renderScene = new THREE.Scene()
		this.renderScene.background = new THREE.Color(0xffffff) // White background

		// Create orthographic camera for UV space [0,1] x [0,1]
		// OrthographicCamera(left, right, top, bottom, near, far)
		// left=0, right=1: X goes from 0 to 1 (left to right)
		// top=1, bottom=0: Y goes from 1 to 0 (top to bottom in screen space, but Y increases upward in world space)
		// Camera at z=1 looking down -Z axis at z=0 plane
		this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000)
		this.camera.position.set(0, 0, 1) // Center of UV space, at z=1
		this.camera.lookAt(0, 0, 0) // Look at center of UV space, at z=0
		this.camera.updateProjectionMatrix()
		this.camera.updateMatrixWorld()
	}

	/**
	 * Renders the lattice mesh to the render target texture.
	 * Returns the texture that can be applied to the tube mesh.
	 */
	renderLatticeToTexture(
		latticeMesh: THREE.Mesh | null,
		mainRenderer: THREE.WebGLRenderer
	): THREE.Texture {
		if (!latticeMesh) {
			return this.getWhiteTexture()
		}

		// Clone mesh to avoid modifying original
		const meshClone = latticeMesh.clone()
		meshClone.updateMatrixWorld(true)
		
		// Add mesh clone to scene
		this.renderScene.clear()
		this.renderScene.add(meshClone)

		// Update camera
		this.camera.updateMatrixWorld()

		// Render to target
		mainRenderer.setRenderTarget(this.renderTarget)
		mainRenderer.setClearColor(0xffffff, 1) // White background
		mainRenderer.clear()
		mainRenderer.render(this.renderScene, this.camera)
		mainRenderer.setRenderTarget(null) // Reset to default render target

		// Remove mesh clone from render scene (keep debug plane)
		this.renderScene.remove(meshClone)

		// Return the render target texture
		return this.renderTarget.texture
	}

	/**
	 * Updates the render target size if canvas size changes.
	 */
	setSize(width: number, height: number): void {
		this.renderTarget.setSize(width, height)
		this.camera.updateProjectionMatrix()
	}

	/**
	 * Disposes of resources.
	 */
	dispose(): void {
		this.renderTarget.dispose()
		this.renderScene.clear()
	}

	/**
	 * Returns a white texture (fallback when no lattice mesh).
	 */
	private getWhiteTexture(): THREE.Texture {
		const canvas = document.createElement('canvas')
		canvas.width = 1
		canvas.height = 1
		const ctx = canvas.getContext('2d')!
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, 1, 1)
		return new THREE.CanvasTexture(canvas)
	}
}
