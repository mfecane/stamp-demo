import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for updating cursor style based on image ready state.
 */
export function useSceneCursor(renderer: React.MutableRefObject<THREE.WebGLRenderer | null>): void {
	const store = useEditorStore()
	const isImageReady = store.isImageReady

	useEffect(() => {
		if (!renderer.current) return

		const rendererInstance = renderer.current
		if (isImageReady) {
			rendererInstance.domElement.style.cursor = 'crosshair'
		} else {
			rendererInstance.domElement.style.cursor = 'default'
		}
	}, [renderer, isImageReady])
}

