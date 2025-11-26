import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { updateLatticeMeshTransform } from '@/lib/lattice/LatticeMesh'

export class RotateTool extends Tool {
	private initialMousePos = new THREE.Vector2()
	private initialRotation = 0
	private isActive = false

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

		this.initialRotation = stampInfo.rotation || 0
		this.isActive = true
		this.context.controls.enabled = false
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			return
		}

		const { storeState, camera } = this.prepareTool(event)

		const widget = storeState.widget
		const stampInfo = storeState.stampInfo

		if (!widget || !stampInfo) return

		const widgetGroup = widget.getGroup()
		// Get widget's world position
		widgetGroup.updateMatrixWorld(true)
		const widgetPosition = new THREE.Vector3()
		widgetGroup.getWorldPosition(widgetPosition)

		// Project widget center to screen space
		const widgetScreen = new THREE.Vector3()
		widgetScreen.copy(widgetPosition)
		widgetScreen.project(camera)

		const widgetScreen2D = new THREE.Vector2(widgetScreen.x, widgetScreen.y)

		// Calculate angle from widget center to initial mouse position
		const initialAngle = Math.atan2(
			this.initialMousePos.y - widgetScreen2D.y,
			this.initialMousePos.x - widgetScreen2D.x
		)

		// Calculate angle from widget center to current mouse position
		const currentAngle = Math.atan2(
			this.context.mouse.y - widgetScreen2D.y,
			this.context.mouse.x - widgetScreen2D.x
		)

		// Calculate rotation delta
		// Negate because screen space Y is inverted (increases downward)
		// Canvas 2D rotation is counter-clockwise for positive angles
		// When dragging clockwise in screen space, we want clockwise rotation (negative in canvas)
		let deltaAngle = -(currentAngle - initialAngle)

		// Normalize to [-PI, PI]
		while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
		while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

		// Update rotation in UV space
		const newRotation = this.initialRotation + deltaAngle

		// Update stamp rotation in store
		storeState.setStampInfo({
			...stampInfo,
			rotation: newRotation,
		})

		// Update lattice mesh transform and redraw
		const latticeMesh = storeState.latticeMesh
		if (latticeMesh) {
			updateLatticeMeshTransform(latticeMesh, {
				uv: stampInfo.uv,
				sizeX: stampInfo.sizeX,
				sizeY: stampInfo.sizeY,
				rotation: newRotation,
			})
		}

		// Redraw stamp
		const renderer = storeState.renderer
		if (renderer) {
			storeState.redrawStamp(renderer)
		}
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		this.isActive = false
		this.context.controls.enabled = true
	}
}

