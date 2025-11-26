import * as THREE from 'three'

/**
 * Get face index from UV coordinates by finding the closest face.
 * Uses barycentric coordinates to determine which face contains the UV point.
 * 
 * @param geometry - The buffer geometry containing UV and index data
 * @param targetUV - The target UV coordinates to find
 * @returns The face index, or null if not found
 */
export function getFaceIndexFromUV(
	geometry: THREE.BufferGeometry,
	targetUV: THREE.Vector2
): number | null {
	const uvs = geometry.attributes.uv
	const indices = geometry.index

	if (!indices || !uvs) {
		return null
	}

	let closestFace = -1
	let minDistance = Infinity
	const targetU = targetUV.x
	const targetV = targetUV.y

	// Find the face with UV coordinates closest to target
	for (let i = 0; i < indices.count / 3; i++) {
		const i0 = indices.getX(i * 3)
		const i1 = indices.getX(i * 3 + 1)
		const i2 = indices.getX(i * 3 + 2)

		const uv0 = new THREE.Vector2(uvs.getX(i0), uvs.getY(i0))
		const uv1 = new THREE.Vector2(uvs.getX(i1), uvs.getY(i1))
		const uv2 = new THREE.Vector2(uvs.getX(i2), uvs.getY(i2))

		// Calculate barycentric coordinates
		const v0 = uv1.clone().sub(uv0)
		const v1 = uv2.clone().sub(uv0)
		const v2 = targetUV.clone().sub(uv0)

		const dot00 = v0.dot(v0)
		const dot01 = v0.dot(v1)
		const dot02 = v0.dot(v2)
		const dot11 = v1.dot(v1)
		const dot12 = v1.dot(v2)

		const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
		const u = (dot11 * dot02 - dot01 * dot12) * invDenom
		const v = (dot00 * dot12 - dot01 * dot02) * invDenom

		// Check if point is inside triangle (with some tolerance for edge cases)
		if (u >= -0.1 && v >= -0.1 && u + v <= 1.1) {
			// Calculate distance from triangle center
			const centerU = (uv0.x + uv1.x + uv2.x) / 3
			const centerV = (uv0.y + uv1.y + uv2.y) / 3
			const dist = Math.sqrt(
				Math.pow(targetU - centerU, 2) + Math.pow(targetV - centerV, 2)
			)

			if (dist < minDistance) {
				minDistance = dist
				closestFace = i
			}
		}
	}

	return closestFace === -1 ? null : closestFace
}

/**
 * Get 3D position on mesh from UV coordinates by finding the closest face
 * and interpolating the position using barycentric coordinates.
 * 
 * @param geometry - The buffer geometry containing position, UV, and index data
 * @param mesh - The mesh to transform the position to world space
 * @param targetUV - The target UV coordinates
 * @returns The 3D position in world space, or null if not found
 */
export function getPositionFromUV(
	geometry: THREE.BufferGeometry,
	mesh: THREE.Mesh,
	targetUV: THREE.Vector2
): THREE.Vector3 | null {
	const positions = geometry.attributes.position
	const uvs = geometry.attributes.uv
	const indices = geometry.index

	if (!indices || !uvs || !positions) {
		return null
	}

	// Find the closest face
	const closestFace = getFaceIndexFromUV(geometry, targetUV)
	if (closestFace === null) {
		return null
	}

	// Interpolate position using barycentric coordinates
	const i0 = indices.getX(closestFace * 3)
	const i1 = indices.getX(closestFace * 3 + 1)
	const i2 = indices.getX(closestFace * 3 + 2)

	const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0))
	const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1))
	const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2))

	const uv0 = new THREE.Vector2(uvs.getX(i0), uvs.getY(i0))
	const uv1 = new THREE.Vector2(uvs.getX(i1), uvs.getY(i1))
	const uv2 = new THREE.Vector2(uvs.getX(i2), uvs.getY(i2))

	// Calculate barycentric coordinates
	const v0_uv = uv1.clone().sub(uv0)
	const v1_uv = uv2.clone().sub(uv0)
	const v2_uv = targetUV.clone().sub(uv0)

	const dot00 = v0_uv.dot(v0_uv)
	const dot01 = v0_uv.dot(v1_uv)
	const dot02 = v0_uv.dot(v2_uv)
	const dot11 = v1_uv.dot(v1_uv)
	const dot12 = v1_uv.dot(v2_uv)

	const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
	const u = (dot11 * dot02 - dot01 * dot12) * invDenom
	const v = (dot00 * dot12 - dot01 * dot02) * invDenom
	const w = 1 - u - v

	// Interpolate position
	const position = new THREE.Vector3()
	position.addScaledVector(v0, w)
	position.addScaledVector(v1, u)
	position.addScaledVector(v2, v)

	// Transform to world space
	position.applyMatrix4(mesh.matrixWorld)

	return position
}

