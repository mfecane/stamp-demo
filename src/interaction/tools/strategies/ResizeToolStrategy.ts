import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { ResizeTool } from '../ResizeTool'

export class ResizeToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, _storeState: EditorState): boolean {
		return hitResult.type === 'resize-handle'
	}

	createTool(context: ToolContext, hitResult: HitResult): ResizeTool {
		return new ResizeTool(context, hitResult.handleType)
	}

	getState(): 'resize' {
		return 'resize'
	}
}

