import { create } from 'zustand'
import * as THREE from 'three'
import { createScalingWidget } from '@/lib/widget'

export interface StampInfo {
	uv: THREE.Vector2
	sizeX: number
	sizeY: number
	uAxis: THREE.Vector3
	vAxis: THREE.Vector3
	normal: THREE.Vector3
}

export interface EditorState {
	// Camera
	camera: THREE.PerspectiveCamera | null
	setCamera: (camera: THREE.PerspectiveCamera | null) => void

	// Selection
	selectedObject: THREE.Object3D | null
	setSelectedObject: (object: THREE.Object3D | null) => void

	// Widget
	widget: THREE.Group | null
	setWidget: (widget: THREE.Group | null) => void
	createWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene) => void

	// Stamp
	stampInfo: StampInfo | null
	setStampInfo: (info: StampInfo | null) => void
	redrawStamp: () => void

	// Scene objects
	tube: THREE.Mesh | null
	setTube: (tube: THREE.Mesh | null) => void
	scene: THREE.Scene | null
	setScene: (scene: THREE.Scene | null) => void

	// Canvas and texture
	canvas: HTMLCanvasElement | null
	setCanvas: (canvas: HTMLCanvasElement | null) => void
	texture: THREE.CanvasTexture | null
	setTexture: (texture: THREE.CanvasTexture | null) => void
	sourceImage: HTMLImageElement | null
	setSourceImage: (image: HTMLImageElement | null) => void

	// Image ready state
	isImageReady: boolean
	setIsImageReady: (ready: boolean) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
	camera: null,
	setCamera: (camera) => set({ camera }),

	selectedObject: null,
	setSelectedObject: (object) => set({ selectedObject: object }),

	widget: null,
	setWidget: (widget) => set({ widget }),
	createWidget: (position, normal, uAxis, vAxis, scene) => {
		const currentWidget = get().widget
		if (currentWidget) {
			scene.remove(currentWidget)
			currentWidget.traverse((child) => {
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
		const widget = createScalingWidget(position, normal, uAxis, vAxis, scene)
		set({ widget })
	},

	stampInfo: null,
	setStampInfo: (info) => set({ stampInfo: info }),
	redrawStamp: () => {
		const { stampInfo, canvas, sourceImage, texture } = get()
		if (!stampInfo || !canvas || !sourceImage) return

		const ctx = canvas.getContext('2d')!
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		const x = stampInfo.uv.x * canvas.width
		const y = (1 - stampInfo.uv.y) * canvas.height

		ctx.drawImage(sourceImage, x - stampInfo.sizeX / 2, y - stampInfo.sizeY / 2, stampInfo.sizeX, stampInfo.sizeY)

		if (texture) {
			texture.needsUpdate = true
		}
	},

	tube: null,
	setTube: (tube) => set({ tube }),
	scene: null,
	setScene: (scene) => set({ scene }),

	canvas: null,
	setCanvas: (canvas) => set({ canvas }),

	texture: null,
	setTexture: (texture) => set({ texture }),

	sourceImage: null,
	setSourceImage: (image) => set({ sourceImage: image, isImageReady: image !== null }),

	isImageReady: false,
	setIsImageReady: (ready) => set({ isImageReady: ready }),
}))

