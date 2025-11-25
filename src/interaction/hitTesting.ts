import * as THREE from 'three'

export interface HitResult {
	type: 'resize-handle' | 'widget-body' | 'selectable-object' | 'empty'
	object?: THREE.Object3D
	intersection?: THREE.Intersection
	handleType?: 'x' | 'y' | 'center'
}

export function performHitTest(
	raycaster: THREE.Raycaster,
	widget: THREE.Group | null,
	tube: THREE.Mesh | null
): HitResult {
	if (!widget && !tube) {
		return { type: 'empty' }
	}

	// Priority 1: Resize handles (widget colliders)
	if (widget) {
		widget.updateMatrixWorld(true)
		
		// First check only colliders (hit test objects)
		const colliders: THREE.Object3D[] = []
		widget.traverse((child) => {
			if (child.userData.isHitTest && child instanceof THREE.Mesh) {
				colliders.push(child)
			}
		})

		const colliderIntersects = raycaster.intersectObjects(colliders, false)

		if (colliderIntersects.length > 0) {
			const intersected = colliderIntersects[0].object

			// Traverse up to find handle identification
			let currentObject: THREE.Object3D | null = intersected
			while (currentObject && currentObject !== widget) {
				// Check colliders (isHitTest)
				if (currentObject.userData.isHitTest) {
					if (currentObject.userData.isXAxis || currentObject.userData.isXHandle) {
						return {
							type: 'resize-handle',
							object: intersected,
							intersection: colliderIntersects[0],
							handleType: 'x',
						}
					}
					if (currentObject.userData.isYAxis || currentObject.userData.isYHandle) {
						return {
							type: 'resize-handle',
							object: intersected,
							intersection: colliderIntersects[0],
							handleType: 'y',
						}
					}
					if (currentObject.userData.isCenterHandle) {
						return {
							type: 'resize-handle',
							object: intersected,
							intersection: colliderIntersects[0],
							handleType: 'center',
						}
					}
				}
				currentObject = currentObject.parent
			}
		}

		// Priority 2: Widget body (any other part of widget that's not a collider)
		const widgetIntersects = raycaster.intersectObject(widget, true)
		if (widgetIntersects.length > 0) {
			return {
				type: 'widget-body',
				object: widgetIntersects[0].object,
				intersection: widgetIntersects[0],
			}
		}
	}

	// Priority 3: Selectable object (tube mesh)
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

	// Priority 4: Empty space
	return { type: 'empty' }
}

