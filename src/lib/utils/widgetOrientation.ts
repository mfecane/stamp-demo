import * as THREE from 'three'
import { calculateWidgetOrientation } from '@/lib/widget/utils/axisRotation'

/**
 * Updates widget orientation based on normal, axes, and rotation.
 * This is used when the widget needs to be reoriented after movement or transformation.
 * 
 * @param widgetGroup - The Three.js group representing the widget
 * @param normal - The surface normal vector
 * @param uAxis - The U axis vector (tangent direction)
 * @param vAxis - The V axis vector (bitangent direction)
 * @param rotation - The rotation angle in radians
 */
export function updateWidgetOrientation(
	widgetGroup: THREE.Group,
	normal: THREE.Vector3,
	uAxis: THREE.Vector3,
	vAxis: THREE.Vector3,
	rotation: number
): void {
	const quaternion = calculateWidgetOrientation(normal, uAxis, vAxis, rotation)
	widgetGroup.quaternion.copy(quaternion)
	widgetGroup.updateMatrixWorld(true)
}

