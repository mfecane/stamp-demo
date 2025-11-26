import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { MoveTool } from '../MoveTool'

export class MoveToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, _storeState: EditorState): boolean {
		return hitResult.type === 'move-handle'
	}

	createTool(context: ToolContext, hitResult: HitResult): MoveTool {
		return new MoveTool(context, hitResult.handleType)
	}

	getState(): 'move' {
		return 'move'
	}
}

