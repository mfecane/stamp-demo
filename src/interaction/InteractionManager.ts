import { Tool, NormalizedPointerEvent, ToolContext } from './Tool'
import { OrbitTool } from './tools/OrbitTool'
import { DragTool } from './tools/DragTool'
import { ResizeTool } from './tools/ResizeTool'
import { SelectionTool } from './tools/SelectionTool'
import { performHitTest, HitResult } from './hitTesting'
import { updateWidgetHoverState } from '@/lib/widget'
import * as THREE from 'three'

export type InteractionState = 'idle' | 'orbit' | 'drag' | 'resize'

export class InteractionManager {
	private state: InteractionState = 'idle'
	private activeTool: Tool | null = null
	private context: ToolContext
	private hitResult: HitResult | null = null
	private hoveredAxis: 'x' | 'y' | 'center' | null = null

	constructor(context: ToolContext) {
		this.context = context
	}

	handlePointerDown(event: NormalizedPointerEvent): void {
		console.log('[StateMachine] handlePointerDown - Current state:', this.state, 'Active tool:', this.activeTool?.constructor.name || 'none')

		// Normalize event
		const normalizedEvent: NormalizedPointerEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			button: event.button,
			pointerId: event.pointerId,
		}

		// Get current store state to ensure we have latest camera
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera

		// Update camera matrix to ensure it's current after OrbitControls updates
		camera.updateMatrixWorld()

		// Update mouse position for hit testing
		const rect = this.context.renderer.domElement.getBoundingClientRect()
		this.context.mouse.x = ((normalizedEvent.clientX - rect.left) / rect.width) * 2 - 1
		this.context.mouse.y = -((normalizedEvent.clientY - rect.top) / rect.height) * 2 + 1
		this.context.raycaster.setFromCamera(this.context.mouse, camera)

		// Perform hit test with priority: resize handle → widget body → selectable object → empty
		this.hitResult = performHitTest(
			this.context.raycaster,
			storeState.widget,
			storeState.tube
		)

		console.log('[StateMachine] Hit test result:', {
			type: this.hitResult.type,
			handleType: this.hitResult.handleType,
			hasWidget: !!storeState.widget,
			hasTube: !!storeState.tube,
		})

		// Activate tool based on hit result
		if (this.hitResult.type === 'resize-handle') {
			console.log('[StateMachine] Activating ResizeTool with handleType:', this.hitResult.handleType)
			const resizeTool = new ResizeTool(this.context, this.hitResult.handleType)
			this.activateTool('resize', resizeTool)
		} else if (this.hitResult.type === 'widget-body') {
			console.log('[StateMachine] Activating DragTool')
			this.activateTool('drag', new DragTool(this.context))
		} else if (this.hitResult.type === 'selectable-object') {
			// Only activate SelectionTool if image is ready
			if (storeState.isImageReady) {
				console.log('[StateMachine] Activating SelectionTool')
				this.activateTool('idle', new SelectionTool(this.context))
			} else {
				// Fall back to OrbitTool if image is not ready
				console.log('[StateMachine] Activating OrbitTool (image not ready)')
				this.activateTool('orbit', new OrbitTool(this.context))
			}
		} else {
			console.log('[StateMachine] Activating OrbitTool (empty space)')
			this.activateTool('orbit', new OrbitTool(this.context))
		}

		console.log('[StateMachine] After activation - State:', this.state, 'Active tool:', this.activeTool?.constructor.name || 'none', 'Controls enabled:', this.context.controls.enabled)

		// Forward event to active tool
		if (this.activeTool) {
			console.log('[StateMachine] Forwarding pointerDown to tool:', this.activeTool.constructor.name)
			this.activeTool.onPointerDown(normalizedEvent)
		} else {
			console.warn('[StateMachine] No active tool to forward pointerDown event!')
		}
	}

	handlePointerMove(event: NormalizedPointerEvent): void {
		const normalizedEvent: NormalizedPointerEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			button: event.button,
			pointerId: event.pointerId,
		}

		console.log('[StateMachine] handlePointerMove - State:', this.state, 'Active tool:', this.activeTool?.constructor.name || 'none')

		// Get current store state to ensure we have latest camera
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera

		// Update camera matrix to ensure it's current after OrbitControls updates
		camera.updateMatrixWorld()

		// Update mouse position for hit testing
		const rect = this.context.renderer.domElement.getBoundingClientRect()
		this.context.mouse.x = ((normalizedEvent.clientX - rect.left) / rect.width) * 2 - 1
		this.context.mouse.y = -((normalizedEvent.clientY - rect.top) / rect.height) * 2 + 1
		this.context.raycaster.setFromCamera(this.context.mouse, camera)

		// Check for hover on widget colliders only
		if (storeState.widget) {
			storeState.widget.updateMatrixWorld(true)
			
			// Only intersect with colliders (hit test objects)
			const colliders: THREE.Object3D[] = []
			storeState.widget.traverse((child) => {
				if (child.userData.isHitTest && child instanceof THREE.Mesh) {
					colliders.push(child)
				}
			})

			const widgetIntersects = this.context.raycaster.intersectObjects(colliders, false)

			let newHoveredAxis: 'x' | 'y' | 'center' | null = null

			if (widgetIntersects.length > 0) {
				const intersected = widgetIntersects[0].object

				// Traverse up to find axis identification
				let currentObject: THREE.Object3D | null = intersected
				while (currentObject && currentObject !== storeState.widget) {
					// Only check colliders (isHitTest)
					if (currentObject.userData.isHitTest) {
						if (currentObject.userData.isXAxis || currentObject.userData.isXHandle) {
							newHoveredAxis = 'x'
							break
						}
						if (currentObject.userData.isYAxis || currentObject.userData.isYHandle) {
							newHoveredAxis = 'y'
							break
						}
						if (currentObject.userData.isCenterHandle) {
							newHoveredAxis = 'center'
							break
						}
					}

					currentObject = currentObject.parent
				}
			}

			// Update hover state if it changed
			if (newHoveredAxis !== this.hoveredAxis) {
				this.hoveredAxis = newHoveredAxis
				updateWidgetHoverState(storeState.widget, this.hoveredAxis)
			}
		} else if (this.hoveredAxis !== null) {
			// Widget was removed, clear hover state
			this.hoveredAxis = null
		}

		if (this.activeTool) {
			this.activeTool.onPointerMove(normalizedEvent)
		} else {
			console.log('[StateMachine] handlePointerMove - No active tool! State:', this.state)
		}
	}

	handlePointerUp(event: NormalizedPointerEvent): void {
		console.log('[StateMachine] handlePointerUp - State:', this.state, 'Active tool:', this.activeTool?.constructor.name || 'none')

		const normalizedEvent: NormalizedPointerEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			button: event.button,
			pointerId: event.pointerId,
		}

		if (this.activeTool) {
			console.log('[StateMachine] Forwarding pointerUp to tool:', this.activeTool.constructor.name)
			this.activeTool.onPointerUp(normalizedEvent)
		} else {
			console.warn('[StateMachine] No active tool to forward pointerUp event!')
		}

		// End tool and return to idle
		console.log('[StateMachine] Deactivating tool, returning to idle')
		this.deactivateTool()
		console.log('[StateMachine] After deactivation - State:', this.state, 'Active tool:', this.activeTool?.constructor.name || 'none')
	}

	private activateTool(newState: InteractionState, tool: Tool): void {
		console.log('[StateMachine] activateTool - Transitioning from', this.state, 'to', newState, 'Tool:', tool.constructor.name)
		this.deactivateTool()
		this.state = newState
		this.activeTool = tool
		console.log('[StateMachine] Tool activated - State:', this.state, 'Tool:', this.activeTool?.constructor.name)
	}

	private deactivateTool(): void {
		if (this.activeTool) {
			console.log('[StateMachine] deactivateTool - Deactivating:', this.activeTool.constructor.name, 'from state:', this.state)
		}
		this.activeTool = null
		this.state = 'idle'
		this.hitResult = null
	}

	getState(): InteractionState {
		return this.state
	}
}

