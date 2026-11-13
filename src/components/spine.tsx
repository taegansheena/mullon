import { cn } from 'cn'
import { useState } from 'react'
import { coverUrl, hasCover, hue } from '@/lib/books'

/** A book's cover from Open Library, or a coloured block when it has none (or the image fails to load). */
export function Spine({ cover, seed, size = 'M', className }: { cover?: string | number; seed: string; size?: 'S' | 'M'; className?: string }) {
  const [failed, setFailed] = useState<string | number>()
  const style = { background: `hsl(${hue(seed)} 32% 72%)` }
  const cls = cn('block h-[50px] w-[34px] flex-none rounded-[3px] object-cover shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]', className)
  return cover != null && hasCover(String(cover)) && failed !== cover ? (
    <img className={cls} style={style} src={coverUrl(cover, size)} alt="" loading="lazy" onError={() => setFailed(cover)} />
  ) : (
    <span className={cls} style={style} />
  )
}
