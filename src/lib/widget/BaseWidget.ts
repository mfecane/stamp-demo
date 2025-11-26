import * as THREE from 'three'
import { IWidget } from './IWidget'
import type { HitResult } from '@/types/hitResult'

// Base widget class
export abstract class BaseWidget implements IWidget {
	protected group: THREE.Group

	constructor(group: THREE.Group) {
		this.group = group
	}

	getGroup(): THREE.Group {
		return this.group
	}

	abstract getType(): 'scaling' | 'move' | 'rotate'
	abstract getHandleType(intersected: THREE.Object3D): 'x' | 'y' | 'center' | null
	abstract getHandleHitResult(intersected: THREE.Object3D, intersection: THREE.Intersection): HitResult | null

	getColliders(): THREE.Mesh[] {
		const colliders: THREE.Mesh[] = []
		this.group.traverse((child) => {
			if (child.userData.isHitTest && child instanceof THREE.Mesh) {
				colliders.push(child)
			}
		})
		return colliders
	}
}

