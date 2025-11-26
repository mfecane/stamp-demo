import { Tool, ToolContext } from './Tool'
import type { HitResult } from '@/types/hitResult'
import type { EditorState } from '@/store/composedStore'
import type { IToolStrategy, InteractionState } from './tools/strategies/ToolStrategy'
import { ResizeToolStrategy } from './tools/strategies/ResizeToolStrategy'
import { RotateToolStrategy } from './tools/strategies/RotateToolStrategy'
import { MoveToolStrategy } from './tools/strategies/MoveToolStrategy'
import { DragToolStrategy } from './tools/strategies/DragToolStrategy'
import { SelectionToolStrategy } from './tools/strategies/SelectionToolStrategy'
import { OrbitToolStrategy } from './tools/strategies/OrbitToolStrategy'

export interface IToolFactory {
	createTool(hitResult: HitResult, context: ToolContext, storeState: EditorState): Tool | null
	getStateForTool(hitResult: HitResult, storeState: EditorState): InteractionState
}

/**
 * Factory for creating tools based on hit results.
 * Uses the Strategy pattern to allow extensible tool creation without modifying this class.
 */
export class ToolFactory implements IToolFactory {
	private strategies: IToolStrategy[]

	constructor() {
		// Order matters: more specific strategies should come first
		this.strategies = [
			new ResizeToolStrategy(),
			new RotateToolStrategy(),
			new MoveToolStrategy(),
			new DragToolStrategy(),
			new SelectionToolStrategy(),
			new OrbitToolStrategy(), // Most general, should be last
		]
	}

	createTool(hitResult: HitResult, context: ToolContext, storeState: EditorState): Tool | null {
		const strategy = this.strategies.find((s) => s.canHandle(hitResult, storeState))
		return strategy ? strategy.createTool(context, hitResult) : null
	}

	getStateForTool(hitResult: HitResult, storeState: EditorState): InteractionState {
		const strategy = this.strategies.find((s) => s.canHandle(hitResult, storeState))
		return strategy ? strategy.getState() : 'orbit'
	}
}

