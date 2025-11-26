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
				
				// Create ImageData and draw
				const imageData = ctx.createImageData(width, height)
				imageData.data.set(pixels)
				ctx.putImageData(imageData, 0, 0)
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
	])

	return (
		<div className="fixed top-4 right-4 z-50 bg-white p-2 border-2 border-red-500 rounded">
			<div className="text-xs font-bold text-red-500 mb-1">DEBUG TEXTURE</div>
			<canvas
				ref={canvasRef}
				className="border border-gray-300"
				style={{ width: '256px', height: '256px', imageRendering: 'pixelated' }}
			/>
		</div>
	)
}

