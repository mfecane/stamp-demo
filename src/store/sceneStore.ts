import { create } from 'zustand'
import * as THREE from 'three'

export interface SceneState {
	camera: THREE.PerspectiveCamera | null
	setCamera: (camera: THREE.PerspectiveCamera | null) => void

	selectedObject: THREE.Object3D | null
	setSelectedObject: (object: THREE.Object3D | null) => void

	tube: THREE.Mesh | null
	setTube: (tube: THREE.Mesh | null) => void
	scene: THREE.Scene | null
	setScene: (scene: THREE.Scene | null) => void
}

export const useSceneStore = create<SceneState>((set) => ({
	camera: null,
	setCamera: (camera) => set({ camera }),

	selectedObject: null,
	setSelectedObject: (object) => set({ selectedObject: object }),

	tube: null,
	setTube: (tube) => set({ tube }),
	scene: null,
	setScene: (scene) => set({ scene }),
}))

