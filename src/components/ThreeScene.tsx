import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'
import { InteractionManager } from '@/interaction/InteractionManager'
import { normalizePointerEvent } from '@/interaction/utils/eventNormalization'
import { SceneInitializer } from '@/services/SceneInitializer'

interface ThreeSceneProps {
	imageUrl: string | null
}

function ThreeScene({ imageUrl }: ThreeSceneProps) {
	const mountRef = useRef<HTMLDivElement>(null)
	const interactionManagerRef = useRef<InteractionManager | null>(null)
	const controlsRef = useRef<OrbitControls | null>(null)
	const raycasterRef = useRef<THREE.Raycaster | null>(null)
	const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
	const store = useEditorStore()
	const canvas = store.canvas
	const texture = store.texture
	const setSourceImage = store.setSourceImage
	const isImageReady = store.isImageReady
	const setIsImageReady = store.setIsImageReady
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

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

		const { scene, camera, renderer, controls, tube, plane, canvas, texture } = sceneObjects
		rendererRef.current = renderer
		controlsRef.current = controls

		// Clear any existing stamp and widget state before initializing
		// Remove widget from scene if it exists
		const existingWidget = store.widget
		if (existingWidget && store.scene) {
			store.scene.remove(existingWidget)
			existingWidget.traverse((child: THREE.Object3D) => {
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
		
		store.setStampInfo(null)
		store.setWidget(null)
		store.setSelectedObject(null)

		// Initialize store with scene objects
		store.setCamera(camera)
		store.setScene(scene)
		store.setTube(tube)
		store.setCanvas(canvas)
		store.setTexture(texture)

		// Initialize interaction manager
		const raycaster = new THREE.Raycaster()
		raycasterRef.current = raycaster
		const mouse = mouseRef.current

		const interactionManager = new InteractionManager({
			store: {
				getState: () => useEditorStore.getState(),
			},
			renderer,
			camera,
			controls,
			raycaster,
			mouse,
		})
		interactionManagerRef.current = interactionManager

		// Unified pointer event handlers
		const handlePointerDown = (event: PointerEvent) => {
			interactionManager.handlePointerDown(normalizePointerEvent(event))
		}

		const handlePointerMove = (event: PointerEvent) => {
			interactionManager.handlePointerMove(normalizePointerEvent(event))
		}

		const handlePointerUp = (event: PointerEvent) => {
			interactionManager.handlePointerUp(normalizePointerEvent(event))
		}

		renderer.domElement.addEventListener('pointerdown', handlePointerDown)
		renderer.domElement.addEventListener('pointermove', handlePointerMove)
		renderer.domElement.addEventListener('pointerup', handlePointerUp)

		let animationId: number
		const animate = () => {
			animationId = requestAnimationFrame(animate)
			controls.update()
			renderer.render(scene, camera)
		}
		animate()

		const handleResize = () => {
			const newWidth = container.clientWidth
			const newHeight = container.clientHeight
			
			if (newWidth > 0 && newHeight > 0) {
				camera.aspect = newWidth / newHeight
				camera.updateProjectionMatrix()
				renderer.setSize(newWidth, newHeight)
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
			}
		}

		const resizeObserver = new ResizeObserver(handleResize)
		resizeObserver.observe(container)

		// Also listen to window resize as fallback
		window.addEventListener('resize', handleResize)

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
			renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
			renderer.domElement.removeEventListener('pointermove', handlePointerMove)
			renderer.domElement.removeEventListener('pointerup', handlePointerUp)
			window.removeEventListener('resize', handleResize)
			resizeObserver.disconnect()
			controls.dispose()
			if (store.widget) {
				store.widget.traverse((child: THREE.Object3D) => {
					if (child instanceof THREE.Mesh) {
						child.geometry.dispose()
						if (Array.isArray(child.material)) {
							child.material.forEach((mat) => mat.dispose())
						} else {
							child.material.dispose()
						}
					}
				})
				scene.remove(store.widget)
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
			if (plane.geometry) {
				plane.geometry.dispose()
			}
			if (plane.material && !Array.isArray(plane.material)) {
				plane.material.dispose()
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Update texture when imageUrl changes
	useEffect(() => {
		// Reset image ready state when imageUrl changes or is cleared
		setIsImageReady(false)

		if (!imageUrl || !canvas) return

		const img = new Image()
		img.crossOrigin = 'anonymous'

		img.onload = () => {
			if (!canvas) return

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			setSourceImage(img)
			setIsImageReady(true)

			ctx.fillStyle = '#ffffff'
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			if (texture) {
				texture.needsUpdate = true
			}
		}

		img.onerror = (error) => {
			console.error('Error loading image:', error)
			setIsImageReady(false)
		}

		img.src = imageUrl
	}, [imageUrl, canvas, texture, setSourceImage, setIsImageReady])

	// Update cursor style based on isImageReady state
	useEffect(() => {
		if (!rendererRef.current) return

		const renderer = rendererRef.current
		if (isImageReady) {
			renderer.domElement.style.cursor = 'crosshair'
		} else {
			renderer.domElement.style.cursor = 'default'
		}
	}, [isImageReady])

	return <div ref={mountRef} className="w-full h-full relative" style={{ minWidth: 0, minHeight: 0 }} />
}

export default ThreeScene

