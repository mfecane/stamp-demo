import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { Maximize2, Trash2, X, Move, RotateCw, Check } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { worldToScreen } from '@/lib/utils'
import { CanvasRenderer } from '@/services/CanvasRenderer'
import { disposeObject3D } from '@/lib/utils/resourceDisposal'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

export function StampContextMenu() {
	const store = useEditorStore()
	const selectedStampId = store.selectedStampId
	const imageHandle = store.imageHandle
	const widget = store.widget
	const camera = store.camera
	const scene = store.scene
	const canvas = store.canvas
	const texture = store.texture
	const setStampInfo = store.setStampInfo
	const setSelectedStampId = store.setSelectedStampId
	const setWidget = store.setWidget
	const setImageHandle = store.setImageHandle

	const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
	const renderer = store.renderer

	// Update position based on handle or widget position and camera
	useEffect(() => {
		if (!selectedStampId || !camera) {
			setPosition(null)
			return
		}

		// Use widget position if widget is active, otherwise use image handle
		const targetObject = widget ? widget.getGroup() : imageHandle
		if (!targetObject) {
			setPosition(null)
			return
		}

		const updatePosition = () => {
			if (!targetObject || !camera || !renderer) return

			targetObject.updateMatrixWorld(true)
			const worldPosition = new THREE.Vector3()
			targetObject.getWorldPosition(worldPosition)

			const screenPos = worldToScreen(worldPosition, camera, renderer)
			
			// Position menu below handle/widget (add offset)
			setPosition({
				x: screenPos.x,
				y: screenPos.y + 80, // Offset below handle (30px base + 50px additional)
			})
		}

		updatePosition()

		// Update on animation frame to track camera rotation and widget movement
		let animationId: number
		const animate = () => {
			updatePosition()
			animationId = requestAnimationFrame(animate)
		}
		animationId = requestAnimationFrame(animate)

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [selectedStampId, imageHandle, widget, camera, renderer])

	const handleResize = () => {
		if (!imageHandle || !store.stampInfo || !scene) return

		const worldPosition = new THREE.Vector3()
		imageHandle.getWorldPosition(worldPosition)
		const stampInfo = store.stampInfo

		store.createWidget('scaling', worldPosition, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, scene, stampInfo.rotation || 0)
	}

	const handleRotate = () => {
		if (!imageHandle || !store.stampInfo || !scene) return

		const worldPosition = new THREE.Vector3()
		imageHandle.getWorldPosition(worldPosition)
		const stampInfo = store.stampInfo

		store.createWidget('rotate', worldPosition, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, scene)
	}

	const handleDelete = () => {
		if (!canvas || !texture || !scene) return

		// Clear canvas
		CanvasRenderer.clearCanvas(canvas)
		
		// Update texture
		CanvasRenderer.updateTexture(texture)
		texture.needsUpdate = true

		// Restore original canvas texture to tube material
		const tube = store.tube
		if (tube) {
			const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
			if (tubeMaterial) {
				// Dispose render target texture if it exists
				if (tubeMaterial.map && tubeMaterial.map !== texture) {
					tubeMaterial.map.dispose()
				}
				// Restore original canvas texture
				tubeMaterial.map = texture
				tubeMaterial.needsUpdate = true
			}
		}

		// Clear lattice mesh and renderer
		store.setLatticeMesh(null)
		store.setLatticeRenderer(null)

		// Remove widget
		const currentWidget = widget
		if (currentWidget) {
			disposeObject3D(currentWidget.getGroup(), scene)
			setWidget(null)
		}

		// Remove handle
		const currentHandle = imageHandle
		if (currentHandle) {
			disposeObject3D(currentHandle, scene)
			setImageHandle(null)
		}

		// Clear stamp info and selection
		setStampInfo(null)
		setSelectedStampId(null)
	}

	const handleExitWidget = () => {
		if (!scene) return

		const currentWidget = widget
		if (currentWidget) {
			disposeObject3D(currentWidget.getGroup(), scene)
			setWidget(null)
		}
	}

	const handleMove = () => {
		if (!imageHandle || !store.stampInfo || !scene) return

		const worldPosition = new THREE.Vector3()
		imageHandle.getWorldPosition(worldPosition)
		const stampInfo = store.stampInfo

		store.createWidget('move', worldPosition, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, scene, stampInfo.rotation || 0)
	}

	if (!selectedStampId || !position) {
		return null
	}

	// Show only exit widget button when widget is visible
	if (widget) {
		return (
			<TooltipProvider>
				<div
					className="absolute z-50 bg-card border border-border rounded-md shadow-lg p-1 flex gap-1"
					style={{
						left: `${position.x}px`,
						top: `${position.y}px`,
						transform: 'translateX(-50%)',
					}}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={handleExitWidget}
								className="p-2 hover:bg-accent rounded transition-colors"
							>
								<Check className="w-4 h-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Exit widget</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		)
	}


	return (
		<TooltipProvider>
			<div
				className="absolute z-50 bg-card border border-border rounded-md shadow-lg p-1 flex gap-1"
				style={{
					left: `${position.x}px`,
					top: `${position.y}px`,
					transform: 'translateX(-50%)',
				}}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleMove}
							className="p-2 hover:bg-accent rounded transition-colors"
						>
							<Move className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Move</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleResize}
							className="p-2 hover:bg-accent rounded transition-colors"
						>
							<Maximize2 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Resize</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleRotate}
							className="p-2 hover:bg-accent rounded transition-colors"
						>
							<RotateCw className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Rotate</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={handleDelete}
							className="p-2 hover:bg-accent rounded transition-colors text-destructive"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Delete</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	)
}

