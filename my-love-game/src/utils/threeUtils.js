export function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min
}

export function toNormalizedDeviceCoordinates(event, domElement) {
  const rect = domElement.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  }
}
