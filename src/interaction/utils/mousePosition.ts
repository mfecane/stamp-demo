import * as THREE from 'three'

export function normalizeMousePosition(
	event: { clientX: number; clientY: number },
	renderer: THREE.WebGLRenderer,
	camera: THREE.PerspectiveCamera,
	raycaster: THREE.Raycaster,
	mouse: THREE.Vector2
): void {
	const rect = renderer.domElement.getBoundingClientRect()
	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
	raycaster.setFromCamera(mouse, camera)
}

