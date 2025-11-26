import * as THREE from 'three'
import { Tool, NormalizedPointerEvent } from '../Tool'
import { RESIZE_CONSTANTS } from './constants'
import { updateLatticeMeshTransform } from '@/lib/lattice/LatticeMesh'

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
		const { storeState, camera } = this.prepareTool(event)

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

		const { storeState, camera } = this.prepareTool(event)
		const deltaMouse = new THREE.Vector2(
			this.context.mouse.x - this.initialMousePos.x,
			this.context.mouse.y - this.initialMousePos.y
		)

		const widget = storeState.widget
		const stampInfo = storeState.stampInfo

		if (!widget || !stampInfo) return

		const widgetGroup = widget.getGroup()
		// Get widget's world position and axes
		widgetGroup.updateMatrixWorld(true)
		const widgetPosition = new THREE.Vector3()
		widgetGroup.getWorldPosition(widgetPosition)

		const worldU = new THREE.Vector3(1, 0, 0).transformDirection(widgetGroup.matrixWorld)
		const worldV = new THREE.Vector3(0, 1, 0).transformDirection(widgetGroup.matrixWorld)

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

		// Convert MIN_SIZE from pixels to UV units (assuming 1024x1024 canvas)
		const MIN_SIZE_UV = RESIZE_CONSTANTS.MIN_SIZE / 1024
		const MAX_SIZE_UV = 1.0 // Max size in UV units

		if (this.handleType === 'x') {
			const uComponent = deltaMouse.dot(screenU)
			newSizeX = this.initialSize.x * (1 + uComponent * RESIZE_CONSTANTS.SCALING_FACTOR)
			newSizeX = Math.max(MIN_SIZE_UV, Math.min(MAX_SIZE_UV, newSizeX))
			newSizeY = this.initialSize.y
		} else if (this.handleType === 'y') {
			const vComponent = deltaMouse.dot(screenV)
			newSizeY = this.initialSize.y * (1 + vComponent * RESIZE_CONSTANTS.SCALING_FACTOR)
			newSizeY = Math.max(MIN_SIZE_UV, Math.min(MAX_SIZE_UV, newSizeY))
			newSizeX = this.initialSize.x
		} else if (this.handleType === 'center') {
			const uComponent = deltaMouse.dot(screenU)
			const vComponent = deltaMouse.dot(screenV)
			const avgComponent = (uComponent + vComponent) / 2
			const scaleFactor = 1 + avgComponent * RESIZE_CONSTANTS.SCALING_FACTOR
			newSizeX = this.initialSize.x * scaleFactor
			newSizeY = this.initialSize.y * scaleFactor
			newSizeX = Math.max(MIN_SIZE_UV, Math.min(MAX_SIZE_UV, newSizeX))
			newSizeY = Math.max(MIN_SIZE_UV, Math.min(MAX_SIZE_UV, newSizeY))
		}

		// Update stamp size in store
		storeState.setStampInfo({
			...stampInfo,
			sizeX: newSizeX,
			sizeY: newSizeY,
		})

		// Update lattice mesh transform and redraw
		const latticeMesh = storeState.latticeMesh
		if (latticeMesh) {
			updateLatticeMeshTransform(latticeMesh, {
				uv: stampInfo.uv,
				sizeX: newSizeX,
				sizeY: newSizeY,
				rotation: stampInfo.rotation || 0,
			})
		}

		// Redraw stamp
		const renderer = storeState.renderer
		if (renderer) {
			storeState.redrawStamp(renderer)
		}
	}

	onPointerUp(_event: NormalizedPointerEvent): void {
		this.isActive = false
		this.context.controls.enabled = true
	}
}

