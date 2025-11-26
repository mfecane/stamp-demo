import * as THREE from 'three'

export function createImageHandle(
	position: THREE.Vector3,
	scene: THREE.Scene
): THREE.Group {
	const handle = new THREE.Group()
	handle.position.copy(position)
	handle.visible = true

	// Visual handle - small sphere
	const handleSize = 0.02
	const handleGeometry = new THREE.SphereGeometry(handleSize, 16, 16)
	const handleMaterial = new THREE.MeshBasicMaterial({ 
		color: 0x4a90e2,
		depthTest: false
	})
	const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial)
	handleMesh.userData.isImageHandle = true
	handle.add(handleMesh)

	// Edges for better visibility
	const handleEdges = new THREE.EdgesGeometry(handleGeometry)
	const handleWireframe = new THREE.LineSegments(
		handleEdges,
		new THREE.LineBasicMaterial({ 
			color: 0x4a90e2, 
			opacity: 0.8, 
			transparent: true,
			depthTest: false
		})
	)
	handleWireframe.userData.isImageHandle = true
	handle.add(handleWireframe)

	// Invisible collider for hit testing (larger than visual)
	const hitTestSize = 0.08
	const hitTestGeometry = new THREE.SphereGeometry(hitTestSize, 16, 16)
	const hitTestMaterial = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0,
	})
	const hitTest = new THREE.Mesh(hitTestGeometry, hitTestMaterial)
	hitTest.userData.isImageHandle = true
	hitTest.userData.isHitTest = true
	handle.add(hitTest)

	// Store original color for hover effects
	handleMesh.userData.originalColor = 0x4a90e2
	handleWireframe.userData.originalColor = 0x4a90e2

	scene.add(handle)
	return handle
}

export function updateHandleHoverState(handle: THREE.Group | null, isHovered: boolean): void {
	if (!handle) return

	const whiteColor = 0xffffff
	const defaultColor = 0x4a90e2
	const targetColor = isHovered ? whiteColor : defaultColor

	handle.traverse((child) => {
		// Only update visual elements, not the collider (which has isHitTest)
		if (child.userData.isImageHandle && !child.userData.isHitTest) {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(targetColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(targetColor)
			}
		}
	})
}

