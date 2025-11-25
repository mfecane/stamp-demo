interface GuiPanelProps {
  onImageSelect: (url: string) => void
  isImageActive: boolean
  isStampPlaced: boolean
}

function GuiPanel({ onImageSelect, isImageActive, isStampPlaced }: GuiPanelProps) {
  const handleImageClick = () => {
    if (isStampPlaced) return
    onImageSelect('/assets/stamp-image.jpg')
  }

  const isDisabled = isStampPlaced

  return (
    <div className="w-80 h-full bg-card border-r border-border overflow-y-auto flex-shrink-0" style={{ minWidth: 0 }}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Stamp Image</h2>
        
        <div className="space-y-4">
          <div>
            <p className="block text-sm font-medium text-foreground mb-2">
              {isDisabled ? 'Stamp already placed' : 'Click image to activate stamp placement'}
            </p>
            <div
              onClick={handleImageClick}
              className={`relative w-full aspect-square rounded-md border-2 overflow-hidden transition-all ${
                isDisabled
                  ? 'border-muted cursor-not-allowed opacity-60'
                  : isImageActive
                  ? 'border-primary ring-2 ring-primary ring-offset-2 cursor-pointer'
                  : 'border-input hover:border-primary/50 cursor-pointer'
              }`}
            >
              <img
                src="/assets/stamp-image.jpg"
                alt="Stamp image"
                className="w-full h-full object-contain"
              />
              {isImageActive && !isDisabled && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">Active - Click on mesh to place</span>
                </div>
              )}
              {isDisabled && (
                <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
                  <span className="text-muted-foreground font-semibold text-sm">Stamp Placed</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isDisabled
                ? 'A stamp has already been placed on the mesh. Remove it to place a new one.'
                : isImageActive
                ? 'Stamp placement active. Click on the 3D mesh to place the stamp.'
                : 'Click the image above to activate stamp placement mode.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuiPanel

