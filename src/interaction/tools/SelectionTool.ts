import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { performHitTest } from '../hitTesting'
import { calculateTangentVectors } from '@/lib/utils'
import { CanvasRenderer } from '@/services/CanvasRenderer'
import { createImageHandle } from '@/lib/handle'

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
		if (hitResult.type === 'resize-handle' || hitResult.type === 'widget-body' || hitResult.type === 'image-handle') {
			return
		}

		// If clicked on tube, place stamp (only if no stamp exists yet)
		if (hitResult.type === 'selectable-object' && hitResult.intersection) {
			// Don't place a new stamp if one already exists
			if (storeState.stampInfo) {
				return
			}

			const intersection = hitResult.intersection
			const point = intersection.point
			const normal = intersection.normal
				? intersection.normal.clone().transformDirection(tube.matrixWorld)
				: new THREE.Vector3(0, 1, 0)

			if (intersection.uv && storeState.sourceImage && storeState.canvas) {
				const uv = intersection.uv.clone()
				const canvas = storeState.canvas
				const sourceImage = storeState.sourceImage

				const faceIndex = intersection.faceIndex ?? 0
				const { uAxis, vAxis } = calculateTangentVectors(tube.geometry, faceIndex, normal)

				const copySize = canvas.width * 0.1

				const stampInfo = {
					uv,
					sizeX: copySize,
					sizeY: copySize,
					uAxis,
					vAxis,
					normal,
				}

				storeState.setStampInfo(stampInfo)

				// Draw stamp using CanvasRenderer
				CanvasRenderer.drawStamp(canvas, sourceImage, uv, copySize, copySize)

				// Force texture update
				const texture = storeState.texture
				if (texture) {
					CanvasRenderer.updateTexture(texture)
					
					// Force material update if it's using the texture
					const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
					if (tubeMaterial && tubeMaterial.map === texture) {
						tubeMaterial.needsUpdate = true
					}
				}

				storeState.setSelectedObject(tube)

				// Create image handle at intersection point
				const existingHandle = storeState.imageHandle
				if (existingHandle && storeState.scene) {
					storeState.scene.remove(existingHandle)
					existingHandle.traverse((child: THREE.Object3D) => {
						if (child instanceof THREE.Mesh) {
							child.geometry.dispose()
							if (Array.isArray(child.material)) {
								child.material.forEach((mat) => mat.dispose())
							} else {
								child.material.dispose()
							}
						}
					})
				}
				const handle = createImageHandle(point, storeState.scene!)
				storeState.setImageHandle(handle)
				
				// Automatically select the stamp after placement
				storeState.setSelectedStampId('stamp-1')
			}
		}
	}

	onPointerMove(_event: NormalizedPointerEvent): void {
		// Selection tool doesn't need move handling
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		// Selection is complete, return to idle
	}
}

