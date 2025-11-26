import * as THREE from 'three'
import { updateWidgetHoverState, updateRotateWidgetHoverState } from '@/lib/widget'
import { updateHandleHoverState } from '@/lib/handle'

export class HoverStateManager {
	private hoveredAxis: 'x' | 'y' | 'center' | null = null
	private hoveredImageHandle: boolean = false
	private hoveredRotateHandle: boolean = false

	updateHoverState(
		raycaster: THREE.Raycaster,
		widget: THREE.Group | null,
		imageHandle: THREE.Group | null = null
	): void {
		// Check widget hover state
		let newHoveredAxis: 'x' | 'y' | 'center' | null = null
		let isRotateWidget = false
		let isRotateHandleHovered = false
		let isMoveWidget = false
		
		if (widget) {
			widget.updateMatrixWorld(true)
			
			// Check widget type
			widget.traverse((child) => {
				if (child.userData.isRotateWidget || child.userData.isRotateHandle) {
					isRotateWidget = true
				}
				if (child.userData.isMoveWidget) {
					isMoveWidget = true
				}
			})
			
			// Only intersect with colliders (hit test objects)
			const colliders: THREE.Object3D[] = []
			widget.traverse((child) => {
				if (child.userData.isHitTest && child instanceof THREE.Mesh) {
					colliders.push(child)
				}
			})

			const widgetIntersects = raycaster.intersectObjects(colliders, false)

			if (widgetIntersects.length > 0) {
				const intersected = widgetIntersects[0].object

				// Traverse up to find axis identification
				let currentObject: THREE.Object3D | null = intersected
				while (currentObject && currentObject !== widget) {
					// Only check colliders (isHitTest)
					if (currentObject.userData.isHitTest) {
						if (currentObject.userData.isRotateHandle) {
							isRotateHandleHovered = true
							break
						}
						if (currentObject.userData.isXAxis || currentObject.userData.isXHandle) {
							newHoveredAxis = 'x'
							break
						}
						if (currentObject.userData.isYAxis || currentObject.userData.isYHandle) {
							newHoveredAxis = 'y'
							break
						}
						if (currentObject.userData.isCenterHandle) {
							newHoveredAxis = 'center'
							break
						}
					}

					currentObject = currentObject.parent
				}
			}
		}

		// Update widget hover state if it changed
		if (isRotateWidget) {
			// For rotate widgets, use rotate hover state
			if (isRotateHandleHovered !== this.hoveredRotateHandle) {
				this.hoveredRotateHandle = isRotateHandleHovered
				if (widget) {
					updateRotateWidgetHoverState(widget, isRotateHandleHovered)
				}
			}
		} else if (isMoveWidget) {
			// For move widgets, use resize hover state (same structure)
			// Always update to ensure colors are set correctly
			if (newHoveredAxis !== this.hoveredAxis) {
				this.hoveredAxis = newHoveredAxis
				if (widget) {
					updateWidgetHoverState(widget, this.hoveredAxis)
				}
			}
		} else if (newHoveredAxis !== null || this.hoveredAxis !== null) {
			// For resize widgets, use resize hover state
			if (newHoveredAxis !== this.hoveredAxis) {
				this.hoveredAxis = newHoveredAxis
				if (widget) {
					updateWidgetHoverState(widget, this.hoveredAxis)
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

