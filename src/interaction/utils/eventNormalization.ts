import { NormalizedPointerEvent } from '../Tool'

export function normalizePointerEvent(event: PointerEvent): NormalizedPointerEvent {
	return {
		clientX: event.clientX,
		clientY: event.clientY,
		button: event.button,
		pointerId: event.pointerId,
	}
}

