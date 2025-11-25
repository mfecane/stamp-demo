import * as THREE from 'three'

export function updateCameraMatrix(camera: THREE.PerspectiveCamera): void {
	camera.updateMatrixWorld()
}

