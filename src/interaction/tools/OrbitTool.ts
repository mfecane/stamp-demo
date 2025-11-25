import { Tool, NormalizedPointerEvent } from '../Tool'

export class OrbitTool extends Tool {
	onPointerDown(_event: NormalizedPointerEvent): void {
		this.context.controls.enabled = true
	}

	onPointerMove(_event: NormalizedPointerEvent): void {
		// Orbit controls handle movement automatically
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		// Orbit controls handle release automatically
	}
}

