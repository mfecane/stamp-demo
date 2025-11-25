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
			console.log('[HitTest] Hit collider:', {
				type: intersected.constructor.name,
				userData: intersected.userData,
			})

			// Traverse up to find handle identification
			let currentObject: THREE.Object3D | null = intersected
			while (currentObject && currentObject !== widget) {
				console.log('[HitTest] Checking object:', {
					type: currentObject.constructor.name,
					userData: currentObject.userData,
					isHitTest: currentObject.userData.isHitTest,
					isXAxis: currentObject.userData.isXAxis,
					isYAxis: currentObject.userData.isYAxis,
					isXHandle: currentObject.userData.isXHandle,
					isYHandle: currentObject.userData.isYHandle,
				})

				// Check colliders (isHitTest)
				if (currentObject.userData.isHitTest) {
					if (currentObject.userData.isXAxis || currentObject.userData.isXHandle) {
						console.log('[HitTest] Detected X axis collider')
						return {
							type: 'resize-handle',
							object: intersected,
							intersection: colliderIntersects[0],
							handleType: 'x',
						}
					}
					if (currentObject.userData.isYAxis || currentObject.userData.isYHandle) {
						console.log('[HitTest] Detected Y axis collider')
						return {
							type: 'resize-handle',
							object: intersected,
							intersection: colliderIntersects[0],
							handleType: 'y',
						}
					}
					if (currentObject.userData.isCenterHandle) {
						console.log('[HitTest] Detected center collider')
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
			console.log('[HitTest] Hit widget body (non-collider)')
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

