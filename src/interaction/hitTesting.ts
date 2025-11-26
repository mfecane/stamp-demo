import * as THREE from 'three'
import type { IWidget } from '@/lib/widget/IWidget'
import type { HitResult } from '@/types/hitResult'

export function performHitTest(
	raycaster: THREE.Raycaster,
	widget: IWidget | null,
	tube: THREE.Mesh | null,
	imageHandle: THREE.Group | null = null
): HitResult {
	if (!widget && !tube) {
		return { type: 'empty' }
	}

	// Priority 1: Widget handles (resize or rotate)
	if (widget) {
		const widgetGroup = widget.getGroup()
		widgetGroup.updateMatrixWorld(true)
		
		// Get colliders from widget interface
		const colliders = widget.getColliders()
		const colliderIntersects = raycaster.intersectObjects(colliders, false)

		if (colliderIntersects.length > 0) {
			const intersected = colliderIntersects[0].object
			const intersection = colliderIntersects[0]
			
			// Delegate to widget to determine hit result
			const handleHitResult = widget.getHandleHitResult(intersected, intersection)
			if (handleHitResult) {
				return handleHitResult
			}
		}

		// Priority 2: Widget body (any other part of widget that's not a collider)
		const widgetIntersects = raycaster.intersectObject(widgetGroup, true)
		if (widgetIntersects.length > 0) {
			return {
				type: 'widget-body',
				object: widgetIntersects[0].object,
				intersection: widgetIntersects[0],
			}
		}
	}

	// Priority 3: Image handle
	if (imageHandle) {
		imageHandle.updateMatrixWorld(true)
		
		// Check only colliders (hit test objects)
		const handleColliders: THREE.Object3D[] = []
		imageHandle.traverse((child) => {
			if (child.userData.isHitTest && child.userData.isImageHandle && child instanceof THREE.Mesh) {
				handleColliders.push(child)
			}
		})

		const handleIntersects = raycaster.intersectObjects(handleColliders, false)
		if (handleIntersects.length > 0) {
			return {
				type: 'image-handle',
				object: handleIntersects[0].object,
				intersection: handleIntersects[0],
			}
		}
	}

	// Priority 4: Selectable object (tube mesh)
	if (tube) {
		const tubeIntersects = raycaster.intersectObject(tube)
		if (tubeIntersects.length > 0) {
			return {
				type: 'selectable-object',
				object: tube,
				intersection: tubeIntersects[0],
			}
		}
	}

	// Priority 5: Empty space
	return { type: 'empty' }
}

