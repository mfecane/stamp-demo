import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for managing the Three.js animation loop.
 * Handles rendering and camera/skybox updates.
 * Renders lattice mesh to texture only when transforms or vertices change.
 */
export function useSceneAnimation(
	renderer: React.MutableRefObject<THREE.WebGLRenderer | null>,
	camera: THREE.PerspectiveCamera | null,
	scene: THREE.Scene | null,
	controls: React.MutableRefObject<OrbitControls | null>,
	skybox: React.MutableRefObject<THREE.Mesh | null>
): void {
	const store = useEditorStore()
	const lastMeshStateRef = useRef<{
		mesh: THREE.Mesh | null
		position: THREE.Vector3
		scale: THREE.Vector3
		rotation: number
		verticesHash: string
	} | null>(null)

	useEffect(() => {
		const rendererInstance = renderer.current
		const controlsInstance = controls.current
		const skyboxInstance = skybox.current
		if (!rendererInstance || !camera || !scene || !controlsInstance) return

		let animationId: number
		const animate = () => {
			animationId = requestAnimationFrame(animate)
			controlsInstance.update()
			
			if (skyboxInstance) {
				skyboxInstance.quaternion.copy(camera.quaternion)
			}

			// Check if lattice mesh needs re-rendering
			const latticeMesh = store.latticeMesh
			const latticeRenderer = store.latticeRenderer
			const tube = store.tube
			
			if (latticeMesh && latticeRenderer && tube) {
				const geometry = latticeMesh.geometry as THREE.PlaneGeometry
				const positions = geometry.attributes.position
				
				// Check if mesh changed (transform or vertices)
				const currentPosition = latticeMesh.position.clone()
				const currentScale = latticeMesh.scale.clone()
				const currentRotation = latticeMesh.rotation.z
				
				// Create a simple hash of vertex positions to detect changes
				const positionsArray = positions.array
				const verticesHash = `${positionsArray[0]},${positionsArray[1]},${positionsArray[2]},${positionsArray[positionsArray.length - 3]},${positionsArray[positionsArray.length - 2]},${positionsArray[positionsArray.length - 1]}`
				
				const lastState = lastMeshStateRef.current
				const hasChanged = !lastState ||
					lastState.mesh !== latticeMesh ||
					!currentPosition.equals(lastState.position) ||
					!currentScale.equals(lastState.scale) ||
					currentRotation !== lastState.rotation ||
					verticesHash !== lastState.verticesHash ||
					positions.needsUpdate

				if (hasChanged) {
					// Render lattice mesh to texture
					const texture = latticeRenderer.renderLatticeToTexture(latticeMesh, rendererInstance)
					const tubeMaterial = tube.material as THREE.MeshPhysicalMaterial
					if (tubeMaterial) {
						if (tubeMaterial.map && tubeMaterial.map !== store.texture) {
							tubeMaterial.map.dispose()
						}
						tubeMaterial.map = texture
						tubeMaterial.needsUpdate = true
					}

					// Update last state
					lastMeshStateRef.current = {
						mesh: latticeMesh,
						position: currentPosition,
						scale: currentScale,
						rotation: currentRotation,
						verticesHash,
					}
					
					// Reset needsUpdate flag
					positions.needsUpdate = false
				}
			} else {
				// Reset last state if mesh is removed
				lastMeshStateRef.current = null
			}
			
			rendererInstance.render(scene, camera)
		}
		animate()

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [renderer, camera, scene, controls, skybox, store])
}

