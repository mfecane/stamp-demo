import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InteractionManager } from '@/interaction/InteractionManager'
import { normalizePointerEvent } from '@/interaction/utils/eventNormalization'
import { placeStampAtIntersection } from '@/lib/stampPlacement'
import { normalizeMousePosition } from '@/interaction/utils/mousePosition'
import { updateCameraMatrix } from '@/interaction/utils/cameraUpdates'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for managing scene event handlers (pointer events and drag/drop).
 * Handles user interactions with the 3D scene.
 */
export function useSceneEventHandlers(
	renderer: React.MutableRefObject<THREE.WebGLRenderer | null>,
	camera: THREE.PerspectiveCamera | null,
	controls: React.MutableRefObject<OrbitControls | null>
): React.MutableRefObject<InteractionManager | null> {
	const interactionManagerRef = useRef<InteractionManager | null>(null)
	const raycasterRef = useRef<THREE.Raycaster | null>(null)
	const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())

	useEffect(() => {
		const rendererInstance = renderer.current
		const controlsInstance = controls.current
		if (!rendererInstance || !camera || !controlsInstance) return

		// Initialize interaction manager
		const raycaster = new THREE.Raycaster()
		raycasterRef.current = raycaster
		const mouse = mouseRef.current

		const interactionManager = new InteractionManager({
			store: {
				getState: () => useEditorStore.getState(),
			},
			renderer: rendererInstance,
			camera,
			controls: controlsInstance,
			raycaster,
			mouse,
		})
		interactionManagerRef.current = interactionManager

		// Unified pointer event handlers
		const handlePointerDown = (event: PointerEvent) => {
			interactionManager.handlePointerDown(normalizePointerEvent(event))
		}

		const handlePointerMove = (event: PointerEvent) => {
			interactionManager.handlePointerMove(normalizePointerEvent(event))
		}

		const handlePointerUp = (event: PointerEvent) => {
			interactionManager.handlePointerUp(normalizePointerEvent(event))
		}

		rendererInstance.domElement.addEventListener('pointerdown', handlePointerDown)
		rendererInstance.domElement.addEventListener('pointermove', handlePointerMove)
		rendererInstance.domElement.addEventListener('pointerup', handlePointerUp)

		// Drag and drop handlers for image placement
		const handleDragOver = (event: DragEvent) => {
			event.preventDefault()
			event.stopPropagation()
			event.dataTransfer!.dropEffect = 'copy'
		}

		const handleDrop = (event: DragEvent) => {
			event.preventDefault()
			event.stopPropagation()

			const storeState = useEditorStore.getState()
			const tube = storeState.tube
			const sourceImage = storeState.sourceImage

			if (!sourceImage || !tube) {
				return
			}

			if (storeState.stampInfo) {
				return
			}

			updateCameraMatrix(camera)

			const rect = rendererInstance.domElement.getBoundingClientRect()
			const mouse = new THREE.Vector2()
			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

			const raycaster = new THREE.Raycaster()
			raycaster.setFromCamera(mouse, camera)

			const tubeIntersects = raycaster.intersectObject(tube)
			if (tubeIntersects.length > 0) {
				placeStampAtIntersection(tubeIntersects[0], tube, storeState)
			}
		}

		rendererInstance.domElement.addEventListener('dragover', handleDragOver)
		rendererInstance.domElement.addEventListener('drop', handleDrop)

		return () => {
			rendererInstance.domElement.removeEventListener('pointerdown', handlePointerDown)
			rendererInstance.domElement.removeEventListener('pointermove', handlePointerMove)
			rendererInstance.domElement.removeEventListener('pointerup', handlePointerUp)
			rendererInstance.domElement.removeEventListener('dragover', handleDragOver)
			rendererInstance.domElement.removeEventListener('drop', handleDrop)
		}
	}, [renderer, camera, controls])

	return interactionManagerRef
}

