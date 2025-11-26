import * as THREE from 'three'
import { updateWidgetHoverState } from '@/lib/widget'
import { updateHandleHoverState } from '@/lib/handle'

export class HoverStateManager {
	private hoveredAxis: 'x' | 'y' | 'center' | null = null
	private hoveredImageHandle: boolean = false

	updateHoverState(
		raycaster: THREE.Raycaster,
		widget: THREE.Group | null,
		imageHandle: THREE.Group | null = null
	): void {
		if (!widget) {
			if (this.hoveredAxis !== null) {
				this.hoveredAxis = null
			}
			return
		}

		widget.updateMatrixWorld(true)
		
		// Only intersect with colliders (hit test objects)
		const colliders: THREE.Object3D[] = []
		widget.traverse((child) => {
			if (child.userData.isHitTest && child instanceof THREE.Mesh) {
				colliders.push(child)
			}
		})

		const widgetIntersects = raycaster.intersectObjects(colliders, false)

		let newHoveredAxis: 'x' | 'y' | 'center' | null = null

		if (widgetIntersects.length > 0) {
			const intersected = widgetIntersects[0].object

			// Traverse up to find axis identification
			let currentObject: THREE.Object3D | null = intersected
			while (currentObject && currentObject !== widget) {
				// Only check colliders (isHitTest)
				if (currentObject.userData.isHitTest) {
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

		// Update hover state if it changed
		if (newHoveredAxis !== this.hoveredAxis) {
			this.hoveredAxis = newHoveredAxis
			updateWidgetHoverState(widget, this.hoveredAxis)
		}

		// Check image handle hover
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
	}
}

