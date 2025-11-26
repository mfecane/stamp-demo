import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { RotateTool } from '../RotateTool'

export class RotateToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, _storeState: EditorState): boolean {
		return hitResult.type === 'rotate-handle'
	}

	createTool(context: ToolContext, _hitResult: HitResult): RotateTool {
		return new RotateTool(context)
	}

	getState(): 'rotate' {
		return 'rotate'
	}
}

