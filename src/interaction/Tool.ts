import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'
import { normalizeMousePosition } from './utils/mousePosition'

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
}

