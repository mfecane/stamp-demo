import { create } from 'zustand'
import * as THREE from 'three'
import type { IWidget } from '@/lib/widget/IWidget'
import { disposeObject3D } from '@/lib/utils/resourceDisposal'
import { WidgetFactory } from '@/services/WidgetFactory'

export interface WidgetState {
	widget: IWidget | null
	setWidget: (widget: IWidget | null) => void
	createWidget: (
		type: 'scaling' | 'rotate' | 'move',
		position: THREE.Vector3,
		normal: THREE.Vector3,
		uAxis: THREE.Vector3,
		vAxis: THREE.Vector3,
		scene: THREE.Scene,
		rotation?: number
	) => void
	// Legacy methods for backward compatibility
	createRotateWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene, rotation?: number) => void
	createMoveWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene, rotation?: number) => void
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
	widget: null,
	setWidget: (widget) => set({ widget }),
	createWidget: (type, position, normal, uAxis, vAxis, scene, rotation = 0) => {
		const currentWidget = get().widget
		if (currentWidget) {
			disposeObject3D(currentWidget.getGroup(), scene)
		}
		
		const widget = WidgetFactory.create(type, position, normal, uAxis, vAxis, scene, rotation)
		set({ widget })
	},
	// Legacy methods for backward compatibility
	createRotateWidget: (position, normal, uAxis, vAxis, scene) => {
		get().createWidget('rotate', position, normal, uAxis, vAxis, scene)
	},
	createMoveWidget: (position, normal, uAxis, vAxis, scene, rotation = 0) => {
		get().createWidget('move', position, normal, uAxis, vAxis, scene, rotation)
	},
}))

