import * as THREE from 'three'

const audioCache = new Map()

export function loadAudioBuffer(listener, url) {
  if (audioCache.has(url)) {
    return audioCache.get(url)
  }

  const loader = new THREE.AudioLoader()
  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (buffer) => resolve(buffer),
      undefined,
      (error) => reject(error),
    )
  })

  audioCache.set(url, promise)
  return promise
}
