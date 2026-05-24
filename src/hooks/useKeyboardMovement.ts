import { useEffect } from 'react'
import { actionState, dirState, pressInteract } from '@/lib/inputBus'

export function useKeyboardMovement() {
  useEffect(() => {
    function isTypingTarget(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (!t) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable
    }
    function down(e: KeyboardEvent) {
      if (isTypingTarget(e)) return
      const code = e.code
      if (code === 'KeyW' || code === 'ArrowUp') dirState.up = true
      else if (code === 'KeyS' || code === 'ArrowDown') dirState.down = true
      else if (code === 'KeyA' || code === 'ArrowLeft') dirState.left = true
      else if (code === 'KeyD' || code === 'ArrowRight') dirState.right = true
      else if (code === 'KeyE' || code === 'Space' || code === 'Enter') pressInteract()
      else return
      e.preventDefault()
    }
    function up(e: KeyboardEvent) {
      if (isTypingTarget(e)) return
      const code = e.code
      if (code === 'KeyW' || code === 'ArrowUp') dirState.up = false
      else if (code === 'KeyS' || code === 'ArrowDown') dirState.down = false
      else if (code === 'KeyA' || code === 'ArrowLeft') dirState.left = false
      else if (code === 'KeyD' || code === 'ArrowRight') dirState.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return { dirRef: { current: dirState }, actionRef: { current: actionState } }
}
