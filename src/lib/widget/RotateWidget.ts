import * as THREE from 'three'
import { BaseWidget } from './BaseWidget'
import type { HitResult } from '@/types/hitResult'
import { SHOW_COLLIDERS_DEBUG } from './constants'
import { calculateWidgetOrientation } from './utils/axisRotation'

// Rotate widget class
export class RotateWidget extends BaseWidget {
	constructor(group: THREE.Group) {
		super(group)
	}

	static create(
		position: THREE.Vector3,
		normal: THREE.Vector3,
		uAxis: THREE.Vector3,
		vAxis: THREE.Vector3,
		scene: THREE.Scene
	): RotateWidget {
		const widget = new THREE.Group()
		widget.position.copy(position)

		// Calculate widget orientation from axes (no rotation for rotate widget)
		const quaternion = calculateWidgetOrientation(normal, uAxis, vAxis, 0)
		widget.quaternion.copy(quaternion)

		widget.visible = true

		const handleRadius = 0.27
		const handleSize = 0.036
		const hitTestSize = 0.072

		// Create a circle/ring to show rotation
		const ringGeometry = new THREE.RingGeometry(handleRadius - 0.018, handleRadius + 0.018, 32)
		const ringMaterial = new THREE.MeshBasicMaterial({ 
			color: 0x0080ff,
			side: THREE.DoubleSide,
			depthTest: false
		})
		const ring = new THREE.Mesh(ringGeometry, ringMaterial)
		ring.userData.isRotateWidget = true
		widget.add(ring)

		// Create rotate handle at a distance from center
		const handleGeometry = new THREE.SphereGeometry(handleSize, 16, 16)
		const handleMaterial = new THREE.MeshBasicMaterial({ 
			color: 0x0080ff,
			depthTest: false
		})
		const handle = new THREE.Mesh(handleGeometry, handleMaterial)
		handle.position.set(handleRadius, 0, 0)
		handle.userData.isRotateHandle = true
		widget.add(handle)

		const handleEdges = new THREE.EdgesGeometry(handleGeometry)
		const handleWireframe = new THREE.LineSegments(
			handleEdges,
			new THREE.LineBasicMaterial({ 
				color: 0x0080ff, 
				opacity: 0.8, 
				transparent: true,
				depthTest: false
			})
		)
		handleWireframe.position.set(handleRadius, 0, 0)
		handleWireframe.userData.isRotateHandle = true
		widget.add(handleWireframe)

		// Invisible collider for hit testing
		const hitTestGeometry = new THREE.SphereGeometry(hitTestSize, 16, 16)
		const hitTestMaterial = new THREE.MeshBasicMaterial({
			color: 0x0080ff,
			transparent: true,
			opacity: 0,
		})
		const hitTest = new THREE.Mesh(hitTestGeometry, hitTestMaterial)
		hitTest.position.set(handleRadius, 0, 0)
		hitTest.userData.isRotateHandle = true
		hitTest.userData.isHitTest = true
		widget.add(hitTest)

		const hitTestEdges = new THREE.EdgesGeometry(hitTestGeometry)
		const hitTestWireframe = new THREE.LineSegments(
			hitTestEdges,
			new THREE.LineBasicMaterial({ color: 0x0080ff, opacity: 0.6, transparent: true })
		)
		hitTestWireframe.position.set(handleRadius, 0, 0)
		hitTestWireframe.userData.isHitTestWireframe = true
		hitTestWireframe.visible = SHOW_COLLIDERS_DEBUG
		widget.add(hitTestWireframe)

		// Store original colors in userData for hover effects
		handle.userData.originalColor = 0x0080ff
		handleWireframe.userData.originalColor = 0x0080ff
		ring.userData.originalColor = 0x0080ff

		scene.add(widget)
		return new RotateWidget(widget)
	}

	getType(): 'rotate' {
		return 'rotate'
	}

	getHandleType(intersected: THREE.Object3D): 'x' | 'y' | 'center' | null {
		// Rotate widget doesn't have x/y/center handles, only a single rotate handle
		// Return null as the handle type is determined by the widget type itself
		return null
	}

	getHandleHitResult(intersected: THREE.Object3D, intersection: THREE.Intersection): HitResult | null {
		// Check if intersected is a rotate handle
		let currentObject: THREE.Object3D | null = intersected
		while (currentObject && currentObject !== this.group) {
			if (currentObject.userData.isHitTest && currentObject.userData.isRotateHandle) {
				return {
					type: 'rotate-handle',
					object: intersected,
					intersection,
				}
			}
			currentObject = currentObject.parent
		}
		return null
	}
}

