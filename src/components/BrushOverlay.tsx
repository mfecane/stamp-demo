import { useEditorStore } from '@/store/editorStore'

/**
 * Overlay message that appears at the bottom of the screen when warp tool is active.
 * Provides instructions to the user on how to use the warp tool.
 */
export function BrushOverlay() {
	const store = useEditorStore()
	const isBrushMode = store.isBrushMode
	const stampInfo = store.stampInfo
	const selectedStampId = store.selectedStampId

	// Show message when no stamp is placed
	if (!stampInfo) {
		return (
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
				<div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-6 py-4 shadow-lg">
					<p className="text-sm font-medium text-foreground text-center">
						Drag image to mesh or click on the mesh
					</p>
				</div>
			</div>
		)
	}

	// Show message when stamp is placed but nothing is selected
	if (!selectedStampId) {
		return (
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
				<div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-6 py-4 shadow-lg">
					<p className="text-sm font-medium text-foreground text-center">
						Click blue circle to select image
					</p>
				</div>
			</div>
		)
	}

	// Show brush instructions when brush mode is active
	if (!isBrushMode) {
		return null
	}

	return (
		<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
			<div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-6 py-4 shadow-lg">
				<p className="text-sm font-medium text-foreground text-center">
					Click and drag on the surface to shape image
				</p>
			</div>
		</div>
	)
}

