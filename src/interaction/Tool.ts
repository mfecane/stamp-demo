import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'
import { normalizeMousePosition } from './utils/mousePosition'
import { updateCameraMatrix } from './utils/cameraUpdates'
import type { EditorState } from '@/store/composedStore'

export interface NormalizedPointerEvent {
	clientX: number
	clientY: number
	button: number
	pointerId: number
}

export interface ToolContext {
	store: {
		getState: () => ReturnType<typeof useEditorStore>
	}
	renderer: THREE.WebGLRenderer
	camera: THREE.PerspectiveCamera
	controls: OrbitControls
	raycaster: THREE.Raycaster
	mouse: THREE.Vector2
}

export abstract class Tool {
	protected context: ToolContext

	constructor(context: ToolContext) {
		this.context = context
	}

	abstract onPointerDown(event: NormalizedPointerEvent): void
	abstract onPointerMove(event: NormalizedPointerEvent): void
	abstract onPointerUp(event: NormalizedPointerEvent): void

	protected updateMousePosition(event: NormalizedPointerEvent): void {
		normalizeMousePosition(
			event,
			this.context.renderer,
			this.context.camera,
			this.context.raycaster,
			this.context.mouse
		)
	}

	/**
	 * Prepares the tool for use by updating camera matrix and mouse position.
	 * This is a common pattern used by all tools before processing events.
	 * 
	 * @param event - The normalized pointer event
	 * @returns Object containing the current store state and camera
	 */
	protected prepareTool(event: NormalizedPointerEvent): {
		storeState: EditorState
		camera: THREE.PerspectiveCamera
	} {
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		updateCameraMatrix(camera)
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)
		return { storeState, camera }
	}
}

