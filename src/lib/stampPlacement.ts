import * as THREE from 'three'
import { calculateTangentVectors } from './utils'
import { CanvasRenderer } from '@/services/CanvasRenderer'
import { createImageHandle } from './handle'
import type { EditorState } from '@/store/composedStore'
import { disposeObject3D } from './utils/resourceDisposal'

export function placeStampAtIntersection(
	intersection: THREE.Intersection,
	tube: THREE.Mesh,
	storeState: EditorState
): void {
	// Don't place a new stamp if one already exists
	if (storeState.stampInfo) {
		return
	}

	// Early return if source image is not available
	if (!storeState.sourceImage || !storeState.canvas) {
		return
	}

	const point = intersection.point
	const normal = intersection.normal
		? intersection.normal.clone().transformDirection(tube.matrixWorld)
		: new THREE.Vector3(0, 1, 0)

	if (!intersection.uv) {
		return
	}

	const uv = intersection.uv.clone()
	const canvas = storeState.canvas
	const sourceImage = storeState.sourceImage

	const faceIndex = intersection.faceIndex ?? 0
	const { uAxis, vAxis } = calculateTangentVectors(tube.geometry, faceIndex, normal)

	const copySize = canvas.width * 0.4

	const stampInfo = {
		uv,
		sizeX: copySize,
		sizeY: copySize,
		uAxis,
		vAxis,
		normal,
		rotation: 0,
	}

	storeState.setStampInfo(stampInfo)

	// Draw stamp using CanvasRenderer
	CanvasRenderer.drawStamp(canvas, sourceImage, uv, copySize, copySize, 0)

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
		disposeObject3D(existingHandle, storeState.scene)
	}
	const handle = createImageHandle(point, storeState.scene!)
	storeState.setImageHandle(handle)
	
	// Automatically select the stamp after placement
	storeState.setSelectedStampId('stamp-1')
}

