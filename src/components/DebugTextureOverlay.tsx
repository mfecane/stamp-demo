import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import * as THREE from 'three'

/**
 * Debug overlay component that displays the render target texture.
 * Shows what's being rendered to the lattice texture.
 */
export function DebugTextureOverlay() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const store = useEditorStore()

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const latticeRenderer = store.latticeRenderer
		const renderer = store.renderer
		const latticeMesh = store.latticeMesh
		const stampInfo = store.stampInfo
		const brushStrokes = store.brushStrokes

		if (latticeRenderer && renderer && latticeMesh) {
			// Render to texture first to ensure render target is up to date
			latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)

			// Read pixels from render target
			const renderTarget = (latticeRenderer as any).renderTarget as THREE.WebGLRenderTarget
			if (renderTarget) {
				const width = renderTarget.width
				const height = renderTarget.height
				canvas.width = width
				canvas.height = height
				
				// Read pixels from render target
				const pixels = new Uint8Array(width * height * 4)
				renderer.setRenderTarget(renderTarget)
				renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)
				renderer.setRenderTarget(null)
				
				// Create ImageData and draw (flip vertically)
				const imageData = ctx.createImageData(width, height)
				// Flip pixels vertically
				for (let y = 0; y < height; y++) {
					const srcY = height - 1 - y
					for (let x = 0; x < width; x++) {
						const srcIdx = (srcY * width + x) * 4
						const dstIdx = (y * width + x) * 4
						imageData.data[dstIdx] = pixels[srcIdx]
						imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
						imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
						imageData.data[dstIdx + 3] = pixels[srcIdx + 3]
					}
				}
				ctx.putImageData(imageData, 0, 0)

				// Draw brush strokes on top of texture
				if (brushStrokes.length > 0) {
					ctx.strokeStyle = '#ff0000'
					ctx.lineWidth = 2
					ctx.lineCap = 'round'
					ctx.lineJoin = 'round'

					for (const stroke of brushStrokes) {
						if (stroke.points.length < 2) continue

						ctx.beginPath()
						const firstPoint = stroke.points[0]
						const x = firstPoint.x * canvas.width
						const y = (1 - firstPoint.y) * canvas.height // Flip V to match flipped texture
						ctx.moveTo(x, y)

						for (let i = 1; i < stroke.points.length; i++) {
							const point = stroke.points[i]
							const px = point.x * canvas.width
							const py = (1 - point.y) * canvas.height // Flip V to match flipped texture
							ctx.lineTo(px, py)
						}

						ctx.stroke()
					}
				}
			}
		}
	}, [
		store.latticeMesh, 
		store.latticeRenderer, 
		store.renderer,
		store.stampInfo?.uv.x,
		store.stampInfo?.uv.y,
		store.stampInfo?.sizeX,
		store.stampInfo?.sizeY,
		store.stampInfo?.rotation,
		store.brushStrokes,
	])

	return (
		<div className="fixed bottom-4 right-4 z-50 bg-white p-2 border-2 border-red-500 rounded">
			<div className="text-xs font-bold text-red-500 mb-1">DEBUG TEXTURE</div>
			<canvas
				ref={canvasRef}
				className="border border-gray-300"
				style={{ width: '256px', height: '256px', imageRendering: 'pixelated' }}
			/>
		</div>
	)
}

