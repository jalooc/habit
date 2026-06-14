import { useObservable, useValue } from '@legendapp/state/react'
import ImageViewer from './ImageViewer'

const useImageViewer = () => {
  const viewerState$ = useObservable({ visible: false, index: 0 })
  const visible = useValue(viewerState$.visible)
  const index = useValue(viewerState$.index)

  const setVisibleImageIndex = (index: number) => void viewerState$.set({ visible: true, index })

  const renderImageViewer = (images: string[]) => (
    <ImageViewer
      images={images}
      initialIndex={index}
      visible={visible}
      onClose={() => void viewerState$.visible.set(false)}
    />
  )

  return {
    setVisibleImageIndex,
    renderImageViewer,
  }
}

export default useImageViewer
