import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useEditorStore } from '@/store/editorStore'
import { InteractionManager } from '@/interaction/InteractionManager'
import { normalizePointerEvent } from '@/interaction/utils/eventNormalization'
import { SceneInitializer } from '@/services/SceneInitializer'
import { StampContextMenu } from './StampContextMenu'
import { getPositionFromUV } from '@/interaction/tools/MoveTool'
import { placeStampAtIntersection } from '@/lib/stampPlacement'
import { normalizeMousePosition } from '@/interaction/utils/mousePosition'
import { updateCameraMatrix } from '@/interaction/utils/cameraUpdates'

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
		store.setSelectedStampId(null)
		
		// Remove existing handle if any
		const existingHandle = store.imageHandle
		if (existingHandle && store.scene) {
			store.scene.remove(existingHandle)
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
		store.setImageHandle(null)

		// Initialize store with scene objects
		store.setCamera(camera)
		store.setScene(scene)
		store.setTube(tube)
		store.setCanvas(canvas)
		store.setTexture(texture)
		store.setRenderer(renderer)

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

		// Drag and drop handlers for image placement
		const handleDragOver = (event: DragEvent) => {
			event.preventDefault()
			event.stopPropagation()
			event.dataTransfer!.dropEffect = 'copy'
		}

		const handleDrop = (event: DragEvent) => {
			event.preventDefault()
			event.stopPropagation()

			// Get current store state
			const storeState = useEditorStore.getState()
			const tube = storeState.tube
			const sourceImage = storeState.sourceImage

			// Early return if source image is not available or tube doesn't exist
			if (!sourceImage || !tube) {
				return
			}

			// Don't place if stamp already exists
			if (storeState.stampInfo) {
				return
			}

			// Update camera matrix to ensure it's current
			updateCameraMatrix(camera)

			// Calculate mouse position from drop event
			const rect = renderer.domElement.getBoundingClientRect()
			const mouse = new THREE.Vector2()
			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

			// Perform raycast
			const raycaster = new THREE.Raycaster()
			raycaster.setFromCamera(mouse, camera)

			// Check for intersection with tube
			const tubeIntersects = raycaster.intersectObject(tube)
			if (tubeIntersects.length > 0) {
				placeStampAtIntersection(tubeIntersects[0], tube, storeState)
			}
		}

		renderer.domElement.addEventListener('dragover', handleDragOver)
		renderer.domElement.addEventListener('drop', handleDrop)

		let animationId: number
		const animate = () => {
			animationId = requestAnimationFrame(animate)
			controls.update()
			
			// Rotate skybox to match camera rotation
			if (skybox) {
				skybox.quaternion.copy(camera.quaternion)
			}
			
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
			renderer.domElement.removeEventListener('dragover', handleDragOver)
			renderer.domElement.removeEventListener('drop', handleDrop)
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
			if (store.imageHandle) {
				store.imageHandle.traverse((child: THREE.Object3D) => {
					if (child instanceof THREE.Mesh) {
						child.geometry.dispose()
						if (Array.isArray(child.material)) {
							child.material.forEach((mat) => mat.dispose())
						} else {
							child.material.dispose()
						}
					}
				})
				scene.remove(store.imageHandle)
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

	// Hide image handle when widget is active
	useEffect(() => {
		const imageHandle = store.imageHandle
		const widget = store.widget
		
		if (imageHandle) {
			imageHandle.visible = !widget
		}
	}, [store.widget, store.imageHandle])

	// Update image handle and widget positions/orientations when stamp UV or rotation changes
	useEffect(() => {
		const stampInfo = store.stampInfo
		const imageHandle = store.imageHandle
		const widget = store.widget
		const tube = store.tube

		if (!stampInfo || !tube || !stampInfo.uv) return

		const isMoveWidget = widget?.userData?.isMoveWidget === true
		
		// Get 3D position from UV coordinates
		const newPosition = getPositionFromUV(tube.geometry, tube, stampInfo.uv)
		if (!newPosition) return

		// Apply rotation to axes around the normal
		// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
		const normalizedN = stampInfo.normal.clone().normalize()
		const rotation = stampInfo.rotation || 0
		const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
		
		const rotatedU = stampInfo.uAxis.clone().applyQuaternion(rotationQuaternion)
		const rotatedV = stampInfo.vAxis.clone().applyQuaternion(rotationQuaternion)

		const normalizedU = rotatedU.clone().normalize()
		const normalizedV = rotatedV.clone().normalize()

		const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
		correctedV.normalize()
		const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
		if (correctedN.dot(normalizedN) < 0) {
			correctedN.negate()
		}

		const quaternion = new THREE.Quaternion()
		const matrix = new THREE.Matrix4()
		matrix.makeBasis(normalizedU, correctedV, correctedN)
		quaternion.setFromRotationMatrix(matrix)

		// Update image handle position
		if (imageHandle) {
			imageHandle.position.copy(newPosition)
			imageHandle.updateMatrixWorld(true)
		}

		// Update widget position and orientation
		if (widget) {
			// For move widgets, only update orientation (position is handled by MoveTool)
			// For other widgets, update both position and orientation
			if (!isMoveWidget) {
				widget.position.copy(newPosition)
			}
			
			// Always update widget orientation to match rotated axes
			widget.quaternion.copy(quaternion)
			widget.updateMatrixWorld(true)
		}
	}, [store.stampInfo, store.imageHandle, store.widget, store.tube])

	return (
		<div ref={mountRef} className="w-full h-full relative" style={{ minWidth: 0, minHeight: 0 }}>
			<StampContextMenu />
		</div>
	)
}

export default ThreeScene

