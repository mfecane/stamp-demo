import { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Hook for handling scene resize events.
 * Updates camera aspect ratio and renderer size when container resizes.
 */
export function useSceneResize(
	mountRef: React.RefObject<HTMLDivElement>,
	renderer: React.MutableRefObject<THREE.WebGLRenderer | null>,
	camera: THREE.PerspectiveCamera | null
): void {
	useEffect(() => {
		const container = mountRef.current
		const rendererInstance = renderer.current
		if (!container || !camera || !rendererInstance) return

		const handleResize = () => {
			const newWidth = container.clientWidth
			const newHeight = container.clientHeight
			
			if (newWidth > 0 && newHeight > 0) {
				camera.aspect = newWidth / newHeight
				camera.updateProjectionMatrix()
				rendererInstance.setSize(newWidth, newHeight)
				rendererInstance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
			}
		}

		const resizeObserver = new ResizeObserver(handleResize)
		resizeObserver.observe(container)

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			resizeObserver.disconnect()
		}
	}, [mountRef, renderer, camera])
}

