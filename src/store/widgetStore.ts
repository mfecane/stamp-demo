import { create } from 'zustand'
import * as THREE from 'three'
import { createScalingWidget, createRotateWidget, createMoveWidget } from '@/lib/widget'

export interface WidgetState {
	widget: THREE.Group | null
	setWidget: (widget: THREE.Group | null) => void
	createWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene, rotation?: number) => void
	createRotateWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene, rotation?: number) => void
	createMoveWidget: (position: THREE.Vector3, normal: THREE.Vector3, uAxis: THREE.Vector3, vAxis: THREE.Vector3, scene: THREE.Scene, rotation?: number) => void
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
	widget: null,
	setWidget: (widget) => set({ widget }),
	createWidget: (position, normal, uAxis, vAxis, scene, rotation = 0) => {
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
		const widget = createScalingWidget(position, normal, uAxis, vAxis, scene, rotation)
		set({ widget })
	},
	createRotateWidget: (position, normal, uAxis, vAxis, scene) => {
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
		const widget = createRotateWidget(position, normal, uAxis, vAxis, scene)
		set({ widget })
	},
	createMoveWidget: (position, normal, uAxis, vAxis, scene, rotation = 0) => {
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
		const widget = createMoveWidget(position, normal, uAxis, vAxis, scene, rotation)
		set({ widget })
	},
}))

