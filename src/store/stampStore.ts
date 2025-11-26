import { create } from 'zustand'
import * as THREE from 'three'
import { LatticeRenderer } from '@/services/LatticeRenderer'
import { useSceneStore } from './sceneStore'
import { useTextureStore } from './textureStore'

export interface StampInfo {
	uv: THREE.Vector2
	sizeX: number // UV units (0-1 range)
	sizeY: number // UV units (0-1 range)
	uAxis: THREE.Vector3
	vAxis: THREE.Vector3
	normal: THREE.Vector3
	rotation: number // Rotation angle in radians
}

export interface StampState {
	stampInfo: StampInfo | null
	setStampInfo: (info: StampInfo | null) => void
	selectedStampId: string | null
	setSelectedStampId: (id: string | null) => void
	imageHandle: THREE.Group | null
	setImageHandle: (handle: THREE.Group | null) => void
	latticeMesh: THREE.Mesh | null
	setLatticeMesh: (mesh: THREE.Mesh | null) => void
	latticeRenderer: LatticeRenderer | null
	setLatticeRenderer: (renderer: LatticeRenderer | null) => void
	redrawStamp: (renderer: THREE.WebGLRenderer | null) => void
	isMoveMode: boolean
	setIsMoveMode: (enabled: boolean) => void
}

export const useStampStore = create<StampState>((set, get) => ({
	stampInfo: null,
	setStampInfo: (info) => set({ stampInfo: info }),
	selectedStampId: null,
	setSelectedStampId: (id) => set({ selectedStampId: id }),
	imageHandle: null,
	setImageHandle: (handle) => set({ imageHandle: handle }),
	latticeMesh: null,
	setLatticeMesh: (mesh) => set({ latticeMesh: mesh }),
	latticeRenderer: null,
	setLatticeRenderer: (renderer) => set({ latticeRenderer: renderer }),
	redrawStamp: (renderer) => {
		const { stampInfo, latticeMesh, latticeRenderer } = get()
		if (!stampInfo || !latticeMesh || !latticeRenderer || !renderer) return

		// Render lattice mesh to texture
		const texture = latticeRenderer.renderLatticeToTexture(latticeMesh, renderer)
		
		// Update tube mesh material with new texture
		// This will be handled by the caller who has access to the tube mesh
	},
	isMoveMode: false,
	setIsMoveMode: (enabled) => set({ isMoveMode: enabled }),
}))

