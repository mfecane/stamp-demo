import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BentTubeGeometry } from './lib/geometries'
import { useEditorStore } from './store/editorStore'
import { InteractionManager } from './interaction/InteractionManager'
import { NormalizedPointerEvent } from './interaction/Tool'

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
	const canvas = useEditorStore((state) => state.canvas)
	const texture = useEditorStore((state) => state.texture)
	const setSourceImage = useEditorStore((state) => state.setSourceImage)
	const isImageReady = useEditorStore((state) => state.isImageReady)
	const setIsImageReady = useEditorStore((state) => state.setIsImageReady)
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

	useEffect(() => {
		if (!mountRef.current) return

		const scene = new THREE.Scene()
		scene.background = new THREE.Color(0x222222)

		const container = mountRef.current
		const width = container.clientWidth
		const height = container.clientHeight

		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
		camera.position.set(5, 5, 5)
		camera.lookAt(0, 0, 0)

		const renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(width, height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		renderer.shadowMap.enabled = true
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		container.appendChild(renderer.domElement)
		rendererRef.current = renderer

		const controls = new OrbitControls(camera, renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.05
		controls.minDistance = 2
		controls.maxDistance = 20
		controls.enablePan = true
		controls.enableZoom = true
		controls.autoRotate = false
		controlsRef.current = controls

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
		scene.add(ambientLight)

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
		hemisphereLight.position.set(0, 10, 0)
		scene.add(hemisphereLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
		directionalLight.position.set(5, 10, 5)
		directionalLight.castShadow = true
		directionalLight.shadow.mapSize.width = 2048
		directionalLight.shadow.mapSize.height = 2048
		directionalLight.shadow.camera.near = 0.5
		directionalLight.shadow.camera.far = 50
		directionalLight.shadow.camera.left = -10
		directionalLight.shadow.camera.right = 10
		directionalLight.shadow.camera.top = 10
		directionalLight.shadow.camera.bottom = -10
		scene.add(directionalLight)

		const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
		fillLight.position.set(-5, 3, -5)
		scene.add(fillLight)

		const pointLight = new THREE.PointLight(0xffffff, 0.5, 100)
		pointLight.position.set(0, 5, 0)
		scene.add(pointLight)

		const canvas = document.createElement('canvas')
		canvas.width = 1024
		canvas.height = 1024
		const ctx = canvas.getContext('2d')!
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		const canvasTexture = new THREE.CanvasTexture(canvas)
		canvasTexture.wrapS = THREE.RepeatWrapping
		canvasTexture.wrapT = THREE.RepeatWrapping
		canvasTexture.repeat.set(1, 1)
		canvasTexture.needsUpdate = true

		const tubeGeometry = new BentTubeGeometry(0.4, 32, 80)
		const tubeMaterial = new THREE.MeshPhysicalMaterial({
			map: canvasTexture,
			color: 0xffffff,
			roughness: 0.7,
			metalness: 0.1,
			clearcoat: 0.3,
			clearcoatRoughness: 0.5,
			reflectivity: 0.2,
		})
		const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
		tube.position.set(0, -1, 0)
		tube.castShadow = true
		tube.receiveShadow = true
		scene.add(tube)

		const planeGeometry = new THREE.PlaneGeometry(10, 10)
		const planeMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.8,
			metalness: 0.2,
		})
		const plane = new THREE.Mesh(planeGeometry, planeMaterial)
		plane.rotation.x = -Math.PI / 2
		plane.position.y = -1
		plane.receiveShadow = true
		scene.add(plane)

		// Initialize store with scene objects
		store.setCamera(camera)
		store.setScene(scene)
		store.setTube(tube)
		store.setCanvas(canvas)
		store.setTexture(canvasTexture)

		// Initialize interaction manager
		const raycaster = new THREE.Raycaster()
		raycasterRef.current = raycaster
		const mouse = mouseRef.current

		const interactionManager = new InteractionManager({
			store: useEditorStore,
			renderer,
			camera,
			controls,
			raycaster,
			mouse,
		})
		interactionManagerRef.current = interactionManager

		// Unified pointer event handlers
		const handlePointerDown = (event: PointerEvent) => {
			const normalizedEvent: NormalizedPointerEvent = {
				clientX: event.clientX,
				clientY: event.clientY,
				button: event.button,
				pointerId: event.pointerId,
			}
			interactionManager.handlePointerDown(normalizedEvent)
		}

		const handlePointerMove = (event: PointerEvent) => {
			const normalizedEvent: NormalizedPointerEvent = {
				clientX: event.clientX,
				clientY: event.clientY,
				button: event.button,
				pointerId: event.pointerId,
			}
			interactionManager.handlePointerMove(normalizedEvent)
		}

		const handlePointerUp = (event: PointerEvent) => {
			const normalizedEvent: NormalizedPointerEvent = {
				clientX: event.clientX,
				clientY: event.clientY,
				button: event.button,
				pointerId: event.pointerId,
			}
			interactionManager.handlePointerUp(normalizedEvent)
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
				store.widget.traverse((child) => {
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
			if (canvasTexture) {
				canvasTexture.dispose()
			}
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height)
			}
			renderer.dispose()
			tubeGeometry.dispose()
			tubeMaterial.dispose()
			planeGeometry.dispose()
			planeMaterial.dispose()
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

			const ctx = canvas.getContext('2d')!

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
