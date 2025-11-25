import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'

export class ResizeTool extends Tool {
	private initialMousePos = new THREE.Vector2()
	private initialSize = { x: 0, y: 0 }
	private handleType: 'x' | 'y' | 'center'
	private isActive = false

	constructor(context: any, handleType: 'x' | 'y' | 'center' | undefined) {
		super(context)
		this.handleType = handleType || 'center'
	}

	onPointerDown(event: NormalizedPointerEvent): void {
		console.log('[ResizeTool] onPointerDown - handleType:', this.handleType)
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		camera.updateMatrixWorld()

		// Update mouse position with current camera
		const rect = this.context.renderer.domElement.getBoundingClientRect()
		this.context.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		this.context.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		this.context.raycaster.setFromCamera(this.context.mouse, camera)

		this.initialMousePos.copy(this.context.mouse)

		const stampInfo = storeState.stampInfo
		if (!stampInfo) {
			console.warn('[ResizeTool] No stampInfo available')
			return
		}

		const widget = storeState.widget
		if (!widget) {
			console.warn('[ResizeTool] No widget available')
			return
		}

		this.initialSize = {
			x: stampInfo.sizeX,
			y: stampInfo.sizeY,
		}

		console.log('[ResizeTool] Initial size:', this.initialSize, 'Controls enabled before:', this.context.controls.enabled)
		this.isActive = true
		this.context.controls.enabled = false
		console.log('[ResizeTool] ResizeTool activated, controls disabled. isActive:', this.isActive)
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			console.log('[ResizeTool] onPointerMove - Tool not active, ignoring')
			return
		}
		console.log('[ResizeTool] onPointerMove - handleType:', this.handleType, 'isActive:', this.isActive)

		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		camera.updateMatrixWorld()

		// Update mouse position with current camera
		const rect = this.context.renderer.domElement.getBoundingClientRect()
		this.context.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		this.context.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
		this.context.raycaster.setFromCamera(this.context.mouse, camera)
		const deltaMouse = new THREE.Vector2(
			this.context.mouse.x - this.initialMousePos.x,
			this.context.mouse.y - this.initialMousePos.y
		)

		const widget = storeState.widget
		const stampInfo = storeState.stampInfo
		const canvas = storeState.canvas

		if (!widget || !stampInfo || !canvas) return

		// Get widget's world position and axes
		widget.updateMatrixWorld(true)
		const widgetPosition = new THREE.Vector3()
		widget.getWorldPosition(widgetPosition)

		const worldU = new THREE.Vector3(1, 0, 0).transformDirection(widget.matrixWorld)
		const worldV = new THREE.Vector3(0, 1, 0).transformDirection(widget.matrixWorld)

		// Project widget axes to screen space
		const uScreen = new THREE.Vector3()
		uScreen.copy(widgetPosition).add(worldU)
		uScreen.project(camera)

		const vScreen = new THREE.Vector3()
		vScreen.copy(widgetPosition).add(worldV)
		vScreen.project(camera)

		const widgetScreen = new THREE.Vector3()
		widgetScreen.copy(widgetPosition)
		widgetScreen.project(camera)

		// Calculate screen space directions
		const screenU = new THREE.Vector2(uScreen.x - widgetScreen.x, uScreen.y - widgetScreen.y).normalize()
		const screenV = new THREE.Vector2(vScreen.x - widgetScreen.x, vScreen.y - widgetScreen.y).normalize()

		// Calculate scaling based on drag direction
		let newSizeX = this.initialSize.x
		let newSizeY = this.initialSize.y

		if (this.handleType === 'x') {
			const uComponent = deltaMouse.dot(screenU)
			newSizeX = this.initialSize.x * (1 + uComponent * 3)
			newSizeX = Math.max(10, Math.min(canvas.width, newSizeX))
			newSizeY = this.initialSize.y
		} else if (this.handleType === 'y') {
			const vComponent = deltaMouse.dot(screenV)
			newSizeY = this.initialSize.y * (1 + vComponent * 3)
			newSizeY = Math.max(10, Math.min(canvas.height, newSizeY))
			newSizeX = this.initialSize.x
		} else if (this.handleType === 'center') {
			const uComponent = deltaMouse.dot(screenU)
			const vComponent = deltaMouse.dot(screenV)
			const avgComponent = (uComponent + vComponent) / 2
			const scaleFactor = 1 + avgComponent * 3
			newSizeX = this.initialSize.x * scaleFactor
			newSizeY = this.initialSize.y * scaleFactor
			newSizeX = Math.max(10, Math.min(canvas.width, newSizeX))
			newSizeY = Math.max(10, Math.min(canvas.height, newSizeY))
		}

		// Update stamp size in store
		storeState.setStampInfo({
			...stampInfo,
			sizeX: newSizeX,
			sizeY: newSizeY,
		})

		// Redraw stamp
		storeState.redrawStamp()
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		console.log('[ResizeTool] onPointerUp - Deactivating, wasActive:', this.isActive)
		this.isActive = false
		this.context.controls.enabled = true
		console.log('[ResizeTool] ResizeTool deactivated, controls re-enabled')
	}
}

