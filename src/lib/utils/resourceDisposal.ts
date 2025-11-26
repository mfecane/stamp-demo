import * as THREE from 'three'

/**
 * Disposes of a Three.js Object3D and all its children, removing it from the scene.
 * Properly disposes of geometries and materials to prevent memory leaks.
 * 
 * @param object - The Object3D to dispose
 * @param scene - The scene to remove the object from
 */
export function disposeObject3D(object: THREE.Object3D, scene: THREE.Scene): void {
	scene.remove(object)
	object.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			child.geometry.dispose()
			if (Array.isArray(child.material)) {
				child.material.forEach((mat) => mat.dispose())
			} else {
				child.material.dispose()
			}
		}
	})
}

