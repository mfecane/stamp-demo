import * as THREE from 'three'
import { BaseWidget } from './BaseWidget'
import type { HitResult } from '@/types/hitResult'
import { SHOW_COLLIDERS_DEBUG } from './constants'
import { calculateWidgetOrientation } from './utils/axisRotation'

// Move widget class
export class MoveWidget extends BaseWidget {
	constructor(group: THREE.Group) {
		super(group)
	}

	static create(
		position: THREE.Vector3,
		normal: THREE.Vector3,
		uAxis: THREE.Vector3,
		vAxis: THREE.Vector3,
		scene: THREE.Scene,
		rotation: number = 0
	): MoveWidget {
		const widget = new THREE.Group()
		widget.position.copy(position)

		// Calculate widget orientation from axes and rotation
		const quaternion = calculateWidgetOrientation(normal, uAxis, vAxis, rotation)
		widget.quaternion.copy(quaternion)

		widget.visible = true
		widget.userData.isMoveWidget = true

		const arrowLength = 0.36
		const arrowHeadLength = 0.09
		const arrowHeadWidth = 0.054
		const hitTestSize = 0.072

		const xAxisHelper = new THREE.ArrowHelper(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 0, 0),
			arrowLength,
			0xff0000,
			arrowHeadLength,
			arrowHeadWidth
		)
		xAxisHelper.userData.isXAxis = true
		xAxisHelper.userData.isMoveWidget = true
		// Disable depth test for ArrowHelper materials
		if (xAxisHelper.line && xAxisHelper.line.material instanceof THREE.LineBasicMaterial) {
			xAxisHelper.line.material.depthTest = false
		}
		if (xAxisHelper.cone && xAxisHelper.cone.material instanceof THREE.MeshBasicMaterial) {
			xAxisHelper.cone.material.depthTest = false
		}
		widget.add(xAxisHelper)

		const yAxisHelper = new THREE.ArrowHelper(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(0, 0, 0),
			arrowLength,
			0x00ff00,
			arrowHeadLength,
			arrowHeadWidth
		)
		yAxisHelper.userData.isYAxis = true
		yAxisHelper.userData.isMoveWidget = true
		// Disable depth test for ArrowHelper materials
		if (yAxisHelper.line && yAxisHelper.line.material instanceof THREE.LineBasicMaterial) {
			yAxisHelper.line.material.depthTest = false
		}
		if (yAxisHelper.cone && yAxisHelper.cone.material instanceof THREE.MeshBasicMaterial) {
			yAxisHelper.cone.material.depthTest = false
		}
		widget.add(yAxisHelper)

		const centerGeometry = new THREE.SphereGeometry(0.036, 16, 16)
		const centerMaterial = new THREE.MeshBasicMaterial({ 
			color: 0xffff00,
			depthTest: false
		})
		const centerHandle = new THREE.Mesh(centerGeometry, centerMaterial)
		centerHandle.userData.isCenterHandle = true
		centerHandle.userData.isMoveWidget = true
		widget.add(centerHandle)

		const xHandleGeometry = new THREE.SphereGeometry(0.027, 16, 16)
		const xHandleMaterial = new THREE.MeshBasicMaterial({ 
			color: 0xff0000,
			depthTest: false
		})
		const xHandle = new THREE.Mesh(xHandleGeometry, xHandleMaterial)
		xHandle.position.set(arrowLength, 0, 0)
		xHandle.userData.isXHandle = true
		xHandle.userData.isMoveWidget = true
		widget.add(xHandle)

		const xHandleEdges = new THREE.EdgesGeometry(xHandleGeometry)
		const xHandleWireframe = new THREE.LineSegments(
			xHandleEdges,
			new THREE.LineBasicMaterial({ 
				color: 0xff0000, 
				opacity: 0.8, 
				transparent: true,
				depthTest: false
			})
		)
		xHandleWireframe.position.set(arrowLength, 0, 0)
		xHandleWireframe.userData.isXHandle = true
		xHandleWireframe.userData.isMoveWidget = true
		widget.add(xHandleWireframe)

		const yHandleGeometry = new THREE.SphereGeometry(0.027, 16, 16)
		const yHandleMaterial = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00,
			depthTest: false
		})
		const yHandle = new THREE.Mesh(yHandleGeometry, yHandleMaterial)
		yHandle.position.set(0, arrowLength, 0)
		yHandle.userData.isYHandle = true
		yHandle.userData.isMoveWidget = true
		widget.add(yHandle)

		const yHandleEdges = new THREE.EdgesGeometry(yHandleGeometry)
		const yHandleWireframe = new THREE.LineSegments(
			yHandleEdges,
			new THREE.LineBasicMaterial({ 
				color: 0x00ff00, 
				opacity: 0.8, 
				transparent: true,
				depthTest: false
			})
		)
		yHandleWireframe.position.set(0, arrowLength, 0)
		yHandleWireframe.userData.isYHandle = true
		yHandleWireframe.userData.isMoveWidget = true
		widget.add(yHandleWireframe)

		const xHitTestGeometry = new THREE.SphereGeometry(hitTestSize, 16, 16)
		const xHitTestMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0,
		})
		const xHitTest = new THREE.Mesh(xHitTestGeometry, xHitTestMaterial)
		xHitTest.position.set(arrowLength, 0, 0)
		xHitTest.userData.isXHandle = true
		xHitTest.userData.isXAxis = true
		xHitTest.userData.isMoveWidget = true
		xHitTest.userData.isHitTest = true
		widget.add(xHitTest)

		const xHitTestEdges = new THREE.EdgesGeometry(xHitTestGeometry)
		const xHitTestWireframe = new THREE.LineSegments(
			xHitTestEdges,
			new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.6, transparent: true })
		)
		xHitTestWireframe.position.set(arrowLength, 0, 0)
		xHitTestWireframe.userData.isHitTestWireframe = true
		xHitTestWireframe.visible = SHOW_COLLIDERS_DEBUG
		widget.add(xHitTestWireframe)

		const yHitTestGeometry = new THREE.SphereGeometry(hitTestSize, 16, 16)
		const yHitTestMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0,
		})
		const yHitTest = new THREE.Mesh(yHitTestGeometry, yHitTestMaterial)
		yHitTest.position.set(0, arrowLength, 0)
		yHitTest.userData.isYHandle = true
		yHitTest.userData.isYAxis = true
		yHitTest.userData.isMoveWidget = true
		yHitTest.userData.isHitTest = true
		widget.add(yHitTest)

		const yHitTestEdges = new THREE.EdgesGeometry(yHitTestGeometry)
		const yHitTestWireframe = new THREE.LineSegments(
			yHitTestEdges,
			new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.6, transparent: true })
		)
		yHitTestWireframe.position.set(0, arrowLength, 0)
		yHitTestWireframe.userData.isHitTestWireframe = true
		yHitTestWireframe.visible = SHOW_COLLIDERS_DEBUG
		widget.add(yHitTestWireframe)

		const centerHitTestGeometry = new THREE.SphereGeometry(hitTestSize, 16, 16)
		const centerHitTestMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			transparent: true,
			opacity: 0,
		})
		const centerHitTest = new THREE.Mesh(centerHitTestGeometry, centerHitTestMaterial)
		centerHitTest.position.set(0, 0, 0)
		centerHitTest.userData.isCenterHandle = true
		centerHitTest.userData.isMoveWidget = true
		centerHitTest.userData.isHitTest = true
		widget.add(centerHitTest)

		const centerHitTestEdges = new THREE.EdgesGeometry(centerHitTestGeometry)
		const centerHitTestWireframe = new THREE.LineSegments(
			centerHitTestEdges,
			new THREE.LineBasicMaterial({ color: 0xffff00, opacity: 0.6, transparent: true })
		)
		centerHitTestWireframe.position.set(0, 0, 0)
		centerHitTestWireframe.userData.isHitTestWireframe = true
		centerHitTestWireframe.visible = SHOW_COLLIDERS_DEBUG
		widget.add(centerHitTestWireframe)

		// Store original colors in userData for hover effects
		xAxisHelper.userData.originalColor = 0xff0000
		yAxisHelper.userData.originalColor = 0x00ff00
		xHandle.userData.originalColor = 0xff0000
		yHandle.userData.originalColor = 0x00ff00
		xHandleWireframe.userData.originalColor = 0xff0000
		yHandleWireframe.userData.originalColor = 0x00ff00
		centerHandle.userData.originalColor = 0xffff00

		scene.add(widget)
		return new MoveWidget(widget)
	}

	getType(): 'move' {
		return 'move'
	}

	getHandleType(intersected: THREE.Object3D): 'x' | 'y' | 'center' | null {
		let currentObject: THREE.Object3D | null = intersected
		while (currentObject && currentObject !== this.group) {
			if (currentObject.userData.isHitTest) {
				if (currentObject.userData.isXAxis || currentObject.userData.isXHandle) {
					return 'x'
				}
				if (currentObject.userData.isYAxis || currentObject.userData.isYHandle) {
					return 'y'
				}
				if (currentObject.userData.isCenterHandle) {
					return 'center'
				}
			}
			currentObject = currentObject.parent
		}
		return null
	}

	getHandleHitResult(intersected: THREE.Object3D, intersection: THREE.Intersection): HitResult | null {
		const handleType = this.getHandleType(intersected)
		if (handleType) {
			return {
				type: 'move-handle',
				object: intersected,
				intersection,
				handleType,
			}
		}
		return null
	}
}

