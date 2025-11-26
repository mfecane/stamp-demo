import { create } from 'zustand'
import * as THREE from 'three'
import { CanvasRenderer } from '@/services/CanvasRenderer'

export interface StampInfo {
	uv: THREE.Vector2
	sizeX: number
	sizeY: number
	uAxis: THREE.Vector3
	vAxis: THREE.Vector3
	normal: THREE.Vector3
}

export interface StampState {
	stampInfo: StampInfo | null
	setStampInfo: (info: StampInfo | null) => void
	selectedStampId: string | null
	setSelectedStampId: (id: string | null) => void
	imageHandle: THREE.Group | null
	setImageHandle: (handle: THREE.Group | null) => void
	redrawStamp: (canvas: HTMLCanvasElement | null, sourceImage: HTMLImageElement | null, texture: THREE.CanvasTexture | null) => void
}

export const useStampStore = create<StampState>((set, get) => ({
	stampInfo: null,
	setStampInfo: (info) => set({ stampInfo: info }),
	selectedStampId: null,
	setSelectedStampId: (id) => set({ selectedStampId: id }),
	imageHandle: null,
	setImageHandle: (handle) => set({ imageHandle: handle }),
	redrawStamp: (canvas, sourceImage, texture) => {
		const { stampInfo } = get()
		if (!stampInfo || !canvas || !sourceImage) return

		CanvasRenderer.drawStamp(canvas, sourceImage, stampInfo.uv, stampInfo.sizeX, stampInfo.sizeY)

		if (texture) {
			CanvasRenderer.updateTexture(texture)
		}
	},
}))

