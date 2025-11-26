import * as THREE from 'three'

export interface HitResult {
	type: 'resize-handle' | 'rotate-handle' | 'move-handle' | 'widget-body' | 'image-handle' | 'selectable-object' | 'empty'
	object?: THREE.Object3D
	intersection?: THREE.Intersection
	handleType?: 'x' | 'y' | 'center'
}

