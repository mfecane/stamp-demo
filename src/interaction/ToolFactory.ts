import { Tool, ToolContext } from './Tool'
import { HitResult } from './hitTesting'
import { OrbitTool } from './tools/OrbitTool'
import { DragTool } from './tools/DragTool'
import { ResizeTool } from './tools/ResizeTool'
import { SelectionTool } from './tools/SelectionTool'

export interface IToolFactory {
	createTool(hitResult: HitResult, context: ToolContext, storeState: any): Tool | null
	getStateForTool(hitResult: HitResult, storeState: any): 'idle' | 'orbit' | 'drag' | 'resize'
}

export class ToolFactory implements IToolFactory {
	createTool(hitResult: HitResult, context: ToolContext, storeState: any): Tool | null {
		if (hitResult.type === 'resize-handle') {
			return new ResizeTool(context, hitResult.handleType)
		} else if (hitResult.type === 'widget-body') {
			return new DragTool(context)
		} else if (hitResult.type === 'selectable-object') {
			if (storeState.isImageReady) {
				return new SelectionTool(context)
			} else {
				return new OrbitTool(context)
			}
		} else if (hitResult.type === 'empty') {
			return new OrbitTool(context)
		}
		return null
	}

	getStateForTool(hitResult: HitResult, storeState: any): 'idle' | 'orbit' | 'drag' | 'resize' {
		if (hitResult.type === 'resize-handle') {
			return 'resize'
		} else if (hitResult.type === 'widget-body') {
			return 'drag'
		} else if (hitResult.type === 'selectable-object') {
			return storeState.isImageReady ? 'idle' : 'orbit'
		} else {
			return 'orbit'
		}
	}
}

