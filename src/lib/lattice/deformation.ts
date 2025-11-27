import * as THREE from 'three'
import { BRUSH_CONSTANTS } from '@/interaction/tools/constants'

/**
 * Smooth falloff function using smoothstep for smooth transitions.
 * Returns 1 at distance 0, and 0 at distance >= radius.
 */
function smoothFalloff(distance: number, radius: number): number {
	if (distance >= radius) {
		return 0
	}
	const normalized = distance / radius
	// Smoothstep: 3t^2 - 2t^3
	return 1 - (3 * normalized * normalized - 2 * normalized * normalized * normalized)
}

/**
 * Service for deforming lattice mesh vertices based on brush interactions.
 */
export class LatticeDeformationService {
	/**
	 * Deforms lattice mesh vertices based on brush position and direction.
	 *
	 * @param mesh - The lattice mesh to deform
	 * @param brushUV - The brush position in UV space
	 * @param uvDirection - The direction vector in UV space indicating brush movement
	 * @throws Error if mesh geometry is missing original positions
	 */
	static deformVertices(
		mesh: THREE.Mesh,
		brushUV: THREE.Vector2,
		uvDirection: THREE.Vector2
	): void {
		const geometry = mesh.geometry as THREE.PlaneGeometry
		const positions = geometry.attributes.position
		const originalPositions = geometry.userData.originalPositions as Float32Array | undefined

		if (!originalPositions) {
			throw new Error('Lattice mesh geometry is missing original positions. Cannot deform vertices.')
		}

		// Update mesh matrices to get current transform
		mesh.updateMatrix()
		mesh.updateMatrixWorld(true)

		// Get the mesh's local transform matrix (position, scale, rotation)
		// This transforms from local mesh space to UV space
		const meshMatrix = mesh.matrix.clone()

		// Iterate through all vertices
		const vertexCount = positions.count
		for (let i = 0; i < vertexCount; i++) {
			// Get current vertex position in local mesh space (before mesh transform)
			const localVertex = new THREE.Vector3().fromBufferAttribute(positions, i)

			// Transform vertex from local mesh space to UV space using mesh transform
			const uvVertex = localVertex.clone().applyMatrix4(meshMatrix)
			const vertexUV = new THREE.Vector2(uvVertex.x, uvVertex.y)

			// Calculate distance from brush point to vertex in UV space
			const distance = vertexUV.distanceTo(brushUV)

			// Apply smooth falloff
			const influence = smoothFalloff(distance, BRUSH_CONSTANTS.INFLUENCE_RADIUS)

			if (influence > BRUSH_CONSTANTS.EPSILON) {
				// Calculate shift in UV space
				const shiftUV = uvDirection.clone().multiplyScalar(influence)

				// Transform shift from UV space back to local mesh space
				// The shift is a direction vector in UV space, so we transform it as a direction
				// We need to apply inverse rotation, then scale by 1/meshScale to convert UV units to local units
				const shiftUV3D = new THREE.Vector3(shiftUV.x, shiftUV.y, 0)

				// Get mesh rotation quaternion and apply inverse rotation
				const meshQuaternion = new THREE.Quaternion().setFromRotationMatrix(meshMatrix)
				const inverseQuaternion = meshQuaternion.clone().invert()
				const shiftRotated = shiftUV3D.clone().applyQuaternion(inverseQuaternion)

				// Scale by inverse of mesh scale to convert from UV space units to local space units
				// If mesh is scaled by sizeX/sizeY in UV space, a vector in UV space needs to be divided by that scale
				const scaleX = mesh.scale.x
				const scaleY = mesh.scale.y

				const shiftLocal = new THREE.Vector3(shiftRotated.x / scaleX, shiftRotated.y / scaleY, shiftRotated.z)

				// Only update if shift is significant
				const newX = localVertex.x + shiftLocal.x
				const newY = localVertex.y + shiftLocal.y
				const newZ = localVertex.z

				// Update vertex position
				positions.setXYZ(i, newX, newY, newZ)
			}
		}

		// Only mark as needing update if positions actually changed
		positions.needsUpdate = true
	}
}

