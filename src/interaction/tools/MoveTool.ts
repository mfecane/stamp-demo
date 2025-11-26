import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { normalizeMousePosition } from '../utils/mousePosition'
import { updateCameraMatrix } from '../utils/cameraUpdates'
import { calculateTangentVectors } from '@/lib/utils'
import { CanvasRenderer } from '@/services/CanvasRenderer'
import { MOVE_CONSTANTS } from './constants'

/**
 * Get face index from UV coordinates by finding the closest face
 */
function getFaceIndexFromUV(
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
 * and interpolating the position
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

	if (closestFace === -1) {
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
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		updateCameraMatrix(camera)

		// Update mouse position with current camera
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)

		this.initialMousePos.copy(this.context.mouse)

		const stampInfo = storeState.stampInfo
		if (!stampInfo) {
			return
		}

		const widget = storeState.widget
		if (!widget) {
			return
		}

		// Store initial widget position
		widget.updateMatrixWorld(true)
		widget.getWorldPosition(this.initialWidgetPosition)

		this.initialUV = stampInfo.uv.clone()
		this.isActive = true
		this.context.controls.enabled = false
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			return
		}

		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		updateCameraMatrix(camera)

		// Update mouse position with current camera
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)
		const deltaMouse = new THREE.Vector2(
			this.context.mouse.x - this.initialMousePos.x,
			this.context.mouse.y - this.initialMousePos.y
		)

		const widget = storeState.widget
		const stampInfo = storeState.stampInfo
		const tube = storeState.tube
		const canvas = storeState.canvas
		const sourceImage = storeState.sourceImage
		const texture = storeState.texture
		const scene = storeState.scene

		if (!widget || !stampInfo || !tube || !canvas || !sourceImage || !texture || !scene) return

		// Get widget's world position and axes
		widget.updateMatrixWorld(true)
		const widgetPosition = new THREE.Vector3()
		widget.getWorldPosition(widgetPosition)

		const worldU = new THREE.Vector3(1, 0, 0).transformDirection(widget.matrixWorld)
		const worldV = new THREE.Vector3(0, 1, 0).transformDirection(widget.matrixWorld)

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

			// Redraw stamp at new position
			CanvasRenderer.drawStamp(canvas, sourceImage, uv, stampInfo.sizeX, stampInfo.sizeY, stampInfo.rotation || 0)
			CanvasRenderer.updateTexture(texture)

			// Force material update if it's using the texture
			const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
			if (tubeMaterial && tubeMaterial.map === texture) {
				tubeMaterial.needsUpdate = true
			}

			// Update widget position to intersection point
			const point = intersection.point
			widget.position.copy(point)
			widget.updateMatrixWorld(true)

			// Update widget orientation based on new normal and axes, applying rotation
			// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
			const normalizedN = normal.clone().normalize()
			const rotation = stampInfo.rotation || 0
			const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
			
			const rotatedU = uAxis.clone().applyQuaternion(rotationQuaternion)
			const rotatedV = vAxis.clone().applyQuaternion(rotationQuaternion)

			const normalizedU = rotatedU.clone().normalize()
			const normalizedV = rotatedV.clone().normalize()

			const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
			correctedV.normalize()
			const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
			if (correctedN.dot(normalizedN) < 0) {
				correctedN.negate()
			}

			const quaternion = new THREE.Quaternion()
			const matrix = new THREE.Matrix4()
			matrix.makeBasis(normalizedU, correctedV, correctedN)
			quaternion.setFromRotationMatrix(matrix)
			widget.quaternion.copy(quaternion)

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
			widget.position.copy(newPosition)
			
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

					// Redraw stamp at new position
					CanvasRenderer.drawStamp(canvas, sourceImage, newUV, stampInfo.sizeX, stampInfo.sizeY, stampInfo.rotation || 0)
					CanvasRenderer.updateTexture(texture)

					// Force material update if it's using the texture
					const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
					if (tubeMaterial && tubeMaterial.map === texture) {
						tubeMaterial.needsUpdate = true
					}

					// Update widget orientation based on new normal and axes, applying rotation
					// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
					const normalizedN = normal.clone().normalize()
					const rotation = stampInfo.rotation || 0
					const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
					
					const rotatedU = uAxis.clone().applyQuaternion(rotationQuaternion)
					const rotatedV = vAxis.clone().applyQuaternion(rotationQuaternion)

					const normalizedU = rotatedU.clone().normalize()
					const normalizedV = rotatedV.clone().normalize()

					const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
					correctedV.normalize()
					const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
					if (correctedN.dot(normalizedN) < 0) {
						correctedN.negate()
					}

					const quaternion = new THREE.Quaternion()
					const matrix = new THREE.Matrix4()
					matrix.makeBasis(normalizedU, correctedV, correctedN)
					quaternion.setFromRotationMatrix(matrix)
					widget.quaternion.copy(quaternion)
					widget.updateMatrixWorld(true)
				}
			} else {
				// Fallback: use existing axes if face index not found
				// Update stamp info with new UV coordinates
				storeState.setStampInfo({
					...stampInfo,
					uv: newUV,
				})

				// Redraw stamp at new position
				CanvasRenderer.drawStamp(canvas, sourceImage, newUV, stampInfo.sizeX, stampInfo.sizeY, stampInfo.rotation || 0)
				CanvasRenderer.updateTexture(texture)

				// Force material update if it's using the texture
				const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
				if (tubeMaterial && tubeMaterial.map === texture) {
					tubeMaterial.needsUpdate = true
				}

				// Update widget orientation based on current normal and axes, applying rotation
				// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
				const normalizedN = stampInfo.normal.clone().normalize()
				const rotation = stampInfo.rotation || 0
				const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
				
				const rotatedU = stampInfo.uAxis.clone().applyQuaternion(rotationQuaternion)
				const rotatedV = stampInfo.vAxis.clone().applyQuaternion(rotationQuaternion)

				const normalizedU = rotatedU.clone().normalize()
				const normalizedV = rotatedV.clone().normalize()

				const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
				correctedV.normalize()
				const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
				if (correctedN.dot(normalizedN) < 0) {
					correctedN.negate()
				}

				const quaternion = new THREE.Quaternion()
				const matrix = new THREE.Matrix4()
				matrix.makeBasis(normalizedU, correctedV, correctedN)
				quaternion.setFromRotationMatrix(matrix)
				widget.quaternion.copy(quaternion)
				widget.updateMatrixWorld(true)
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

