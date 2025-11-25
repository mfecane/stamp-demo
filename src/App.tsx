import { useState } from 'react'
import ThreeScene from './ThreeScene'
import GuiPanel from './components/GuiPanel'
import { useEditorStore } from './store/editorStore'

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const isImageReady = useEditorStore((state) => state.isImageReady)
  const stampInfo = useEditorStore((state) => state.stampInfo)
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

