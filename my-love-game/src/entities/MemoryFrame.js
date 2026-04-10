import * as THREE from 'three'
import { gsap } from 'gsap'
import { playSoftClick } from '../utils/audioUtils.js'
import { toNormalizedDeviceCoordinates } from '../utils/threeUtils.js'
import { loadAudioBuffer } from '../utils/assetLoader.js'

export class MemoryFrame {
  constructor(scene, camera, domElement, imageSrc, title, story, position, uiManager, audioListener, audioUrl) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.title = title
    this.story = story
    this.uiManager = uiManager
    this.audioListener = audioListener
    this.audioUrl = audioUrl
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.isHovered = false
    this.group = new THREE.Group()
    this.group.position.copy(position)
    this.group.visible = false
    this.audioEnabled = false
    this.audioLoaded = false

    this._createFrame(imageSrc)
    this._createAudio()
    this.scene.add(this.group)
    this._bindEvents()
  }

  _createFrame(imageSrc) {
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f1a4c,
      emissive: 0x802c9b,
      emissiveIntensity: 0.75,
      metalness: 0.35,
      roughness: 0.18,
      transparent: true,
      opacity: 1,
    })

    const imageTexture = new THREE.TextureLoader().load(imageSrc)
    imageTexture.encoding = THREE.LinearSRGBColorSpace
    imageTexture.anisotropy = 4

    const imageMaterial = new THREE.MeshStandardMaterial({
      map: imageTexture,
      emissive: 0x111111,
      emissiveIntensity: 0.1,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 1,
    })

    const frameGeometry = new THREE.BoxGeometry(2.4, 3.2, 0.18)
    const planeGeometry = new THREE.PlaneGeometry(2.0, 2.6)

    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial)
    frameMesh.position.set(0, 0, 0)
    frameMesh.castShadow = true
    frameMesh.receiveShadow = true

    const imageMesh = new THREE.Mesh(planeGeometry, imageMaterial)
    imageMesh.position.set(0, 0, 0.105)
    imageMesh.castShadow = false
    imageMesh.receiveShadow = false

    this.frameMaterial = frameMaterial
    this.imageMaterial = imageMaterial
    this.interactiveMesh = frameMesh

    this.group.add(frameMesh)
    this.group.add(imageMesh)
  }

  _createAudio() {
    if (!this.audioListener) {
      return
    }

    this.audio = new THREE.PositionalAudio(this.audioListener)
    this.audio.setRefDistance(3)
    this.audio.setRolloffFactor(1.6)
    this.audio.setDistanceModel('exponential')
    this.audio.setVolume(0.12)
    this.group.add(this.audio)

    if (!this.audioUrl) {
      this._setFallbackAudio()
      return
    }

    loadAudioBuffer(this.audioListener, this.audioUrl)
      .then((buffer) => {
        this.audio.setBuffer(buffer)
        this.audio.setLoop(true)
        this.audioLoaded = true
        if (this.audioEnabled) {
          this._playAudio()
        }
      })
      .catch(() => {
        this._setFallbackAudio()
      })
  }

  _setFallbackAudio() {
    const context = this.audioListener.context
    if (!context) {
      return
    }

    const sampleRate = context.sampleRate || 44100
    const duration = 1.4
    const frameCount = Math.floor(sampleRate * duration)
    const buffer = context.createBuffer(1, frameCount, sampleRate)
    const data = buffer.getChannelData(0)
    const frequency = 220 + (this.title.length % 3) * 70

    for (let i = 0; i < frameCount; i += 1) {
      const t = i / sampleRate
      data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1.1)
    }

    this.audio.setBuffer(buffer)
    this.audio.setLoop(true)
    this.audioLoaded = true
    if (this.audioEnabled) {
      this._playAudio()
    }
  }

  enableAudio() {
    this.audioEnabled = true
    if (this.audioLoaded && this.audio && !this.audio.isPlaying) {
      this._playAudio()
    }
  }

  _playAudio() {
    if (!this.audio || !this.audio.buffer) {
      return
    }
    try {
      this.audio.play()
    } catch (error) {
      // audio playback may require user interaction before it can start
    }
  }

  _bindEvents() {
    this._pointerMove = this._onPointerMove.bind(this)
    this._pointerDown = this._onPointerDown.bind(this)
    this.domElement.addEventListener('pointermove', this._pointerMove, false)
    this.domElement.addEventListener('pointerdown', this._pointerDown, false)
  }

  _onPointerMove(event) {
    if (!this.group.visible) {
      return
    }
    const normalized = toNormalizedDeviceCoordinates(event, this.domElement)
    this.pointer.set(normalized.x, normalized.y)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersect = this.raycaster.intersectObject(this.interactiveMesh, false)[0]
    this.isHovered = Boolean(intersect)
  }

  _onPointerDown(event) {
    if (!this.group.visible) {
      return
    }
    const normalized = toNormalizedDeviceCoordinates(event, this.domElement)
    this.pointer.set(normalized.x, normalized.y)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersect = this.raycaster.intersectObject(this.interactiveMesh, false)[0]
    if (!intersect) {
      return
    }
    playSoftClick()
    this.uiManager.showMemoryDetail(this.title, this.story)
  }

  reveal() {
    this.group.visible = true
    this.frameMaterial.opacity = 0
    this.imageMaterial.opacity = 0
    gsap.to(this.frameMaterial, { opacity: 1, duration: 1.1, ease: 'power3.out' })
    gsap.to(this.imageMaterial, { opacity: 1, duration: 1.1, delay: 0.1, ease: 'power3.out' })
  }

  update(delta) {
    if (!this.group.visible) {
      return
    }

    const distance = this.camera.position.distanceTo(this.group.position)
    const shouldAim = this.isHovered || distance < 5.5

    if (this.audio && this.audioLoaded) {
      if (!this.audio.isPlaying && this.audioEnabled && distance < 10) {
        this._playAudio()
      }
      const volume = THREE.MathUtils.clamp(0.18 - (distance - 2) * 0.011, 0.04, 0.18)
      this.audio.setVolume(volume)
    }

    if (shouldAim) {
      const lookTarget = this.camera.position.clone()
      lookTarget.y = this.group.position.y
      this.group.lookAt(lookTarget)
    }

    const targetIntensity = this.isHovered ? 2.2 : distance < 5.5 ? 1.25 : 0.75
    this.frameMaterial.emissiveIntensity = THREE.MathUtils.lerp(this.frameMaterial.emissiveIntensity, targetIntensity, delta * 2.4)
  }

  dispose() {
    this.domElement.removeEventListener('pointermove', this._pointerMove, false)
    this.domElement.removeEventListener('pointerdown', this._pointerDown, false)
  }
}
