import { useState } from 'react'
import ThreeScene from '@/components/ThreeScene'
import GuiPanel from '@/components/GuiPanel'
import { useEditorStore } from '@/store/editorStore'

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const store = useEditorStore()
  const isImageReady = store.isImageReady
  const stampInfo = store.stampInfo
  const isStampPlaced = stampInfo !== null

  return (
    <div className="App flex h-screen w-screen overflow-hidden" style={{ minWidth: 0, minHeight: 0 }}>
      <GuiPanel
        onImageSelect={setImageUrl}
        isImageActive={isImageReady}
        isStampPlaced={isStampPlaced}
      />
      <div className="flex-1 h-full" style={{ minWidth: 0, minHeight: 0 }}>
        <ThreeScene
          imageUrl={imageUrl}
        />
      </div>
    </div>
  )
}

export default App

