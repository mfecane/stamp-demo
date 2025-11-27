import * as THREE from 'three'
import { Tool, NormalizedPointerEvent, ToolContext } from '../Tool'
import { calculateTangentVectors, throttleFPS } from '@/lib/utils'
import { BRUSH_CONSTANTS } from './constants'
import { LatticeDeformationService } from '@/lib/lattice/deformation'

export class BrushTool extends Tool {
	private isActive = false
	private previousMousePos = new THREE.Vector2()
	private previousUV = new THREE.Vector2()
	private uAxis: THREE.Vector3 | null = null
	private vAxis: THREE.Vector3 | null = null
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

		if (!stampInfo) {
			throw new Error('Cannot activate brush tool: stamp info is missing')
		}
		if (!latticeMesh) {
			throw new Error('Cannot activate brush tool: lattice mesh is missing')
		}
		if (!tube) {
			throw new Error('Cannot activate brush tool: tube mesh is missing')
		}

		// Raycast to get intersection point and tangent vectors
		const tubeIntersects = this.context.raycaster.intersectObject(tube)
		if (tubeIntersects.length === 0) {
			throw new Error('Cannot activate brush tool: no intersection with tube mesh')
		}

		const intersection = tubeIntersects[0]
		if (!intersection.uv) {
			throw new Error('Cannot activate brush tool: intersection missing UV coordinates')
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

		if (!stampInfo) {
			throw new Error('Brush tool: stamp info is missing')
		}
		if (!latticeMesh) {
			throw new Error('Brush tool: lattice mesh is missing')
		}
		if (!tube) {
			throw new Error('Brush tool: tube mesh is missing')
		}
		if (!this.uAxis || !this.vAxis) {
			throw new Error('Brush tool: tangent vectors are missing')
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
		uvDirection.multiplyScalar(BRUSH_CONSTANTS.STRENGTH)

		// Get current intersection point in UV space
		const tubeIntersects = this.context.raycaster.intersectObject(tube)
		if (tubeIntersects.length === 0) {
			throw new Error('Brush tool: no intersection with tube mesh during move')
		}
		if (!tubeIntersects[0].uv) {
			throw new Error('Brush tool: intersection missing UV coordinates during move')
		}

		const currentUV = tubeIntersects[0].uv.clone()

		// Add point to brush stroke (store original UV, will be flipped in debug visualization)
		storeState.addBrushStrokePoint({ x: currentUV.x, y: currentUV.y })

		// Deform lattice vertices
		LatticeDeformationService.deformVertices(latticeMesh, currentUV, uvDirection)

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
}
