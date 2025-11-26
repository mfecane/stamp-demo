import * as THREE from 'three'

// Debug: Set to true to show widget collider wireframes for debugging hit testing
// Colliders are invisible spheres used for hit detection on widget axes
const SHOW_COLLIDERS_DEBUG = false

export function createScalingWidget(
	position: THREE.Vector3,
	normal: THREE.Vector3,
	uAxis: THREE.Vector3,
	vAxis: THREE.Vector3,
	scene: THREE.Scene,
	rotation: number = 0
): THREE.Group {
	const widget = new THREE.Group()
	widget.position.copy(position)

	// Apply rotation to axes around the normal
	// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
	const normalizedN = normal.clone().normalize()
	const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
	
	const rotatedU = uAxis.clone().applyQuaternion(rotationQuaternion)
	const rotatedV = vAxis.clone().applyQuaternion(rotationQuaternion)

	const normalizedU = rotatedU.clone().normalize()
	const normalizedV = rotatedV.clone().normalize()

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
	// Disable depth test for ArrowHelper materials
	if (yAxisHelper.line && yAxisHelper.line.material instanceof THREE.LineBasicMaterial) {
		yAxisHelper.line.material.depthTest = false
	}
	if (yAxisHelper.cone && yAxisHelper.cone.material instanceof THREE.MeshBasicMaterial) {
		yAxisHelper.cone.material.depthTest = false
	}
	widget.add(yAxisHelper)

	const centerGeometry = new THREE.SphereGeometry(0.02, 16, 16)
	const centerMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xffff00,
		depthTest: false
	})
	const centerHandle = new THREE.Mesh(centerGeometry, centerMaterial)
	centerHandle.userData.isCenterHandle = true
	widget.add(centerHandle)

	const xHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
	const xHandleMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xff0000,
		depthTest: false
	})
	const xHandle = new THREE.Mesh(xHandleGeometry, xHandleMaterial)
	xHandle.position.set(arrowLength, 0, 0)
	xHandle.userData.isXHandle = true
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
	widget.add(xHandleWireframe)

	const yHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
	const yHandleMaterial = new THREE.MeshBasicMaterial({ 
		color: 0x00ff00,
		depthTest: false
	})
	const yHandle = new THREE.Mesh(yHandleGeometry, yHandleMaterial)
	yHandle.position.set(0, arrowLength, 0)
	yHandle.userData.isYHandle = true
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
	centerHandle.userData.originalColor = 0xffff00

	scene.add(widget)
	return widget
}

export function createMoveWidget(
	position: THREE.Vector3,
	normal: THREE.Vector3,
	uAxis: THREE.Vector3,
	vAxis: THREE.Vector3,
	scene: THREE.Scene,
	rotation: number = 0
): THREE.Group {
	const widget = new THREE.Group()
	widget.position.copy(position)

	// Apply rotation to axes around the normal
	// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
	const normalizedN = normal.clone().normalize()
	const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
	
	const rotatedU = uAxis.clone().applyQuaternion(rotationQuaternion)
	const rotatedV = vAxis.clone().applyQuaternion(rotationQuaternion)

	const normalizedU = rotatedU.clone().normalize()
	const normalizedV = rotatedV.clone().normalize()

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
	widget.userData.isMoveWidget = true

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

	const centerGeometry = new THREE.SphereGeometry(0.02, 16, 16)
	const centerMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xffff00,
		depthTest: false
	})
	const centerHandle = new THREE.Mesh(centerGeometry, centerMaterial)
	centerHandle.userData.isCenterHandle = true
	centerHandle.userData.isMoveWidget = true
	widget.add(centerHandle)

	const xHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
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

	const yHandleGeometry = new THREE.SphereGeometry(0.015, 16, 16)
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
	return widget
}

export function createRotateWidget(
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

	const handleRadius = 0.15
	const handleSize = 0.02
	const hitTestSize = 0.04

	// Create a circle/ring to show rotation
	const ringGeometry = new THREE.RingGeometry(handleRadius - 0.01, handleRadius + 0.01, 32)
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
	return widget
}

export function updateWidgetHoverState(widget: THREE.Group | null, hoveredAxis: 'x' | 'y' | 'center' | null): void {
	if (!widget) return

	const whiteColor = 0xffffff
	// Determine base colors based on widget type
	let xBaseColor = 0xff0000
	let yBaseColor = 0x00ff00
	let centerBaseColor = 0xffff00
	
	// Check if this is a move widget
	let isMoveWidget = false
	widget.traverse((child) => {
		if (child.userData.isMoveWidget) {
			isMoveWidget = true
		}
	})
	
	if (isMoveWidget) {
		xBaseColor = 0xff0000  // Red for X axis (same as scale widget)
		yBaseColor = 0x00ff00  // Green for Y axis (same as scale widget)
		centerBaseColor = 0xffff00  // Yellow for center (same as scale widget)
	}
	
	const xColor = hoveredAxis === 'x' ? whiteColor : xBaseColor
	const yColor = hoveredAxis === 'y' ? whiteColor : yBaseColor
	const centerColor = hoveredAxis === 'center' ? whiteColor : centerBaseColor

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
		if (child.userData.isCenterHandle && !child.userData.isHitTest) {
			// Only update visual center handle, not the collider
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(centerColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(centerColor)
			}
		}
	})
}

export function updateRotateWidgetHoverState(widget: THREE.Group | null, isHovered: boolean): void {
	if (!widget) return

	const whiteColor = 0xffffff
	const defaultColor = 0x0080ff
	const targetColor = isHovered ? whiteColor : defaultColor

	widget.traverse((child) => {
		if (child.userData.isRotateHandle || child.userData.isRotateWidget) {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(targetColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(targetColor)
			}
		}
	})
}

