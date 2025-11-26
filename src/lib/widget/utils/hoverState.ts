import * as THREE from 'three'

export function updateWidgetHoverState(widget: THREE.Group | null, hoveredAxis: 'x' | 'y' | 'center' | null): void {
	if (!widget) return

	const whiteColor = 0xffffff
	// Determine base colors based on widget type
	let xBaseColor = 0xff0000
	let yBaseColor = 0x00ff00
	let centerBaseColor = 0xffff00
	
	// Check if this is a move widget
	let isMoveWidget = false
	widget.traverse((child) => {
		if (child.userData.isMoveWidget) {
			isMoveWidget = true
		}
	})
	
	if (isMoveWidget) {
		xBaseColor = 0xff0000  // Red for X axis (same as scale widget)
		yBaseColor = 0x00ff00  // Green for Y axis (same as scale widget)
		centerBaseColor = 0xffff00  // Yellow for center (same as scale widget)
	}
	
	const xColor = hoveredAxis === 'x' ? whiteColor : xBaseColor
	const yColor = hoveredAxis === 'y' ? whiteColor : yBaseColor
	const centerColor = hoveredAxis === 'center' ? whiteColor : centerBaseColor

	widget.traverse((child) => {
		if (child.userData.isXAxis || child.userData.isXHandle) {
			if (child instanceof THREE.ArrowHelper) {
				child.setColor(xColor)
			} else if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(xColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(xColor)
			}
		}
		if (child.userData.isYAxis || child.userData.isYHandle) {
			if (child instanceof THREE.ArrowHelper) {
				child.setColor(yColor)
			} else if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(yColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(yColor)
			}
		}
		if (child.userData.isCenterHandle && !child.userData.isHitTest) {
			// Only update visual center handle, not the collider
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(centerColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(centerColor)
			}
		}
	})
}

export function updateRotateWidgetHoverState(widget: THREE.Group | null, isHovered: boolean): void {
	if (!widget) return

	const whiteColor = 0xffffff
	const defaultColor = 0x0080ff
	const targetColor = isHovered ? whiteColor : defaultColor

	widget.traverse((child) => {
		if (child.userData.isRotateHandle || child.userData.isRotateWidget) {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
				child.material.color.setHex(targetColor)
			} else if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
				child.material.color.setHex(targetColor)
			}
		}
	})
}

