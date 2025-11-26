import * as THREE from 'three'
import type { HitResult } from '@/types/hitResult'

// Common widget interface
export interface IWidget {
	getGroup(): THREE.Group
	getType(): 'scaling' | 'move' | 'rotate'
	getColliders(): THREE.Mesh[]
	getHandleType(intersected: THREE.Object3D): 'x' | 'y' | 'center' | null
	getHandleHitResult(intersected: THREE.Object3D, intersection: THREE.Intersection): HitResult | null
}

