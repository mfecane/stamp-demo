import * as THREE from 'three'

/**
 * Calculates widget orientation quaternion from normal, uAxis, vAxis, and optional rotation.
 * Applies rotation around the normal axis to match canvas 2D rotation direction.
 * 
 * @param normal - The surface normal vector
 * @param uAxis - The U axis vector (tangent direction)
 * @param vAxis - The V axis vector (bitangent direction)
 * @param rotation - Optional rotation angle in radians (default: 0)
 * @returns Quaternion representing the widget orientation
 */
export function calculateWidgetOrientation(
	normal: THREE.Vector3,
	uAxis: THREE.Vector3,
	vAxis: THREE.Vector3,
	rotation: number = 0
): THREE.Quaternion {
	const normalizedN = normal.clone().normalize()
	
	// Apply rotation to axes around the normal if rotation is provided
	// Negate rotation to match canvas 2D rotation direction (canvas positive = counter-clockwise)
	let normalizedU: THREE.Vector3
	let normalizedV: THREE.Vector3
	
	if (rotation !== 0) {
		const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(normalizedN, -rotation)
		const rotatedU = uAxis.clone().applyQuaternion(rotationQuaternion)
		const rotatedV = vAxis.clone().applyQuaternion(rotationQuaternion)
		normalizedU = rotatedU.clone().normalize()
		normalizedV = rotatedV.clone().normalize()
	} else {
		normalizedU = uAxis.clone().normalize()
		normalizedV = vAxis.clone().normalize()
	}

	// Ensure V is orthogonal to U
	const correctedV = normalizedV.clone().sub(normalizedU.clone().multiplyScalar(normalizedU.dot(normalizedV)))
	correctedV.normalize()
	
	// Calculate corrected normal from cross product
	const correctedN = new THREE.Vector3().crossVectors(normalizedU, correctedV).normalize()
	if (correctedN.dot(normalizedN) < 0) {
		correctedN.negate()
	}

	// Create quaternion from basis matrix
	const quaternion = new THREE.Quaternion()
	const matrix = new THREE.Matrix4()
	matrix.makeBasis(normalizedU, correctedV, correctedN)
	quaternion.setFromRotationMatrix(matrix)
	
	return quaternion
}

