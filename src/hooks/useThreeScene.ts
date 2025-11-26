import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'
import { SceneInitializer } from '@/services/SceneInitializer'
import { disposeObject3D } from '@/lib/utils/resourceDisposal'

export interface SceneRefs {
	renderer: React.MutableRefObject<THREE.WebGLRenderer | null>
	controls: React.MutableRefObject<OrbitControls | null>
	skybox: React.MutableRefObject<THREE.Mesh | null>
}

/**
 * Hook for initializing and managing the Three.js scene lifecycle.
 * Handles scene creation, store initialization, and cleanup.
 */
export function useThreeScene(mountRef: React.RefObject<HTMLDivElement>): SceneRefs {
	const store = useEditorStore()
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
	const controlsRef = useRef<OrbitControls | null>(null)
	const skyboxRef = useRef<THREE.Mesh | null>(null)

	useEffect(() => {
		if (!mountRef.current) return

		const container = mountRef.current
		const width = container.clientWidth
		const height = container.clientHeight

		// Initialize scene using SceneInitializer
		const sceneObjects = SceneInitializer.createScene({
			container,
			width,
			height,
		})

		const { scene, camera, renderer, controls, tube, canvas, texture, skybox } = sceneObjects
		rendererRef.current = renderer
		controlsRef.current = controls
		skyboxRef.current = skybox

		// Clear any existing stamp and widget state before initializing
		const existingWidget = store.widget
		if (existingWidget && store.scene) {
			disposeObject3D(existingWidget.getGroup(), store.scene)
		}
		
		store.setStampInfo(null)
		store.setWidget(null)
		store.setSelectedObject(null)
		store.setSelectedStampId(null)
		// Exit brush mode when clearing selection
		if (store.isBrushMode) {
			store.setIsBrushMode(false)
			store.clearBrushStrokes()
		}
		
		const existingHandle = store.imageHandle
		if (existingHandle && store.scene) {
			disposeObject3D(existingHandle, store.scene)
		}
		store.setImageHandle(null)

		// Initialize store with scene objects
		store.setCamera(camera)
		store.setScene(scene)
		store.setTube(tube)
		store.setCanvas(canvas)
		store.setTexture(texture)
		store.setRenderer(renderer)

		return () => {
			controls.dispose()
			if (store.widget) {
				disposeObject3D(store.widget.getGroup(), scene)
			}
			if (store.imageHandle) {
				disposeObject3D(store.imageHandle, scene)
			}
			if (container && renderer.domElement) {
				container.removeChild(renderer.domElement)
			}
			if (texture) {
				texture.dispose()
			}
			if (canvas) {
				const ctx = canvas.getContext('2d')
				if (ctx) {
					ctx.clearRect(0, 0, canvas.width, canvas.height)
				}
			}
			renderer.dispose()
			if (tube.geometry) {
				tube.geometry.dispose()
			}
			if (tube.material && !Array.isArray(tube.material)) {
				tube.material.dispose()
			}
			if (skybox) {
				if (skybox.geometry) {
					skybox.geometry.dispose()
				}
				if (skybox.material && !Array.isArray(skybox.material)) {
					skybox.material.dispose()
				}
				scene.remove(skybox)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return {
		renderer: rendererRef,
		controls: controlsRef,
		skybox: skyboxRef,
	}
}

