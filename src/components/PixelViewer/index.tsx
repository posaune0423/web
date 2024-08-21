import React from 'react'
import { COLOR_PALETTE, DEFAULT_BACKGROUND_COLOR, DEFAULT_GRID_COLOR } from './const'
import { usePixelViewer } from './hooks'
import { type Color } from './types'

interface PixelViewerProps {
  backgroundColor?: Color
  gridColor?: Color
}

const PixelViewer: React.FC<PixelViewerProps> = ({
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  gridColor = DEFAULT_GRID_COLOR,
}) => {
  const {
    canvasRef,
    selectedColor,
    setSelectedColor,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  } = usePixelViewer(backgroundColor, gridColor)

  return (
    <div className='relative h-full w-full'>
      <canvas
        ref={canvasRef}
        className='fixed inset-x-0 bottom top-[50px]'
        style={{ width: '100%', height: 'calc(100% - 50px)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className='rounded-md px-4 bg-primary max-w-fit fixed mx-auto bottom-1 left-0 right-0 flex h-[50px] items-center justify-center space-x-8 shadow-md'>
        <div className='flex items-center space-x-2'>
          {COLOR_PALETTE.map((color, index) => (
            <button
              key={index}
              className={`size-8 rounded-full ${
                selectedColor === color ? 'ring-2 ring-black ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${
                  color.a
                })`,
              }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { PixelViewer }
