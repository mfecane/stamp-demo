import * as THREE from 'three'
import { EditorState, useEditorStore } from '@/store/editorStore'

export interface NormalizedPointerEvent {
	clientX: number
	clientY: number
	button: number
	pointerId: number
}

export interface ToolContext {
	store: typeof useEditorStore
	renderer: THREE.WebGLRenderer
	camera: THREE.PerspectiveCamera
	controls: any
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
		const rect = this.context.renderer.domElement.getBoundingClientRect()
		this.context.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		this.context.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		this.context.raycaster.setFromCamera(this.context.mouse, this.context.camera)
	}
}

