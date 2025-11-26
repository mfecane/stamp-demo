import { useRef } from 'react'

interface GuiPanelProps {
  onImageSelect: (url: string) => void
  isImageActive: boolean
  isStampPlaced: boolean
}

function GuiPanel({ onImageSelect, isImageActive, isStampPlaced }: GuiPanelProps) {
  const imagePath = `${import.meta.env.BASE_URL}assets/stamp-image.jpg`
  const imageRef = useRef<HTMLImageElement>(null)
  
  const handleImageClick = () => {
    if (isStampPlaced) return
    onImageSelect(imagePath)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (isStampPlaced) {
      e.preventDefault()
      return
    }
    // Load image if not already loaded
    if (!isImageActive) {
      onImageSelect(imagePath)
    }
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', imagePath)
    // Use the displayed image element as drag image (already properly sized)
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      e.dataTransfer.setDragImage(imageRef.current, rect.width / 2, rect.height / 2)
    }
  }

  const isDisabled = isStampPlaced

  return (
    <div className="w-80 h-full bg-card border-r border-border overflow-y-auto flex-shrink-0" style={{ minWidth: 0 }}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Stamp Image</h2>
        
        <div className="space-y-4">
          <div>
            <p className="block text-sm font-medium text-foreground mb-2">
              {isDisabled ? 'Stamp already placed' : 'Drag image to place stamp'}
            </p>
            <div
              onClick={handleImageClick}
              draggable={!isDisabled}
              onDragStart={handleDragStart}
              className={`relative w-full aspect-square rounded-md border-2 overflow-hidden transition-all ${
                isDisabled
                  ? 'border-muted cursor-not-allowed opacity-60'
                  : isImageActive
                  ? 'border-primary ring-2 ring-primary ring-offset-2 cursor-grab active:cursor-grabbing'
                  : 'border-input hover:border-primary/50 cursor-grab active:cursor-grabbing'
              }`}
            >
              <img
                ref={imageRef}
                src={imagePath}
                alt="Stamp image"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isDisabled
                ? 'A stamp has already been placed on the mesh. Remove it to place a new one.'
                : 'Drag the image above onto the 3D mesh to place the stamp.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuiPanel

