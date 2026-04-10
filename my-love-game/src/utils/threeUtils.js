import * as THREE from 'three'

export function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min
}

export function createStarTexture(size = 128, color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const center = size / 2
  const outer = size * 0.45
  const inner = size * 0.18
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function toNormalizedDeviceCoordinates(event, domElement) {
  const rect = domElement.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  }
}
