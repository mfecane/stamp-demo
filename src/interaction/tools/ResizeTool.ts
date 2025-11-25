import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { normalizeMousePosition } from '../utils/mousePosition'
import { updateCameraMatrix } from '../utils/cameraUpdates'
import { RESIZE_CONSTANTS } from './constants'

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
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		updateCameraMatrix(camera)

		// Update mouse position with current camera
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)

		this.initialMousePos.copy(this.context.mouse)

		const stampInfo = storeState.stampInfo
		if (!stampInfo) {
			return
		}

		const widget = storeState.widget
		if (!widget) {
			return
		}

		this.initialSize = {
			x: stampInfo.sizeX,
			y: stampInfo.sizeY,
		}

		this.isActive = true
		this.context.controls.enabled = false
	}

	onPointerMove(event: NormalizedPointerEvent): void {
		if (!this.isActive) {
			return
		}

		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera
		updateCameraMatrix(camera)

		// Update mouse position with current camera
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)
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
			newSizeX = this.initialSize.x * (1 + uComponent * RESIZE_CONSTANTS.SCALING_FACTOR)
			newSizeX = Math.max(RESIZE_CONSTANTS.MIN_SIZE, Math.min(canvas.width, newSizeX))
			newSizeY = this.initialSize.y
		} else if (this.handleType === 'y') {
			const vComponent = deltaMouse.dot(screenV)
			newSizeY = this.initialSize.y * (1 + vComponent * RESIZE_CONSTANTS.SCALING_FACTOR)
			newSizeY = Math.max(RESIZE_CONSTANTS.MIN_SIZE, Math.min(canvas.height, newSizeY))
			newSizeX = this.initialSize.x
		} else if (this.handleType === 'center') {
			const uComponent = deltaMouse.dot(screenU)
			const vComponent = deltaMouse.dot(screenV)
			const avgComponent = (uComponent + vComponent) / 2
			const scaleFactor = 1 + avgComponent * RESIZE_CONSTANTS.SCALING_FACTOR
			newSizeX = this.initialSize.x * scaleFactor
			newSizeY = this.initialSize.y * scaleFactor
			newSizeX = Math.max(RESIZE_CONSTANTS.MIN_SIZE, Math.min(canvas.width, newSizeX))
			newSizeY = Math.max(RESIZE_CONSTANTS.MIN_SIZE, Math.min(canvas.height, newSizeY))
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
		this.isActive = false
		this.context.controls.enabled = true
	}
}

