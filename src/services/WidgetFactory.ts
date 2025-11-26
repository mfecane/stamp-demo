import * as THREE from 'three'
import { ScalingWidget } from '@/lib/widget/ScalingWidget'
import { RotateWidget } from '@/lib/widget/RotateWidget'
import { MoveWidget } from '@/lib/widget/MoveWidget'
import type { IWidget } from '@/lib/widget/IWidget'

/**
 * Factory for creating widget instances.
 * Separates widget creation logic from store disposal concerns.
 */
export class WidgetFactory {
	/**
	 * Creates a widget of the specified type.
	 * 
	 * @param type - The type of widget to create ('scaling', 'rotate', or 'move')
	 * @param position - The 3D position where the widget should be placed
	 * @param normal - The surface normal vector
	 * @param uAxis - The U axis vector (tangent direction)
	 * @param vAxis - The V axis vector (bitangent direction)
	 * @param scene - The Three.js scene to add the widget to
	 * @param rotation - Optional rotation angle in radians (default: 0)
	 * @returns The created widget instance
	 */
	static create(
		type: 'scaling' | 'rotate' | 'move',
		position: THREE.Vector3,
		normal: THREE.Vector3,
		uAxis: THREE.Vector3,
		vAxis: THREE.Vector3,
		scene: THREE.Scene,
		rotation: number = 0
	): IWidget {
		switch (type) {
			case 'scaling':
				return ScalingWidget.create(position, normal, uAxis, vAxis, scene, rotation)
			case 'rotate':
				return RotateWidget.create(position, normal, uAxis, vAxis, scene)
			case 'move':
				return MoveWidget.create(position, normal, uAxis, vAxis, scene, rotation)
		}
	}
}

