import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as THREE from 'three'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateTangentVectors(
	geometry: THREE.BufferGeometry,
	faceIndex: number,
	normal: THREE.Vector3
): { uAxis: THREE.Vector3; vAxis: THREE.Vector3 } {
	const positions = geometry.attributes.position
	const uvs = geometry.attributes.uv
	const indices = geometry.index

	if (!indices || !uvs) {
		const worldX = new THREE.Vector3(1, 0, 0)
		const worldY = new THREE.Vector3(0, 1, 0)
		const uAxis = worldX
			.clone()
			.sub(normal.clone().multiplyScalar(worldX.dot(normal)))
			.normalize()
		const vAxis = new THREE.Vector3().crossVectors(normal, uAxis).normalize()
		return { uAxis, vAxis }
	}

	const i0 = indices.getX(faceIndex * 3)
	const i1 = indices.getX(faceIndex * 3 + 1)
	const i2 = indices.getX(faceIndex * 3 + 2)

	const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0))
	const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1))
	const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2))

	const uv0 = new THREE.Vector2(uvs.getX(i0), uvs.getY(i0))
	const uv1 = new THREE.Vector2(uvs.getX(i1), uvs.getY(i1))
	const uv2 = new THREE.Vector2(uvs.getX(i2), uvs.getY(i2))

	const edge1 = v1.clone().sub(v0)
	const edge2 = v2.clone().sub(v0)
	const deltaUV1 = uv1.clone().sub(uv0)
	const deltaUV2 = uv2.clone().sub(uv0)

	const f = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y)
	const tangent = new THREE.Vector3()
	tangent.x = f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x)
	tangent.y = f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y)
	tangent.z = f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z)
	tangent.normalize()

	const bitangent = new THREE.Vector3()
	bitangent.x = f * (-deltaUV2.x * edge1.x + deltaUV1.x * edge2.x)
	bitangent.y = f * (-deltaUV2.x * edge1.y + deltaUV1.x * edge2.y)
	bitangent.z = f * (-deltaUV2.x * edge1.z + deltaUV1.x * edge2.z)
	bitangent.normalize()

	const uAxis = tangent.clone()
	const vAxis = bitangent.clone()

	uAxis.sub(normal.clone().multiplyScalar(normal.dot(uAxis))).normalize()
	vAxis.sub(normal.clone().multiplyScalar(normal.dot(vAxis)))
	vAxis.sub(uAxis.clone().multiplyScalar(uAxis.dot(vAxis))).normalize()

	return { uAxis, vAxis }
}

export function worldToScreen(
	worldPosition: THREE.Vector3,
	camera: THREE.PerspectiveCamera,
	renderer: THREE.WebGLRenderer
): { x: number; y: number } {
	const vector = worldPosition.clone()
	vector.project(camera)

	const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth
	const y = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight

	return { x, y }
}

/**
 * Creates a throttled version of a function that limits execution to at most once per interval.
 * @param fn - The function to throttle
 * @param intervalMs - The minimum time interval between executions in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
	fn: T,
	intervalMs: number
): (...args: Parameters<T>) => void {
	let lastCallTime = 0

	return function (this: any, ...args: Parameters<T>) {
		const now = performance.now()
		if (now - lastCallTime >= intervalMs) {
			lastCallTime = now
			fn.apply(this, args)
		}
	}
}

/**
 * Creates a throttled version of a function that limits execution to a specific frame rate.
 * @param fn - The function to throttle
 * @param fps - The target frame rate (e.g., 60 for 60fps)
 * @returns A throttled version of the function
 */
export function throttleFPS<T extends (...args: any[]) => any>(
	fn: T,
	fps: number
): (...args: Parameters<T>) => void {
	return throttle(fn, 1000 / fps)
}

