import { Tool, NormalizedPointerEvent, ToolContext } from './Tool'
import { performHitTest } from './hitTesting'
import type { HitResult } from '@/types/hitResult'
import { HoverStateManager } from './HoverStateManager'
import { ToolFactory, IToolFactory } from './ToolFactory'
import { normalizeMousePosition } from './utils/mousePosition'
import { updateCameraMatrix } from './utils/cameraUpdates'

export type InteractionState = 'idle' | 'orbit' | 'drag' | 'resize' | 'move' | 'rotate' | 'brush'

export class InteractionManager {
	private state: InteractionState = 'idle'
	private activeTool: Tool | null = null
	private context: ToolContext
	private hitResult: HitResult | null = null
	private hoverStateManager: HoverStateManager
	private toolFactory: IToolFactory

	constructor(context: ToolContext, toolFactory?: IToolFactory) {
		this.context = context
		this.hoverStateManager = new HoverStateManager()
		this.toolFactory = toolFactory || new ToolFactory()
	}

	handlePointerDown(event: NormalizedPointerEvent): void {
		// Get current store state to ensure we have latest camera
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera

		// Update camera matrix to ensure it's current after OrbitControls updates
		updateCameraMatrix(camera)

		// Update mouse position for hit testing
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)

		// Perform hit test with priority: resize handle → widget body → image-handle → selectable object → empty
		this.hitResult = performHitTest(
			this.context.raycaster,
			storeState.widget,
			storeState.tube,
			storeState.imageHandle
		)

		// Handle image-handle selection
		if (this.hitResult.type === 'image-handle') {
			storeState.setSelectedStampId('stamp-1') // For now, single stamp ID
			return
		}

		// Handle selection/deselection
		if (this.hitResult.type !== 'resize-handle' && this.hitResult.type !== 'widget-body' && this.hitResult.type !== 'rotate-handle' && this.hitResult.type !== 'move-handle') {
			// Deselect stamp when clicking on empty space (but not if widget is active or brush is active)
			if (this.hitResult.type === 'empty' && storeState.selectedStampId && !storeState.widget && !storeState.isBrushMode) {
				storeState.setSelectedStampId(null)
			}
			// Reselect stamp when clicking on mesh if a stamp exists
			else if (this.hitResult.type === 'selectable-object' && storeState.stampInfo) {
				storeState.setSelectedStampId('stamp-1')
			}
		}

		// Activate tool based on hit result using factory
		const tool = this.toolFactory.createTool(this.hitResult, this.context, storeState)
		if (tool) {
			const newState = this.toolFactory.getStateForTool(this.hitResult, storeState)
			this.activateTool(newState, tool)
		}

		// Forward event to active tool
		if (this.activeTool) {
			this.activeTool.onPointerDown(event)
		}
	}

	handlePointerMove(event: NormalizedPointerEvent): void {
		// Get current store state to ensure we have latest camera
		const storeState = this.context.store.getState()
		const camera = storeState.camera || this.context.camera

		// Update camera matrix to ensure it's current after OrbitControls updates
		updateCameraMatrix(camera)

		// Update mouse position for hit testing
		normalizeMousePosition(event, this.context.renderer, camera, this.context.raycaster, this.context.mouse)

		// Update hover state
		this.hoverStateManager.updateHoverState(this.context.raycaster, storeState.widget, storeState.imageHandle)

		if (this.activeTool) {
			this.activeTool.onPointerMove(event)
		}
	}

	handlePointerUp(event: NormalizedPointerEvent): void {
		if (this.activeTool) {
			this.activeTool.onPointerUp(event)
		}

		// End tool and return to idle
		this.deactivateTool()
	}

	private activateTool(newState: InteractionState, tool: Tool): void {
		this.deactivateTool()
		this.state = newState
		this.activeTool = tool
	}

	private deactivateTool(): void {
		this.activeTool = null
		this.state = 'idle'
		this.hitResult = null
	}

	getState(): InteractionState {
		return this.state
	}
}

