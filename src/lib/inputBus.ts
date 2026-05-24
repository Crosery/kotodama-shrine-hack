// 全局移动 / 互动输入总线
// 键盘和虚拟摇杆都写这里，PlayerStage RAF 内读
export type DirState = { up: boolean; down: boolean; left: boolean; right: boolean }
export type ActionState = { interactPressed: boolean }

export const dirState: DirState = { up: false, down: false, left: false, right: false }
export const actionState: ActionState = { interactPressed: false }

export function pressInteract() {
  actionState.interactPressed = true
}

export function resetDir() {
  dirState.up = false
  dirState.down = false
  dirState.left = false
  dirState.right = false
}

// 摇杆专用：把 (dx, dy) 单位向量（-1..1）映射成四向按键
// 阈值 0.3 避免抖动
export function setStickDirection(dx: number, dy: number, deadzone = 0.3) {
  dirState.left = dx < -deadzone
  dirState.right = dx > deadzone
  dirState.up = dy < -deadzone
  dirState.down = dy > deadzone
}
