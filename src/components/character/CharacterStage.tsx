import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getCharacter } from '@/data/characters'
import CharacterSprite from '@/components/character/CharacterSprite'

export default function CharacterStage({
  characterId,
  thinking,
  className,
}: {
  characterId?: string
  thinking?: boolean
  className?: string
}) {
  const character = getCharacter(characterId)
  const [scale, setScale] = useState(() => pickScale())

  useEffect(() => {
    function onResize() {
      setScale(pickScale())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={cn('absolute inset-x-0 bottom-[28vh] flex justify-center', className)}>
      <div className="relative flex flex-col items-center">
        <div
          aria-hidden
          className={cn(
            'absolute -bottom-3 left-1/2 h-3 w-[68%] -translate-x-1/2 rounded-full',
            'bg-[radial-gradient(closest-side,rgba(46,230,230,0.32),rgba(255,46,154,0.16),rgba(0,0,0,0))]',
            'blur-[2px]',
          )}
        />
        <CharacterSprite
          character={character}
          scale={scale}
          paused={false}
          className={cn(
            'drop-shadow-[0_0_22px_rgba(244,168,201,0.18)]',
            thinking ? 'animate-[kBob_900ms_ease-in-out_infinite]' : '',
          )}
        />
      </div>
    </div>
  )
}

function pickScale() {
  if (typeof window === 'undefined') return 1.4
  const vw = window.innerWidth
  if (vw >= 1280) return 1.8
  if (vw >= 900) return 1.5
  if (vw >= 640) return 1.2
  return 1.0
}
