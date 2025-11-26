import { IToolStrategy } from './ToolStrategy'
import type { HitResult } from '@/types/hitResult'
import type { ToolContext } from '../../Tool'
import type { EditorState } from '@/store/composedStore'
import { OrbitTool } from '../OrbitTool'

export class OrbitToolStrategy implements IToolStrategy {
	canHandle(hitResult: HitResult, storeState: EditorState): boolean {
		return (
			hitResult.type === 'empty' ||
			(hitResult.type === 'selectable-object' && !storeState.isImageReady)
		)
	}

	createTool(context: ToolContext, _hitResult: HitResult): OrbitTool {
		return new OrbitTool(context)
	}

	getState(): 'orbit' {
		return 'orbit'
	}
}

