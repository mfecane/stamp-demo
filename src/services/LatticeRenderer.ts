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
	 * Handles x-axis wrapping for cylinder-like surface rendering.
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

		// Calculate bounding box in world space (UV space)
		const box = new THREE.Box3().setFromObject(meshClone)
		const minX = box.min.x
		const maxX = box.max.x

		// Check if mesh intersects x-axis boundaries (0 or 1 in UV space)
		const needsLeftWrap = minX < 0
		const needsRightWrap = maxX > 1

		// Add original mesh clone to scene
		this.renderScene.clear()
		this.renderScene.add(meshClone)

		// Add wrapped copies if needed for cylinder-like wrapping
		const clonesToDispose: THREE.Mesh[] = [meshClone]

		if (needsLeftWrap) {
			// Mesh extends beyond left boundary (x < 0), add copy at x+1
			const leftWrapClone = meshClone.clone()
			leftWrapClone.position.x += 1
			leftWrapClone.updateMatrixWorld(true)
			this.renderScene.add(leftWrapClone)
			clonesToDispose.push(leftWrapClone)
		}

		if (needsRightWrap) {
			// Mesh extends beyond right boundary (x > 1), add copy at x-1
			const rightWrapClone = meshClone.clone()
			rightWrapClone.position.x -= 1
			rightWrapClone.updateMatrixWorld(true)
			this.renderScene.add(rightWrapClone)
			clonesToDispose.push(rightWrapClone)
		}

		// Update camera
		this.camera.updateMatrixWorld()

		// Render to target
		mainRenderer.setRenderTarget(this.renderTarget)
		mainRenderer.setClearColor(0xffffff, 1) // White background
		mainRenderer.clear()
		mainRenderer.render(this.renderScene, this.camera)
		mainRenderer.setRenderTarget(null) // Reset to default render target

		// Remove all clones from render scene and dispose
		this.renderScene.clear()
		for (const clone of clonesToDispose) {
			clone.geometry.dispose()
			if (Array.isArray(clone.material)) {
				clone.material.forEach((mat) => mat.dispose())
			} else {
				clone.material.dispose()
			}
		}

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
