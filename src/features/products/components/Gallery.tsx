import { useState } from 'react'

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <img src={images[active]} alt={alt} className="aspect-square w-full rounded-lg object-cover" />
      <div className="flex gap-2">
        {images.map((src, i) => (
          <button key={src} onClick={() => setActive(i)}
            className={`h-16 w-16 overflow-hidden rounded border-2 ${i === active ? 'border-momo' : 'border-transparent'}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
