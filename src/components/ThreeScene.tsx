import { useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { StampContextMenu } from './StampContextMenu'
import { useThreeScene } from '@/hooks/useThreeScene'
import { useSceneEventHandlers } from '@/hooks/useSceneEventHandlers'
import { useSceneAnimation } from '@/hooks/useSceneAnimation'
import { useImageLoader } from '@/hooks/useImageLoader'
import { useWidgetPositionSync } from '@/hooks/useWidgetPositionSync'
import { useSceneResize } from '@/hooks/useSceneResize'
import { useSceneCursor } from '@/hooks/useSceneCursor'
import { useImageHandleVisibility } from '@/hooks/useImageHandleVisibility'

interface ThreeSceneProps {
	imageUrl: string | null
}

function ThreeScene({ imageUrl }: ThreeSceneProps) {
	const mountRef = useRef<HTMLDivElement>(null)
	const store = useEditorStore()
	const camera = store.camera
	const scene = store.scene

	// Initialize scene and get refs
	const { renderer, controls, skybox } = useThreeScene(mountRef)

	// Set up event handlers
	useSceneEventHandlers(renderer, camera, controls)

	// Set up animation loop
	useSceneAnimation(renderer, camera, scene, controls, skybox)

	// Handle resize
	useSceneResize(mountRef, renderer, camera)

	// Load image
	useImageLoader(imageUrl)

	// Update cursor style
	useSceneCursor(renderer)

	// Manage image handle visibility
	useImageHandleVisibility()

	// Sync widget and handle positions
	useWidgetPositionSync()

	return (
		<div ref={mountRef} className="w-full h-full relative" style={{ minWidth: 0, minHeight: 0 }}>
			<StampContextMenu />
		</div>
	)
}

export default ThreeScene

