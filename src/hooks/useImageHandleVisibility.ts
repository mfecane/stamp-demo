import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Hook for managing image handle visibility based on widget state.
 * Hides image handle when widget is active.
 */
export function useImageHandleVisibility(): void {
	const store = useEditorStore()
	const imageHandle = store.imageHandle
	const widget = store.widget

	useEffect(() => {
		if (imageHandle) {
			imageHandle.visible = !widget
		}
	}, [imageHandle, widget])
}

