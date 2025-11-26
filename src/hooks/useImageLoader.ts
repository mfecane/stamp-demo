import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for loading images and updating texture state.
 * Handles image loading, canvas updates, and ready state management.
 */
export function useImageLoader(imageUrl: string | null): void {
	const store = useEditorStore()
	const canvas = store.canvas
	const texture = store.texture
	const setSourceImage = store.setSourceImage
	const setIsImageReady = store.setIsImageReady

	useEffect(() => {
		setIsImageReady(false)

		if (!imageUrl || !canvas) return

		const img = new Image()
		img.crossOrigin = 'anonymous'

		img.onload = () => {
			if (!canvas) return

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			setSourceImage(img)
			setIsImageReady(true)

			ctx.fillStyle = '#ffffff'
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			if (texture) {
				texture.needsUpdate = true
			}
		}

		img.onerror = (error) => {
			console.error('Error loading image:', error)
			setIsImageReady(false)
		}

		img.src = imageUrl
	}, [imageUrl, canvas, texture, setSourceImage, setIsImageReady])
}

