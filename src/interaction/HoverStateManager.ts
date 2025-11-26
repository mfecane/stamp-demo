import * as THREE from 'three'
import type { IWidget } from '@/lib/widget/IWidget'
import { updateWidgetHoverState, updateRotateWidgetHoverState } from '@/lib/widget/utils/hoverState'
import { updateHandleHoverState } from '@/lib/handle'

export class HoverStateManager {
	private hoveredAxis: 'x' | 'y' | 'center' | null = null
	private hoveredImageHandle: boolean = false
	private hoveredRotateHandle: boolean = false

	updateHoverState(
		raycaster: THREE.Raycaster,
		widget: IWidget | null,
		imageHandle: THREE.Group | null = null
	): void {
		// Check widget hover state
		let newHoveredAxis: 'x' | 'y' | 'center' | null = null
		let isRotateHandleHovered = false
		
		if (widget) {
			const widgetGroup = widget.getGroup()
			widgetGroup.updateMatrixWorld(true)
			const widgetType = widget.getType()
			
			// Get colliders from widget interface
			const colliders = widget.getColliders()
			const widgetIntersects = raycaster.intersectObjects(colliders, false)

			if (widgetIntersects.length > 0) {
				const intersected = widgetIntersects[0].object

				if (widgetType === 'rotate') {
					// Check if intersected is a rotate handle
					let currentObject: THREE.Object3D | null = intersected
					while (currentObject && currentObject !== widgetGroup) {
						if (currentObject.userData.isHitTest && currentObject.userData.isRotateHandle) {
							isRotateHandleHovered = true
							break
						}
						currentObject = currentObject.parent
					}
				} else {
					// For scaling and move widgets, get handle type from widget interface
					newHoveredAxis = widget.getHandleType(intersected)
				}
			}

			// Update widget hover state if it changed
			if (widgetType === 'rotate') {
				// For rotate widgets, use rotate hover state
				if (isRotateHandleHovered !== this.hoveredRotateHandle) {
					this.hoveredRotateHandle = isRotateHandleHovered
					updateRotateWidgetHoverState(widgetGroup, isRotateHandleHovered)
				}
			} else {
				// For scaling and move widgets, use resize hover state (same structure)
				if (newHoveredAxis !== this.hoveredAxis) {
					this.hoveredAxis = newHoveredAxis
					updateWidgetHoverState(widgetGroup, this.hoveredAxis)
				}
			}
		}

		// Check image handle hover (always check, regardless of widget)
		let isImageHandleHovered = false
		if (imageHandle) {
			imageHandle.updateMatrixWorld(true)
			
			const handleColliders: THREE.Object3D[] = []
			imageHandle.traverse((child) => {
				if (child.userData.isHitTest && child.userData.isImageHandle && child instanceof THREE.Mesh) {
					handleColliders.push(child)
				}
			})

			const handleIntersects = raycaster.intersectObjects(handleColliders, false)
			isImageHandleHovered = handleIntersects.length > 0
		}

		// Update image handle hover state if it changed
		if (isImageHandleHovered !== this.hoveredImageHandle) {
			this.hoveredImageHandle = isImageHandleHovered
			updateHandleHoverState(imageHandle, this.hoveredImageHandle)
		}
	}

	getHoveredAxis(): 'x' | 'y' | 'center' | null {
		return this.hoveredAxis
	}

	reset(): void {
		this.hoveredAxis = null
		this.hoveredImageHandle = false
		this.hoveredRotateHandle = false
	}
}

