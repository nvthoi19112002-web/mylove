const audioContext = new (window.AudioContext || window.webkitAudioContext)()

export function playSoftClick() {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.value = 880
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.005)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.18)
}
