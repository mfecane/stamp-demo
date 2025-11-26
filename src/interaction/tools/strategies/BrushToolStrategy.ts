import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { BrushTool } from '../BrushTool'

export class BrushToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, storeState: EditorState): boolean {
		// Activate brush tool when brush mode is enabled and clicking on stamp
		return (
			storeState.isBrushMode &&
			(hitResult.type === 'selectable-object' || hitResult.type === 'image-handle') &&
			storeState.stampInfo !== null &&
			storeState.latticeMesh !== null
		)
	}

	createTool(context: ToolContext, _hitResult: HitResult): BrushTool {
		return new BrushTool(context)
	}

	getState(): 'brush' {
		return 'brush'
	}
}

