import * as THREE from 'three'

// Debug: Set to true to show widget collider wireframes for debugging hit testing
// Colliders are invisible spheres used for hit detection on widget axes
const SHOW_COLLIDERS_DEBUG = false

export function createScalingWidget(
	position: THREE.Vector3,
	normal: THREE.Vector3,
	uAxis: THREE.Vector3,
	vAxis: THREE.Vector3,
	scene: THREE.Scene
): THREE.Group {
	const widget = new THREE.Group()
	widget.position.copy(position)

	const normalizedU = uAxis.clone().normalize()
	const normalizedV = vAxis.clone().normalize()
	const normalizedN = normal.clone().normalize()

	const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
	correctedV.normalize()
	const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
	if (correctedN.dot(normalizedN) < 0) {
		correctedN.negate()
	}

	const quaternion = new THREE.Quaternion()
	const matrix = new THREE.Matrix4()
	matrix.makeBasis(normalizedU, correctedV, correctedN)
	quaternion.setFromRotationMatrix(matrix)
	widget.quaternion.copy(quaternion)

	widget.visible = true

	const arrowLength = 0.2
	const arrowHeadLength = 0.05
	const arrowHeadWidth = 0.03
	const hitTestSize = 0.04

	const xAxisHelper = new THREE.ArrowHelper(
		new THREE.Vector3(1, 0, 0),
		new THREE.Vector3(0, 0, 0),
		arrowLength,
		0xff0000,
		arrowHeadLength,
		arrowHeadWidth
	)
	xAxisHelper.userData.isXAxis = true
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
	widget.add(yAxisHelper)

	const centerGeometry = new THREE.SphereGeometry(0.02, 16, 16)
	const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
	const centerHandle = new THREE.Mesh(centerGeometry, centerMaterial)
	centerHandle.userData.isCenterHandle = true
	widget.add(centerHandle)

	const centerEdges = new THREE.EdgesGeometry(centerGeometry)
	const centerWireframe = new THREE.LineSegments(
		centerEdges,
		new THREE.LineBasicMaterial({ color: 0xffff00, opacity: 0.8, transparent: true })
	)
	widget.add(centerWireframe)

	const xHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
	const xHandleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
	const xHandle = new THREE.Mesh(xHandleGeometry, xHandleMaterial)
	xHandle.position.set(arrowLength, 0, 0)
	xHandle.userData.isXHandle = true
	widget.add(xHandle)

	const xHandleEdges = new THREE.EdgesGeometry(xHandleGeometry)
	const xHandleWireframe = new THREE.LineSegments(
		xHandleEdges,
		new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.8, transparent: true })
	)
	xHandleWireframe.position.set(arrowLength, 0, 0)
	xHandleWireframe.userData.isXHandle = true
	widget.add(xHandleWireframe)

	const yHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
	const yHandleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
	const yHandle = new THREE.Mesh(yHandleGeometry, yHandleMaterial)
	yHandle.position.set(0, arrowLength, 0)
	yHandle.userData.isYHandle = true
	widget.add(yHandle)

	const yHandleEdges = new THREE.EdgesGeometry(yHandleGeometry)
	const yHandleWireframe = new THREE.LineSegments(
		yHandleEdges,
		new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.8, transparent: true })
	)
	yHandleWireframe.position.set(0, arrowLength, 0)
	yHandleWireframe.userData.isYHandle = true
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

	scene.add(widget)
	return widget
}

export function updateWidgetHoverState(widget: THREE.Group | null, hoveredAxis: 'x' | 'y' | 'center' | null): void {
	if (!widget) return

	const whiteColor = 0xffffff
	const xColor = hoveredAxis === 'x' ? whiteColor : 0xff0000
	const yColor = hoveredAxis === 'y' ? whiteColor : 0x00ff00
	const centerColor = hoveredAxis === 'center' ? whiteColor : 0xffff00

	widget.traverse((child) => {
		if (child.userData.isXAxis || child.userData.isXHandle) {
			if (child instanceof THREE.ArrowHelper) {
				child.setColor(xColor)
			} else if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(xColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(xColor)
			}
		}
		if (child.userData.isYAxis || child.userData.isYHandle) {
			if (child instanceof THREE.ArrowHelper) {
				child.setColor(yColor)
			} else if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(yColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(yColor)
			}
		}
		if (child.userData.isCenterHandle) {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(centerColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(centerColor)
			}
		}
	})
}

