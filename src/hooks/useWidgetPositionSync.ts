import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { getPositionFromUV } from '@/interaction/tools/MoveTool'
import { updateWidgetOrientation } from '@/lib/utils/widgetOrientation'

/**
 * Hook for synchronizing widget and image handle positions with stamp UV coordinates.
 * Updates positions and orientations when stamp info changes.
 */
export function useWidgetPositionSync(): void {
	const store = useEditorStore()

	useEffect(() => {
		const stampInfo = store.stampInfo
		const imageHandle = store.imageHandle
		const widget = store.widget
		const tube = store.tube

		if (!stampInfo || !tube || !stampInfo.uv) return

		const isMoveWidget = widget?.getType() === 'move'
		
		const newPosition = getPositionFromUV(tube.geometry, tube, stampInfo.uv)
		if (!newPosition) return

		if (imageHandle) {
			imageHandle.position.copy(newPosition)
			imageHandle.updateMatrixWorld(true)
		}

		if (widget) {
			const widgetGroup = widget.getGroup()
			if (!isMoveWidget) {
				widgetGroup.position.copy(newPosition)
			}
			
			updateWidgetOrientation(widgetGroup, stampInfo.normal, stampInfo.uAxis, stampInfo.vAxis, stampInfo.rotation || 0)
		}
	}, [store.stampInfo, store.imageHandle, store.widget, store.tube])
}

