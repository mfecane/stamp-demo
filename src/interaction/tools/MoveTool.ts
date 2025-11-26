import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { calculateTangentVectors } from '@/lib/utils'
import { MOVE_CONSTANTS } from './constants'
import { getFaceIndexFromUV, getPositionFromUV } from '@/lib/utils/uvCalculations'
import { updateWidgetOrientation } from '@/lib/utils/widgetOrientation'
import { updateLatticeMeshTransform } from '@/lib/lattice/LatticeMesh'

// Re-export for backward compatibility
export { getPositionFromUV }

export class MoveTool extends Tool {
	private initialMousePos = new THREE.Vector2()
	private initialUV = new THREE.Vector2()
	private initialWidgetPosition = new THREE.Vector3()
	private handleType: 'x' | 'y' | 'center'
	private isActive = false

	constructor(context: any, handleType: 'x' | 'y' | 'center' | undefined) {
		super(context)
		this.handleType = handleType || 'center'
	}

	onPointerDown(event: NormalizedPointerEvent): void {
		const { storeState, camera } = this.prepareTool(event)

		this.initialMousePos.copy(this.context.mouse)

		const stampInfo = storeState.stampInfo
		if (!stampInfo) {
			return
		}

		const widget = storeState.widget
		if (!widget) {
			return
		}

		const widgetGroup = widget.getGroup()
		// Store initial widget position
		widgetGroup.updateMatrixWorld(true)
		widgetGroup.getWorldPosition(this.initialWidgetPosition)

		this.initialUV = stampInfo.uv.clone()
		this.isActive = true
		this.context.controls.enabled = false
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			return
		}

		const { storeState, camera } = this.prepareTool(event)
		const deltaMouse = new THREE.Vector2(
			this.context.mouse.x - this.initialMousePos.x,
			this.context.mouse.y - this.initialMousePos.y
		)

		const widget = storeState.widget
		const stampInfo = storeState.stampInfo
		const tube = storeState.tube
		const scene = storeState.scene

		if (!widget || !stampInfo || !tube || !scene) return

		const widgetGroup = widget.getGroup()
		// Get widget's world position and axes
		widgetGroup.updateMatrixWorld(true)
		const widgetPosition = new THREE.Vector3()
		widgetGroup.getWorldPosition(widgetPosition)

		const worldU = new THREE.Vector3(1, 0, 0).transformDirection(widgetGroup.matrixWorld)
		const worldV = new THREE.Vector3(0, 1, 0).transformDirection(widgetGroup.matrixWorld)

		// Project widget axes to screen space
		const uScreen = new THREE.Vector3()
		uScreen.copy(widgetPosition).add(worldU)
		uScreen.project(camera)

		const vScreen = new THREE.Vector3()
		vScreen.copy(widgetPosition).add(worldV)
		vScreen.project(camera)

		const widgetScreen = new THREE.Vector3()
		widgetScreen.copy(widgetPosition)
		widgetScreen.project(camera)

		// Calculate screen space directions
		const screenU = new THREE.Vector2(uScreen.x - widgetScreen.x, uScreen.y - widgetScreen.y).normalize()
		const screenV = new THREE.Vector2(vScreen.x - widgetScreen.x, vScreen.y - widgetScreen.y).normalize()

		// Calculate movement in UV space based on drag direction
		let newUV: THREE.Vector2 | null = null
		let newU = 0
		let newV = 0

		if (this.handleType === 'center') {
			// For center handle, raycast from mouse to tube to get UV coordinates
			const tubeIntersects = this.context.raycaster.intersectObject(tube)
			if (tubeIntersects.length === 0) {
				// No intersection - stop moving but keep tool active
				return
			}

			const intersection = tubeIntersects[0]
			if (!intersection.uv) {
				// No UV coordinates - stop moving but keep tool active
				return
			}

			const uv = intersection.uv.clone()
			const normal = intersection.normal
				? intersection.normal.clone().transformDirection(tube.matrixWorld)
				: stampInfo.normal

			const faceIndex = intersection.faceIndex ?? 0
			const { uAxis, vAxis } = calculateTangentVectors(tube.geometry, faceIndex, normal)

			// Update stamp info with new UV coordinates and recalculated axes
			storeState.setStampInfo({
				...stampInfo,
				uv,
				uAxis,
				vAxis,
				normal,
			})

			// Update lattice mesh transform and redraw
			const latticeMesh = storeState.latticeMesh
			if (latticeMesh) {
				updateLatticeMeshTransform(latticeMesh, {
					uv,
					sizeX: stampInfo.sizeX,
					sizeY: stampInfo.sizeY,
					rotation: stampInfo.rotation || 0,
				})
			}

			// Redraw stamp
			const renderer = storeState.renderer
			if (renderer && storeState.latticeRenderer) {
				const newTexture = storeState.latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
			const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
				if (tubeMaterial) {
					if (tubeMaterial.map && tubeMaterial.map !== storeState.texture) {
						tubeMaterial.map.dispose()
					}
					tubeMaterial.map = newTexture
				tubeMaterial.needsUpdate = true
				}
			}

			// Update widget position to intersection point
			const point = intersection.point
			widgetGroup.position.copy(point)
			widgetGroup.updateMatrixWorld(true)

			// Update widget orientation based on new normal and axes, applying rotation
			updateWidgetOrientation(widgetGroup, normal, uAxis, vAxis, stampInfo.rotation || 0)

			return
		}

		// For X and Y handles, use axis-constrained movement
		// Widget axes are rotated by -rotation to match canvas direction
		// So widget X axis = uAxis rotated by -rotation
		// Convert movement along rotated widget axes to UV space deltas
		
		const rotation = stampInfo.rotation || 0
		// Use -rotation because widget axes are rotated by -rotation
		const cosR = Math.cos(-rotation)
		const sinR = Math.sin(-rotation)
		
		let deltaU = 0
		let deltaV = 0
		
		if (this.handleType === 'x') {
			// Moving along widget X axis (uAxis rotated by -rotation)
			// In UV space: rotated uAxis = cos(-rotation) * uAxis + sin(-rotation) * vAxis
			const uComponent = deltaMouse.dot(screenU)
			const movementAmount = uComponent * MOVE_CONSTANTS.SENSITIVITY
			deltaU = movementAmount * cosR
			deltaV = movementAmount * sinR
		} else if (this.handleType === 'y') {
			// Moving along widget Y axis (vAxis rotated by -rotation)
			// In UV space: rotated vAxis = -sin(-rotation) * uAxis + cos(-rotation) * vAxis
			const vComponent = deltaMouse.dot(screenV)
			const movementAmount = vComponent * MOVE_CONSTANTS.SENSITIVITY
			deltaU = -movementAmount * sinR
			deltaV = movementAmount * cosR
		}

		// Calculate new UV coordinates (clamp to [0, 1])
		newU = Math.max(0, Math.min(1, this.initialUV.x + deltaU))
		newV = Math.max(0, Math.min(1, this.initialUV.y + deltaV))

		newUV = new THREE.Vector2(newU, newV)

		// Update widget position based on actual 3D position from new UV coordinates
		const newPosition = getPositionFromUV(tube.geometry, tube, newUV)
		if (newPosition) {
			widgetGroup.position.copy(newPosition)
			
			// Recalculate axes at the new position
			const faceIndex = getFaceIndexFromUV(tube.geometry, newUV)
			if (faceIndex !== null) {
				// Calculate normal from the face
				const positions = tube.geometry.attributes.position
				const indices = tube.geometry.index
				if (indices && positions) {
					const i0 = indices.getX(faceIndex * 3)
					const i1 = indices.getX(faceIndex * 3 + 1)
					const i2 = indices.getX(faceIndex * 3 + 2)

					const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0))
					const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1))
					const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2))

					const edge1 = v1.clone().sub(v0)
					const edge2 = v2.clone().sub(v0)
					const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()
					normal.transformDirection(tube.matrixWorld)

					// Recalculate tangent vectors at the new face
					const { uAxis, vAxis } = calculateTangentVectors(tube.geometry, faceIndex, normal)

					// Update stamp info with new UV, axes, and normal
					storeState.setStampInfo({
						...stampInfo,
						uv: newUV,
						uAxis,
						vAxis,
						normal,
					})

					// Update lattice mesh transform and redraw
					const latticeMesh = storeState.latticeMesh
					if (latticeMesh) {
						updateLatticeMeshTransform(latticeMesh, {
							uv: newUV,
							sizeX: stampInfo.sizeX,
							sizeY: stampInfo.sizeY,
							rotation: stampInfo.rotation || 0,
						})
					}

					// Redraw stamp
					const renderer = storeState.renderer
					if (renderer && storeState.latticeRenderer) {
						const newTexture = storeState.latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
					const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
						if (tubeMaterial) {
							if (tubeMaterial.map && tubeMaterial.map !== storeState.texture) {
								tubeMaterial.map.dispose()
							}
							tubeMaterial.map = newTexture
						tubeMaterial.needsUpdate = true
						}
					}

					// Update widget orientation based on new normal and axes, applying rotation
					updateWidgetOrientation(widgetGroup, normal, uAxis, vAxis, stampInfo.rotation || 0)
				}
			} else {
				// Fallback: use existing axes if face index not found
				// Update stamp info with new UV coordinates
				storeState.setStampInfo({
					...stampInfo,
					uv: newUV,
				})

				// Update lattice mesh transform and redraw
				const latticeMesh = storeState.latticeMesh
				if (latticeMesh) {
					updateLatticeMeshTransform(latticeMesh, {
						uv: newUV,
						sizeX: stampInfo.sizeX,
						sizeY: stampInfo.sizeY,
						rotation: stampInfo.rotation || 0,
					})
				}

				// Redraw stamp
				const renderer = storeState.renderer
				if (renderer && storeState.latticeRenderer) {
					const newTexture = storeState.latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
				const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
					if (tubeMaterial) {
						if (tubeMaterial.map && tubeMaterial.map !== storeState.texture) {
							tubeMaterial.map.dispose()
						}
						tubeMaterial.map = newTexture
					tubeMaterial.needsUpdate = true
					}
				}

				// Update widget orientation based on current normal and axes, applying rotation
				updateWidgetOrientation(widgetGroup, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, stampInfo.rotation || 0)
			}
		}

		// Image handle is decoupled - it will be updated separately based on stamp position
		// The image handle is hidden when widget is active anyway
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		this.isActive = false
		this.context.controls.enabled = true
	}
}

