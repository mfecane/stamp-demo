import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for rendering lattice mesh to texture in real-time.
 * Checks for vertex changes every frame and updates the texture accordingly.
 * This works alongside useSceneAnimation to ensure texture updates happen during brush strokes.
 */
export function useLatticeRendering(): void {
	const store = useEditorStore()
	const lastMeshStateRef = useRef<{
		mesh: THREE.Mesh | null
		verticesHash: string
	} | null>(null)

	useEffect(() => {
		const latticeMesh = store.latticeMesh
		const latticeRenderer = store.latticeRenderer
		const renderer = store.renderer
		const tube = store.tube

		if (!latticeMesh || !latticeRenderer || !renderer || !tube) {
			lastMeshStateRef.current = null
			return
		}

		// Use requestAnimationFrame to check for changes every frame
		// This ensures we catch vertex changes from brush tool in real-time
		let animationId: number
		const checkAndRender = () => {
			animationId = requestAnimationFrame(checkAndRender)

			const geometry = latticeMesh.geometry as THREE.PlaneGeometry
			const positions = geometry.attributes.position

			// Create a simple hash of vertex positions to detect changes
			const positionsArray = positions.array
			const verticesHash = `${positionsArray[0]},${positionsArray[1]},${positionsArray[2]},${positionsArray[positionsArray.length - 3]},${positionsArray[positionsArray.length - 2]},${positionsArray[positionsArray.length - 1]}`

			const lastState = lastMeshStateRef.current
			const hasChanged = !lastState ||
				lastState.mesh !== latticeMesh ||
				verticesHash !== lastState.verticesHash ||
				positions.needsUpdate

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

				// Update last state
				lastMeshStateRef.current = {
					mesh: latticeMesh,
					verticesHash,
				}

				// Reset needsUpdate flag
				positions.needsUpdate = false
			}
		}

		checkAndRender()

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [store])
}

