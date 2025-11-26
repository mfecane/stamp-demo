import * as THREE from 'three'
import { Tool, NormalizedPointerEvent, ToolContext } from '../Tool'
import { calculateTangentVectors, throttleFPS } from '@/lib/utils'

const BRUSH_INFLUENCE_RADIUS = 0.2 // UV units
const BRUSH_STRENGTH = 0.1 // How much vertices move per pixel of mouse movement

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

export class BrushTool extends Tool {
	private isActive = false
	private previousMousePos = new THREE.Vector2()
	private previousUV = new THREE.Vector2()
	private uAxis: THREE.Vector3 | null = null
	private vAxis: THREE.Vector3 | null = null
	private EPSILON = 0.000001
	private throttledOnPointerMove: (event: NormalizedPointerEvent) => void

	constructor(context: ToolContext) {
		super(context)
		// Throttle onPointerMove to 60 fps
		this.throttledOnPointerMove = throttleFPS(this.onPointerMoveInternal.bind(this), 60)
	}

	onPointerDown(event: NormalizedPointerEvent): void {
		const { storeState } = this.prepareTool(event)

		const stampInfo = storeState.stampInfo
		const latticeMesh = storeState.latticeMesh
		const tube = storeState.tube

		if (!stampInfo || !latticeMesh || !tube) {
			return
		}

		// Raycast to get intersection point and tangent vectors
		const tubeIntersects = this.context.raycaster.intersectObject(tube)
		if (tubeIntersects.length === 0 || !tubeIntersects[0].uv) {
			return
		}

		const intersection = tubeIntersects[0]
		if (!intersection.uv) {
			return
		}
		const uv = intersection.uv.clone()
		const normal = intersection.normal
			? intersection.normal.clone().transformDirection(tube.matrixWorld)
			: stampInfo.normal

		const faceIndex = intersection.faceIndex ?? 0
		const tangentVectors = calculateTangentVectors(tube.geometry, faceIndex, normal)
		this.uAxis = tangentVectors.uAxis
		this.vAxis = tangentVectors.vAxis

		// Store initial mouse position and UV
		this.previousMousePos.copy(this.context.mouse)
		this.previousUV = uv.clone()

		// Start new brush stroke (store original UV, will be flipped in debug visualization)
		storeState.startNewBrushStroke()
		storeState.addBrushStrokePoint({ x: uv.x, y: uv.y })

		this.isActive = true
		this.context.controls.enabled = false
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			return
		}
		this.throttledOnPointerMove(event)
	}

	private onPointerMoveInternal(event: NormalizedPointerEvent): void {
		const { storeState, camera } = this.prepareTool(event)

		const stampInfo = storeState.stampInfo
		const latticeMesh = storeState.latticeMesh
		const tube = storeState.tube

		if (!stampInfo || !latticeMesh || !tube || !this.uAxis || !this.vAxis) {
			return
		}

		// Get current mouse position
		const currentMousePos = this.context.mouse.clone()

		// Calculate screen space direction vector
		const screenDirection = new THREE.Vector2()
		screenDirection.subVectors(currentMousePos, this.previousMousePos)

		// Project screen direction onto uAxis and vAxis (projected to screen space)
		// First, project uAxis and vAxis to screen space
		const screenU = new THREE.Vector2()
		const screenV = new THREE.Vector2()

		// Project uAxis to screen
		const uAxisWorld = this.uAxis.clone().transformDirection(tube.matrixWorld)
		const uAxisScreen = uAxisWorld.clone().project(camera)
		screenU.set(uAxisScreen.x * camera.aspect, uAxisScreen.y)

		// Project vAxis to screen
		const vAxisWorld = this.vAxis.clone().transformDirection(tube.matrixWorld)
		const vAxisScreen = vAxisWorld.clone().project(camera)
		screenV.set(vAxisScreen.x * camera.aspect, vAxisScreen.y)

		// Normalize screen-space axes
		screenU.normalize()
		screenV.normalize()

		// Project screen direction onto screen-space axes
		const uComponent = screenDirection.dot(screenU)
		const vComponent = screenDirection.dot(screenV)

		// This gives us the UV direction vector
		const uvDirection = new THREE.Vector2(uComponent, vComponent)
		uvDirection.multiplyScalar(BRUSH_STRENGTH)

		// Get current intersection point in UV space
		const tubeIntersects = this.context.raycaster.intersectObject(tube)
		if (tubeIntersects.length === 0 || !tubeIntersects[0].uv) {
			return
		}

		const currentUV = tubeIntersects[0].uv.clone()

		// Add point to brush stroke (store original UV, will be flipped in debug visualization)
		storeState.addBrushStrokePoint({ x: currentUV.x, y: currentUV.y })

		// Deform lattice vertices
		this.deformVertices(latticeMesh, currentUV, uvDirection)

		// Update previous positions
		this.previousMousePos.copy(currentMousePos)
		this.previousUV.copy(currentUV)
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		this.isActive = false
		this.context.controls.enabled = true
		this.uAxis = null
		this.vAxis = null
	}

	/**
	 * Deforms lattice mesh vertices based on brush position and direction.
	 */
	private deformVertices(mesh: THREE.Mesh, brushUV: THREE.Vector2, uvDirection: THREE.Vector2): void {
		const geometry = mesh.geometry as THREE.PlaneGeometry
		const positions = geometry.attributes.position
		const originalPositions = geometry.userData.originalPositions as Float32Array | undefined

		if (!originalPositions) {
			return
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
			const influence = smoothFalloff(distance, BRUSH_INFLUENCE_RADIUS)

			if (influence > this.EPSILON) {
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
