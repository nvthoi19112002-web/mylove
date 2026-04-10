import * as THREE from 'three'
import { gsap } from 'gsap'
import { loadAudioBuffer } from '../utils/assetLoader.js'
import { playSoftClick } from '../utils/audioUtils.js'

export const FLIGHT_SPEED = 0.12 // controls how fast the camera moves along the tunnel path
export const BEAT_SENSITIVITY = 0.24 // controls how strongly bass triggers ring pulses and color shifts

const tunnelAudioUrl = new URL('../../assets/audio/level3-beat.wav', import.meta.url).href

export class Level3Manager {
  constructor(scene, camera, domElement, uiManager, audioListener) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.uiManager = uiManager
    this.audioListener = audioListener
    this.isActive = false
    this.progress = 0
    this.currentOffset = new THREE.Vector2(0, 0)
    this.targetOffset = new THREE.Vector2(0, 0)
    this.rings = []
    this.lastBeatTime = 0
    this.bassLevel = 0
    this.audio = null
    this.analyser = null
    this.onComplete = null

    this._buildTunnel()
    this._createRings()
    this._bindEvents()
  }

  _buildTunnel() {
    const controlPoints = []
    const segmentCount = 14
    for (let i = 0; i < segmentCount; i += 1) {
      const angle = i / segmentCount * Math.PI * 2
      const x = Math.sin(angle * 1.1) * 4.2
      const y = Math.cos(angle * 0.85) * 1.8 + 1.2
      const z = i * -5.2
      controlPoints.push(new THREE.Vector3(x, y, z))
    }

    this.curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.95)
    const tunnelGeometry = new THREE.TubeGeometry(this.curve, 320, 3.6, 32, false)

    this.tunnelMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        speed: { value: 0.7 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform float bass;
        uniform float speed;

        void main() {
          float line = abs(fract(vUv.y * 16.0 + time * speed) - 0.5);
          float glow = smoothstep(0.02, 0.0, line);
          vec3 base = mix(vec3(0.08, 0.12, 0.24), vec3(0.65, 0.45, 0.78), bass * 0.6);
          vec3 streak = vec3(0.42, 0.78, 0.92) * glow * (0.24 + bass * 0.55);
          vec3 color = base + streak;
          color *= 0.55 + bass * 0.18;
          float alpha = 0.12 + glow * 0.28;
          gl_FragColor = vec4(color, clamp(alpha, 0.08, 0.6));
        }
      `,
    })

    this.tunnelMesh = new THREE.Mesh(tunnelGeometry, this.tunnelMaterial)
    this.scene.add(this.tunnelMesh)
  }

  _createRings() {
    const ringCount = 8
    for (let i = 1; i <= ringCount; i += 1) {
      const t = i / (ringCount + 1)
      const position = this.curve.getPointAt(t)
      const tangent = this.curve.getTangentAt(t)
      const ringGeometry = new THREE.RingGeometry(1.0, 1.35, 48)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.52, 0.74, 0.88),
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.copy(position)
      ring.lookAt(position.clone().add(tangent))
      ring.userData = {
        progress: t,
        collected: false,
        baseOpacity: 0.42,
      }
      this.scene.add(ring)
      this.rings.push(ring)
    }
  }

  _bindEvents() {
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
    this.domElement.addEventListener('mousemove', this._onMouseMove, false)
    window.addEventListener('keydown', this._onKeyDown, false)
  }

  _onMouseMove(event) {
    if (!this.isActive) {
      return
    }
    const rect = this.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    this.targetOffset.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(-y, -0.8, 0.8))
  }

  _onKeyDown(event) {
    if (!this.isActive) {
      return
    }
    const step = 0.14
    if (event.key === 'ArrowLeft') {
      this.targetOffset.x = THREE.MathUtils.clamp(this.targetOffset.x - step, -1, 1)
    } else if (event.key === 'ArrowRight') {
      this.targetOffset.x = THREE.MathUtils.clamp(this.targetOffset.x + step, -1, 1)
    } else if (event.key === 'ArrowUp') {
      this.targetOffset.y = THREE.MathUtils.clamp(this.targetOffset.y + step, -0.8, 0.8)
    } else if (event.key === 'ArrowDown') {
      this.targetOffset.y = THREE.MathUtils.clamp(this.targetOffset.y - step, -0.8, 0.8)
    }
  }

  startFlight(onComplete) {
    if (this.isActive) {
      return
    }
    this.isActive = true
    this.onComplete = onComplete
    this.uiManager.showCaption('Tiến sâu vào đường hầm âm nhạc...')
    this._setupAudio()
  }

  _setupAudio() {
    if (!this.audioListener) {
      return
    }
    this.audio = new THREE.Audio(this.audioListener)
    this.audio.setVolume(0.18)
    loadAudioBuffer(this.audioListener, tunnelAudioUrl)
      .then((buffer) => {
        this.audio.setBuffer(buffer)
        this.audio.setLoop(false)
        this.audio.play()
        this.analyser = new THREE.AudioAnalyser(this.audio, 64)
        if (this.audio.source) {
          this.audio.source.onended = () => this._finishFlight()
        }
      })
      .catch(() => {
        this.uiManager.showCaption('Âm nhạc chưa sẵn sàng, tiếp tục hành trình.')
        setTimeout(() => this._finishFlight(), 5200)
      })
  }

  _finishFlight() {
    if (!this.isActive) {
      return
    }
    this.isActive = false
    if (this.domElement) {
      this.domElement.style.filter = ''
    }
    this.uiManager.showCaption('Đường hầm nổ tung thành triệu vì sao...')
    if (typeof this.onComplete === 'function') {
      this.onComplete()
    }
  }

  _updateRings(delta) {
    const now = performance.now() * 0.001
    let bass = 0
    if (this.analyser) {
      const data = this.analyser.getFrequencyData()
      bass = (data[2] + data[3] + data[4] + data[5]) / 1024
      this.bassLevel = THREE.MathUtils.lerp(this.bassLevel, bass, delta * 3)
      this.tunnelMaterial.uniforms.bass.value = this.bassLevel
    }

    this.rings.forEach((ring) => {
      const difference = Math.abs(this.progress - ring.userData.progress)
      const passThrough = difference < 0.02 || difference > 0.98
      if (passThrough && !ring.userData.collected) {
        ring.userData.collected = true
        ring.material.color.setRGB(0.74, 0.82, 0.94)
        gsap.to(ring.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.35, ease: 'power2.out' })
        gsap.to(ring.material, { opacity: 0, duration: 0.9, ease: 'power2.in' })
        playSoftClick()
        this.uiManager.flashScreen()
      }

      const baseScale = ring.userData.collected ? 1.8 : 1
      const pulse = 1 + bass * BEAT_SENSITIVITY
      ring.scale.setScalar(baseScale * pulse)
      ring.material.opacity = THREE.MathUtils.clamp(ring.userData.baseOpacity + bass * 0.28, 0.18, 0.92)
    })

    if (bass > BEAT_SENSITIVITY && now - this.lastBeatTime > 0.42) {
      this.lastBeatTime = now
      this.rings.forEach((ring) => {
        gsap.to(ring.material.color, { r: 0.9, g: 0.6, b: 1.0, duration: 0.35, yoyo: true, repeat: 1, ease: 'power1.inOut' })
      })
    }
  }

  update(delta) {
    if (!this.isActive) {
      return
    }

    this.progress += delta * FLIGHT_SPEED
    if (this.progress >= 1) {
      this.progress -= 1
    }

    this.currentOffset.lerp(this.targetOffset, delta * 3.2)
    const position = this.curve.getPointAt(this.progress)
    const tangent = this.curve.getTangentAt(this.progress)
    const offset = new THREE.Vector3(this.currentOffset.x * 2.2, this.currentOffset.y * 1.4, 0)
    this.camera.position.copy(position).add(offset)
    this.camera.lookAt(position.clone().add(tangent))

    this.tunnelMaterial.uniforms.time.value += delta * 1.5
    if (this.domElement) {
      const blurAmount = 0.25 + this.bassLevel * 1.4
      this.domElement.style.filter = `blur(${blurAmount}px)`
    }

    this._updateRings(delta)
  }
}
