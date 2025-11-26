import { Tool, ToolContext } from '../../Tool'
import type { HitResult } from '@/types/hitResult'
import type { EditorState } from '@/store/composedStore'

export type InteractionState = 'idle' | 'orbit' | 'drag' | 'resize' | 'move' | 'rotate' | 'brush'

/**
 * Strategy interface for tool creation and state determination.
 * Follows the Strategy pattern to allow extensible tool creation without modifying ToolFactory.
 */
export interface IToolStrategy {
	/**
	 * Determines if this strategy can handle the given hit result and store state.
	 */
	canHandle(hitResult: HitResult, storeState: EditorState): boolean

	/**
	 * Creates a tool instance for the given context and hit result.
	 */
	createTool(context: ToolContext, hitResult: HitResult): Tool

	/**
	 * Returns the interaction state that corresponds to this tool.
	 */
	getState(): InteractionState
}

