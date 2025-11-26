import * as THREE from 'three'
import { calculateTangentVectors } from './utils'
import { createImageHandle } from './handle'
import type { EditorState } from '@/store/composedStore'
import { disposeObject3D } from './utils/resourceDisposal'
import { createLatticeMesh } from './lattice/LatticeMesh'
import { LatticeRenderer } from '@/services/LatticeRenderer'
import { useEditorStore } from '@/store/editorStore'

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

	// Size in UV units (0.4 = 40% of UV space)
	const copySize = 0.4

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

	// Create lattice mesh
	const latticeMesh = createLatticeMesh(stampInfo, sourceImage)
	storeState.setLatticeMesh(latticeMesh)

	// Create lattice renderer if it doesn't exist
	if (!storeState.latticeRenderer) {
		const latticeRenderer = new LatticeRenderer(canvas.width)
		storeState.setLatticeRenderer(latticeRenderer)
	}

	// Render lattice to texture and apply to tube
	// Get latest renderer from store (might not be in storeState parameter)
	const latestState = useEditorStore.getState()
	const renderer = latestState.renderer || storeState.renderer
	const latticeRenderer = latestState.latticeRenderer || storeState.latticeRenderer
	
	if (renderer && latticeRenderer) {
		const newTexture = latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
		
		// Apply texture to tube mesh
		const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
		if (tubeMaterial) {
			// Dispose old texture if it was a render target texture
			if (tubeMaterial.map && tubeMaterial.map !== storeState.texture) {
				tubeMaterial.map.dispose()
			}
			tubeMaterial.map = newTexture
			tubeMaterial.needsUpdate = true
		}
	} else {
		// Try to render on next frame if renderer becomes available
		requestAnimationFrame(() => {
			const retryState = useEditorStore.getState()
			if (retryState.renderer && retryState.latticeRenderer && retryState.latticeMesh) {
				const retryTexture = retryState.latticeRenderer.renderLatticeToTexture(retryState.latticeMesh, retryState.renderer)
				const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
				if (tubeMaterial) {
					if (tubeMaterial.map && tubeMaterial.map !== retryState.texture) {
						tubeMaterial.map.dispose()
					}
					tubeMaterial.map = retryTexture
					tubeMaterial.needsUpdate = true
				}
			}
		})
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

