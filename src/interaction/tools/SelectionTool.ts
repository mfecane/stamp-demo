import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { performHitTest } from '../hitTesting'
import { placeStampAtIntersection } from '@/lib/stampPlacement'

export class SelectionTool extends Tool {
	onPointerDown(event: NormalizedPointerEvent): void {
		this.updateMousePosition(event)

		// Get current store state
		const storeState = this.context.store.getState()
		const widget = storeState.widget
		const tube = storeState.tube

		// Early return if source image is not available
		if (!storeState.sourceImage) {
			return
		}

		if (!tube) {
			return
		}

		// Perform hit test
		const hitResult = performHitTest(this.context.raycaster, widget, tube, storeState.imageHandle)

		// If clicked on widget or image handle, don't place new stamp
		if (hitResult.type === 'resize-handle' || hitResult.type === 'rotate-handle' || hitResult.type === 'widget-body' || hitResult.type === 'image-handle') {
			return
		}

		// If clicked on tube, place stamp (only if no stamp exists yet)
		if (hitResult.type === 'selectable-object' && hitResult.intersection) {
			placeStampAtIntersection(hitResult.intersection, tube, storeState)
		}
	}

	onPointerMove(_event: NormalizedPointerEvent): void {
		// Selection tool doesn't need move handling
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		// Selection is complete, return to idle
	}
}

