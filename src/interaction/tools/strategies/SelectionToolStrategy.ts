import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { SelectionTool } from '../SelectionTool'

export class SelectionToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, storeState: EditorState): boolean {
		return hitResult.type === 'selectable-object' && storeState.isImageReady
	}

	createTool(context: ToolContext, _hitResult: HitResult): SelectionTool {
		return new SelectionTool(context)
	}

	getState(): 'idle' {
		return 'idle'
	}
}

