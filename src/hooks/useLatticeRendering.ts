import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for rendering lattice mesh to texture every frame.
 * Integrates with the main animation loop to update texture in real-time.
 */
export function useLatticeRendering(): void {
	const store = useEditorStore()
	const latticeMesh = store.latticeMesh
	const latticeRenderer = store.latticeRenderer
	const renderer = store.renderer
	const tube = store.tube
	const lastMeshRef = useRef<THREE.Mesh | null>(null)

	useEffect(() => {
		if (!latticeMesh || !latticeRenderer || !renderer || !tube) {
			lastMeshRef.current = null
			return
		}

		// Check if mesh vertices changed (for brush deformation)
		const geometry = latticeMesh.geometry as THREE.PlaneGeometry
		const positions = geometry.attributes.position
		const hasChanged = lastMeshRef.current !== latticeMesh || positions.needsUpdate

		if (hasChanged) {
			// Render lattice mesh to texture
			const texture = latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
			
			// Update tube mesh material with new texture
			const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
			if (tubeMaterial) {
				// Dispose old texture if it was a render target texture
				if (tubeMaterial.map && tubeMaterial.map !== store.texture) {
					tubeMaterial.map.dispose()
				}
				tubeMaterial.map = texture
				tubeMaterial.needsUpdate = true
			}

			lastMeshRef.current = latticeMesh
			positions.needsUpdate = false
		}
	}, [latticeMesh, latticeRenderer, renderer, tube, store])
}

