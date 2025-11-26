import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { Maximize2, Trash2, X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { worldToScreen } from '@/lib/utils'
import { CanvasRenderer } from '@/services/CanvasRenderer'

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

	// Update position based on handle position and camera
	useEffect(() => {
		if (!selectedStampId || !imageHandle || !camera) {
			setPosition(null)
			return
		}

		const updatePosition = () => {
			if (!imageHandle || !camera || !renderer) return

			imageHandle.updateMatrixWorld(true)
			const worldPosition = new THREE.Vector3()
			imageHandle.getWorldPosition(worldPosition)

			const screenPos = worldToScreen(worldPosition, camera, renderer)
			
			// Position menu below handle (add offset)
			setPosition({
				x: screenPos.x,
				y: screenPos.y + 30, // Offset below handle
			})
		}

		updatePosition()

		// Update on animation frame to track camera rotation
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
	}, [selectedStampId, imageHandle, camera, renderer])

	const handleResize = () => {
		if (!imageHandle || !store.stampInfo || !scene) return

		const worldPosition = new THREE.Vector3()
		imageHandle.getWorldPosition(worldPosition)
		const stampInfo = store.stampInfo

		store.createWidget(worldPosition, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, scene)
	}

	const handleDelete = () => {
		if (!canvas || !texture || !scene) return

		// Clear canvas
		CanvasRenderer.clearCanvas(canvas)
		
		// Update texture
		CanvasRenderer.updateTexture(texture)

		// Remove widget
		const currentWidget = widget
		if (currentWidget) {
			scene.remove(currentWidget)
			currentWidget.traverse((child: THREE.Object3D) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose()
					if (Array.isArray(child.material)) {
						child.material.forEach((mat) => mat.dispose())
					} else {
						child.material.dispose()
					}
				}
			})
			setWidget(null)
		}

		// Remove handle
		const currentHandle = imageHandle
		if (currentHandle) {
			scene.remove(currentHandle)
			currentHandle.traverse((child: THREE.Object3D) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose()
					if (Array.isArray(child.material)) {
						child.material.forEach((mat) => mat.dispose())
					} else {
						child.material.dispose()
					}
				}
			})
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
			scene.remove(currentWidget)
			currentWidget.traverse((child: THREE.Object3D) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose()
					if (Array.isArray(child.material)) {
						child.material.forEach((mat) => mat.dispose())
					} else {
						child.material.dispose()
					}
				}
			})
			setWidget(null)
		}
	}

	if (!selectedStampId || !position) {
		return null
	}

	// Show only exit widget button when widget is visible
	if (widget) {
		return (
			<div
				className="absolute z-50 bg-card border border-border rounded-md shadow-lg p-1 flex gap-1"
				style={{
					left: `${position.x}px`,
					top: `${position.y}px`,
					transform: 'translateX(-50%)',
				}}
			>
				<button
					onClick={handleExitWidget}
					className="p-2 hover:bg-accent rounded transition-colors"
					title="Exit widget"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		)
	}

	return (
		<div
			className="absolute z-50 bg-card border border-border rounded-md shadow-lg p-1 flex gap-1"
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				transform: 'translateX(-50%)',
			}}
		>
			<button
				onClick={handleResize}
				className="p-2 hover:bg-accent rounded transition-colors"
				title="Resize"
			>
				<Maximize2 className="w-4 h-4" />
			</button>
			<button
				onClick={handleDelete}
				className="p-2 hover:bg-accent rounded transition-colors text-destructive"
				title="Delete"
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	)
}

