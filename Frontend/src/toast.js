let listeners = []
let counter = 0

function emit(update) {
  listeners.forEach((l) => l(update))
}

export function toast(message, type = "success", duration = 2500) {
  const id = ++counter
  emit({ id, message, type })
  setTimeout(() => emit({ id, dismiss: true }), duration)
  return id
}

export function subscribeToast(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}