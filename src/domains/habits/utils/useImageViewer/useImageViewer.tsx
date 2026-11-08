import { useState } from 'react'
import ImageViewer from './ImageViewer'

const useImageViewer = () => {
  const [viewerState, setViewerState] = useState({ visible: false, index: 0 })

  const setVisibleImageIndex = (index: number) => void setViewerState({ visible: true, index })

  const renderImageViewer = (images: string[]) => (
    <ImageViewer
      images={images}
      initialIndex={viewerState.index}
      visible={viewerState.visible}
      onClose={() => void setViewerState(state => ({ ...state, visible: false }))}
    />
  )

  return {
    setVisibleImageIndex,
    renderImageViewer,
  }
}

export default useImageViewer
