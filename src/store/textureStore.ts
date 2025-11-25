import { create } from 'zustand'
import * as THREE from 'three'

export interface TextureState {
	canvas: HTMLCanvasElement | null
	setCanvas: (canvas: HTMLCanvasElement | null) => void
	texture: THREE.CanvasTexture | null
	setTexture: (texture: THREE.CanvasTexture | null) => void
	sourceImage: HTMLImageElement | null
	setSourceImage: (image: HTMLImageElement | null) => void
	isImageReady: boolean
	setIsImageReady: (ready: boolean) => void
}

export const useTextureStore = create<TextureState>((set) => ({
	canvas: null,
	setCanvas: (canvas) => set({ canvas }),
	texture: null,
	setTexture: (texture) => set({ texture }),
	sourceImage: null,
	setSourceImage: (image) => set({ sourceImage: image, isImageReady: image !== null }),
	isImageReady: false,
	setIsImageReady: (ready) => set({ isImageReady: ready }),
}))

