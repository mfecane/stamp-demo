import { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Hook for managing the Three.js animation loop.
 * Handles rendering and camera/skybox updates.
 */
export function useSceneAnimation(
	renderer: React.MutableRefObject<THREE.WebGLRenderer | null>,
	camera: THREE.PerspectiveCamera | null,
	scene: THREE.Scene | null,
	controls: React.MutableRefObject<OrbitControls | null>,
	skybox: React.MutableRefObject<THREE.Mesh | null>
): void {
	useEffect(() => {
		const rendererInstance = renderer.current
		const controlsInstance = controls.current
		const skyboxInstance = skybox.current
		if (!rendererInstance || !camera || !scene || !controlsInstance) return

		let animationId: number
		const animate = () => {
			animationId = requestAnimationFrame(animate)
			controlsInstance.update()
			
			if (skyboxInstance) {
				skyboxInstance.quaternion.copy(camera.quaternion)
			}
			
			rendererInstance.render(scene, camera)
		}
		animate()

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [renderer, camera, scene, controls, skybox])
}

