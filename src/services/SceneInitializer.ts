import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BentTubeGeometry } from '@/lib/geometries'
import { createGradientSkybox } from '@/lib/gradientSkybox'

export interface SceneConfig {
	container: HTMLElement
	width: number
	height: number
}

export interface SceneObjects {
	scene: THREE.Scene
	camera: THREE.PerspectiveCamera
	renderer: THREE.WebGLRenderer
	controls: OrbitControls
	tube: THREE.Mesh
	canvas: HTMLCanvasElement
	texture: THREE.CanvasTexture
	skybox: THREE.Mesh
}

export class SceneInitializer {
	static createScene(config: SceneConfig): SceneObjects {
		const scene = new THREE.Scene()

		const camera = new THREE.PerspectiveCamera(75, config.width / config.height, 0.1, 1000)
		camera.position.set(2.0, 2.0, 2.0)
		camera.lookAt(0, 0, 0)

		const renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(config.width, config.height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		renderer.shadowMap.enabled = true
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		config.container.appendChild(renderer.domElement)

		const controls = new OrbitControls(camera, renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.05
		controls.minDistance = 1
		controls.maxDistance = 20
		controls.enablePan = true
		controls.enableZoom = true
		controls.autoRotate = false

		this.setupLighting(scene)

		const { tube, canvas, texture } = this.createGeometry(scene)
		
		const skybox = createGradientSkybox()
		scene.add(skybox)

		return {
			scene,
			camera,
			renderer,
			controls,
			tube,
			canvas,
			texture,
			skybox,
		}
	}

	private static setupLighting(scene: THREE.Scene): void {
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
	}

	private static createGeometry(scene: THREE.Scene): {
		tube: THREE.Mesh
		canvas: HTMLCanvasElement
		texture: THREE.CanvasTexture
	} {
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

		const tubeGeometry = new BentTubeGeometry(0.5, 32, 80)
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
		tube.position.set(0, -2, 0)
		tube.castShadow = true
		tube.receiveShadow = true
		scene.add(tube)

		return { tube, canvas, texture: canvasTexture }
	}
}

