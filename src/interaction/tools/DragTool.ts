import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'

export class DragTool extends Tool {
	private initialMousePos = new THREE.Vector2()
	private initialPosition = new THREE.Vector3()
	private isActive = false

	onPointerDown(event: NormalizedPointerEvent): void {
		this.updateMousePosition(event)
		this.initialMousePos.copy(this.context.mouse)

		const widget = this.context.store.widget
		if (widget) {
			const widgetGroup = widget.getGroup()
			widgetGroup.getWorldPosition(this.initialPosition)
			this.isActive = true
			this.context.controls.enabled = false
		}
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) return

		this.updateMousePosition(event)
		const deltaMouse = new THREE.Vector2(
			this.context.mouse.x - this.initialMousePos.x,
			this.context.mouse.y - this.initialMousePos.y
		)

		const widget = this.context.store.widget
		if (!widget) return

		const widgetGroup = widget.getGroup()
		// Calculate movement in world space based on camera view
		const movement = new THREE.Vector3()
		movement.x = deltaMouse.x * 2
		movement.y = -deltaMouse.y * 2

		// Transform movement to widget's local space
		const worldMovement = movement.applyMatrix4(
			this.context.camera.matrixWorld.clone().invert()
		)

		const newPosition = this.initialPosition.clone().add(worldMovement)
		widgetGroup.position.copy(newPosition)
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		this.isActive = false
		this.context.controls.enabled = true
	}
}

