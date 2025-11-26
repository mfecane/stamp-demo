import * as THREE from 'three'

/**
 * Creates a 10x10 lattice mesh in UV space for warp deformation.
 * The mesh is positioned and scaled based on stampInfo.
 */
export function createLatticeMesh(
	stampInfo: {
		uv: THREE.Vector2
		sizeX: number // UV units (0-1 range)
		sizeY: number // UV units (0-1 range)
		rotation: number
	},
	sourceImage: HTMLImageElement
): THREE.Mesh {
	// Create 10x10 plane geometry
	// PlaneGeometry(width, height, widthSegments, heightSegments)
	// Default: centered at origin, spans from -width/2 to width/2 in X, -height/2 to height/2 in Y
	// Faces +Z by default
	const geometry = new THREE.PlaneGeometry(1, 1, 10, 10)
	
	// Create texture from source image
	const texture = new THREE.Texture(sourceImage)
	texture.needsUpdate = true
	texture.wrapS = THREE.ClampToEdgeWrapping
	texture.wrapT = THREE.ClampToEdgeWrapping
	texture.flipY = false // Flip texture V coordinate
	
	// Create material with source image texture
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide,
	})
	
	// Create mesh
	const mesh = new THREE.Mesh(geometry, material)
	
	// PlaneGeometry is centered at origin, so it spans from -0.5 to 0.5 in both X and Y
	// We need to position it so it's in the [0,1] x [0,1] UV space
	// Canvas renderer: centerX = uv.x * canvas.width, centerY = (1 - uv.y) * canvas.height
	// In UV space [0,1]: position center at (uv.x, uv.y) - invert V
	const centerU = stampInfo.uv.x
	const centerV = stampInfo.uv.y
	
	// Position mesh center at UV coordinates
	// Since PlaneGeometry is centered at origin, positioning at (centerU, centerV) puts the center there
	mesh.position.set(centerU, centerV, 0)
	
	// Scale mesh to stamp size (sizeX and sizeY are in UV units, e.g., 0.4 = 40% of UV space)
	// After scaling, mesh spans from (centerU - sizeX/2, centerV - sizeY/2) to (centerU + sizeX/2, centerV + sizeY/2)
	mesh.scale.set(stampInfo.sizeX, stampInfo.sizeY, 1)
	
	// Rotate mesh around Z axis (in UV plane)
	mesh.rotation.z = stampInfo.rotation
	
	// Rotate mesh to face camera
	// PlaneGeometry faces +Z by default, camera at z=1 looks down -Z
	// Need to rotate 180 degrees around X to face -Z (toward camera)
	mesh.rotation.x = Math.PI
	
	// Store original positions for reset functionality
	const positions = geometry.attributes.position
	const originalPositions = new Float32Array(positions.array.length)
	originalPositions.set(positions.array)
	geometry.userData.originalPositions = originalPositions
	
	return mesh
}

/**
 * Updates lattice mesh position, scale, and rotation based on stampInfo.
 * Preserves vertex deformations.
 */
export function updateLatticeMeshTransform(
	mesh: THREE.Mesh,
	stampInfo: {
		uv: THREE.Vector2
		sizeX: number
		sizeY: number
		rotation: number
	}
): void {
	const centerU = stampInfo.uv.x
	const centerV = stampInfo.uv.y
	
	// Position mesh at UV coordinates
	mesh.position.set(centerU, centerV, 0)
	
	// Scale mesh to stamp size
	mesh.scale.set(stampInfo.sizeX, stampInfo.sizeY, 1)
	
	// Rotate mesh
	mesh.rotation.z = stampInfo.rotation
}

/**
 * Resets lattice mesh vertices to their original positions.
 */
export function resetLatticeMeshVertices(mesh: THREE.Mesh): void {
	const geometry = mesh.geometry as THREE.PlaneGeometry
	const positions = geometry.attributes.position
	const originalPositions = geometry.userData.originalPositions as Float32Array | undefined
	
	if (!originalPositions) {
		return
	}
	
	positions.array.set(originalPositions)
	positions.needsUpdate = true
}
