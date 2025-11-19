// Global Audio Gate singleton: ensures only one audio plays at a time
// API:
// - tryAcquire(id): boolean
// - release(id): void
// - isLockedByOther(id): boolean
// - subscribe(fn): () => void

class AudioGate {
  constructor() {
    this.owner = null
    this.listeners = new Set()
  }

  tryAcquire(id) {
    if (!id) return false
    if (this.owner && this.owner !== id) return false
    this.owner = id
    this.#emit()
    return true
  }

  release(id) {
    if (!id) return
    if (this.owner === id) {
      this.owner = null
      this.#emit()
    }
  }

  isLockedByOther(id) {
    return this.owner != null && this.owner !== id
  }

  subscribe(fn) {
    if (typeof fn !== 'function') return () => {}
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  #emit() {
    for (const fn of this.listeners) {
      try { fn(this.owner) } catch {}
    }
  }
}

export const audioGate = new AudioGate()
