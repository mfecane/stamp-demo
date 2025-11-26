import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { DragTool } from '../DragTool'

export class DragToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, _storeState: EditorState): boolean {
		return hitResult.type === 'widget-body'
	}

	createTool(context: ToolContext, _hitResult: HitResult): DragTool {
		return new DragTool(context)
	}

	getState(): 'drag' {
		return 'drag'
	}
}

