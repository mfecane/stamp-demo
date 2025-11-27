import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import * as THREE from 'three'
import { Image, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BRUSH_CONSTANTS } from '@/interaction/tools/constants'

/**
 * Texture overlay component that displays the render target texture.
 * Shows what's being rendered to the lattice texture with brush strokes overlay.
 * Can be toggled on/off and resized.
 */
export function TextureOverlay() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const resizeHandleRef = useRef<HTMLDivElement>(null)
	const store = useEditorStore()
	const [isVisible, setIsVisible] = useState(false)
	const [size, setSize] = useState({ width: 320, height: 320 })
	const [position, setPosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
	const [isResizing, setIsResizing] = useState(false)
	const [isDragging, setIsDragging] = useState(false)
	const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !isVisible) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const latticeRenderer = store.latticeRenderer
		const renderer = store.renderer
		const latticeMesh = store.latticeMesh
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

				// Draw brush strokes on top of texture (if enabled)
				if (BRUSH_CONSTANTS.SHOW_BRUSH_STROKES && brushStrokes.length > 0) {
					ctx.strokeStyle = '#ef4444'
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
		isVisible,
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

	// Handle resize
	useEffect(() => {
		if (!isResizing) return

		const container = containerRef.current
		if (!container) return

		const startRect = container.getBoundingClientRect()
		const startSize = { ...size }
		const startMouseX = startRect.right
		const startMouseY = startRect.bottom

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - startMouseX
			const deltaY = e.clientY - startMouseY
			const newWidth = Math.max(200, Math.min(800, startSize.width + deltaX))
			const newHeight = Math.max(200, Math.min(800, startSize.height + deltaY))
			setSize({ width: newWidth, height: newHeight })
		}

		const handleMouseUp = () => {
			setIsResizing(false)
		}

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isResizing, size])

	// Handle drag
	useEffect(() => {
		if (!isDragging) return

		const handleMouseMove = (e: MouseEvent) => {
			const container = containerRef.current
			if (!container) return

			const deltaX = e.clientX - dragStartRef.current.startX
			const deltaY = e.clientY - dragStartRef.current.startY

			// Get current position (if null, calculate from right/bottom)
			const currentX = dragStartRef.current.x ?? window.innerWidth - size.width - 64
			const currentY = dragStartRef.current.y ?? window.innerHeight - size.height - 64

			// Constrain to viewport
			const maxX = window.innerWidth - size.width
			const maxY = window.innerHeight - size.height

			setPosition({
				x: Math.max(0, Math.min(maxX, currentX + deltaX)),
				y: Math.max(0, Math.min(maxY, currentY + deltaY)),
			})
		}

		const handleMouseUp = () => {
			setIsDragging(false)
		}

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging, size])

	const handleResizeStart = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsResizing(true)
	}

	const handleDragStart = (e: React.MouseEvent) => {
		if (e.target === resizeHandleRef.current || (e.target as HTMLElement).closest('[data-resize-handle]')) return
		const container = containerRef.current
		if (!container) return

		const rect = container.getBoundingClientRect()
		// Calculate current position (accounting for null = right/bottom positioning)
		const currentX = position.x ?? window.innerWidth - rect.width - 64
		const currentY = position.y ?? window.innerHeight - rect.height - 64

		dragStartRef.current = {
			x: currentX,
			y: currentY,
			startX: e.clientX,
			startY: e.clientY,
		}
		setIsDragging(true)
	}

	return (
		<>
			{/* Toggle Button */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={() => setIsVisible(!isVisible)}
							className="fixed bottom-4 right-4 z-50 p-3 bg-card border border-border rounded-md shadow-lg hover:bg-accent transition-colors"
							aria-label={isVisible ? 'Hide texture overlay' : 'Show texture overlay'}
						>
							{isVisible ? (
								<X className="w-5 h-5 text-foreground" />
							) : (
								<Image className="w-5 h-5 text-foreground" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{isVisible ? 'Hide texture overlay' : 'Show texture overlay'}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Overlay Panel */}
			{isVisible && (
				<div
					ref={containerRef}
					onMouseDown={handleDragStart}
					className="fixed z-40 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
					style={{
						width: `${size.width}px`,
						height: `${size.height}px`,
						...(position.x !== null && position.y !== null
							? { left: `${position.x}px`, top: `${position.y}px` }
							: { right: '4rem', bottom: '4rem' }),
					}}
				>
					{/* Header */}
					<div
						className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<h3 className="text-sm font-semibold text-foreground">Texture</h3>
						<button
							onClick={() => setIsVisible(false)}
							onMouseDown={(e) => e.stopPropagation()}
							className="p-1 hover:bg-accent rounded transition-colors"
							aria-label="Close overlay"
						>
							<X className="w-4 h-4 text-muted-foreground" />
						</button>
					</div>

					{/* Canvas Container */}
					<div
						className="relative w-full h-[calc(100%-2.5rem)] bg-muted/30"
						style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
					>
						<canvas
							ref={canvasRef}
							className="w-full h-full object-contain pointer-events-none"
							style={{ imageRendering: 'pixelated' }}
						/>
					</div>

					{/* Resize Handle */}
					<div
						ref={resizeHandleRef}
						data-resize-handle
						onMouseDown={handleResizeStart}
						className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize group"
						style={{
							clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
						}}
					>
						<div className="absolute bottom-0 right-0 w-full h-full bg-border/50 group-hover:bg-primary/70 transition-colors" />
						<div className="absolute bottom-1 right-1 w-1 h-1 bg-foreground/40 rounded-full" />
						<div className="absolute bottom-1 right-3 w-1 h-1 bg-foreground/40 rounded-full" />
						<div className="absolute bottom-3 right-1 w-1 h-1 bg-foreground/40 rounded-full" />
					</div>
				</div>
			)}
		</>
	)
}

