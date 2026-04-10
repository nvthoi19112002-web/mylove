import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'
import { getRandomFloat } from '../utils/threeUtils.js'

export class SceneManager {
  constructor(container = document.body) {
    this.container = container
    this.scene = new THREE.Scene()
    this.entities = []
    this.galleryTourOnComplete = null
    // 60 degree field of view balances depth and comfort for interactive scenes
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000)
    this.camera.position.set(0, 3, 18)
    this.audioListener = new THREE.AudioListener()
    this.camera.add(this.audioListener)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x08030d, 1)
    this.renderer.shadowMap.enabled = true
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0'
    this.renderer.domElement.style.left = '0'

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enabled = false
    this.controls.minDistance = 4
    this.controls.maxDistance = 32
    this.controls.target.set(0, 1, 0)
    this.controls.update()

    this.container.appendChild(this.renderer.domElement)
    this._setupLights()
    this._createGalaxy()
    this._setupPostprocessing()

    window.addEventListener('resize', this.resize.bind(this))
  }

  registerEntity(entity) {
    if (entity && typeof entity.update === 'function') {
      this.entities.push(entity)
    }
  }

  resumeAudio() {
    if (this.audioListener && this.audioListener.context && typeof this.audioListener.context.resume === 'function') {
      this.audioListener.context.resume().catch(() => {})
    }
  }

  startGalleryTour(memoryFrames, uiManager, onComplete) {
    this.galleryTourOnComplete = onComplete
    if (!memoryFrames || memoryFrames.length === 0) {
      return
    }

    this.controls.enabled = false
    uiManager.showSkipButton()
    this.galleryTour = gsap.timeline({
      onComplete: () => {
        this.controls.enabled = true
        uiManager.hideSkipButton()
        this.galleryTour = null
        if (typeof onComplete === 'function') {
          onComplete()
        }
      },
    })

    memoryFrames.forEach((frame, index) => {
      const lookAtTarget = frame.group.position.clone()
      lookAtTarget.y = 1.1
      const cameraTarget = frame.group.position.clone().multiplyScalar(0.7)
      cameraTarget.y = 2.5
      cameraTarget.z += frame.group.position.z >= 0 ? 4.5 : -4.5

      this.galleryTour.to(this.camera.position, {
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.lookAt(lookAtTarget)
        },
      })

      this.galleryTour.call(() => {
        uiManager.showCaption(`Dừng lại ở khung: ${frame.title}`)
      })

      this.galleryTour.to({}, { duration: 4.2 })
    })
  }

  skipGalleryTour() {
    if (this.galleryTour) {
      this.galleryTour.kill()
      this.galleryTour = null
      this.controls.enabled = true
      if (typeof this.galleryTourOnComplete === 'function') {
        this.galleryTourOnComplete()
      }
      this.galleryTourOnComplete = null
    }
  }

  transitionToLevel3(level2Manager, crystalHeart, uiManager, onComplete) {
    if (!level2Manager || !uiManager) {
      if (typeof onComplete === 'function') {
        onComplete()
      }
      return
    }

    this.controls.enabled = false
    const target = crystalHeart && crystalHeart.mesh ? crystalHeart.mesh.position.clone() : new THREE.Vector3(0, 1, 0)
    const floor = level2Manager.floor
    const frames = level2Manager.memoryFrames || []

    const timeline = gsap.timeline({
      onStart: () => {
        uiManager.showCaption('Đang chuyển tiếp vào không gian mới...')
      },
      onComplete: () => {
        uiManager.flashScreen()
        gsap.delayedCall(1, () => {
          frames.forEach((frame) => {
            frame.group.visible = false
          })
          if (floor) {
            floor.visible = false
          }
          this.initLevel3(onComplete)
        })
      },
    })

    frames.forEach((frame) => {
      timeline.to(frame.group.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 1.1,
        ease: 'power3.in',
      }, 0)
      timeline.to(frame.group.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: 1.1,
        ease: 'power3.in',
      }, 0)
    })

    if (floor) {
      timeline.to(floor.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: 1.1,
        ease: 'power3.in',
      }, 0)
    }

    timeline.to(this.camera.position, {
      x: target.x,
      y: target.y + 1.4,
      z: target.z + 1.6,
      duration: 1.1,
      ease: 'power3.inOut',
    }, 0)

    timeline.to(this.camera, {
      fov: 120,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.updateProjectionMatrix()
      },
    }, 0)
  }

  initLevel3(onReady) {
    if (typeof onReady === 'function') {
      onReady()
    }
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.28)
    this.scene.add(ambient)

    const mainLight = new THREE.PointLight(0xff9cc5, 1.3, 120, 2)
    mainLight.position.set(0, 10, 10)
    this.scene.add(mainLight)

    const rimLight = new THREE.PointLight(0x66d2ff, 0.65, 120, 2)
    rimLight.position.set(-12, 4, -14)
    this.scene.add(rimLight)
  }

  _createGalaxy() {
    const particleCount = 2400
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const particleColor = new THREE.Color()

    for (let i = 0; i < particleCount; i += 1) {
      // Polar coordinate galaxy distribution: theta rotates around Y, radius pushes stars outward.
      // Squaring the random value biases more particles toward the inner glow.
      const radius = 16 + Math.pow(getRandomFloat(0, 1), 2) * 72
      const theta = getRandomFloat(0, Math.PI * 2)
      const y = getRandomFloat(-9, 9)
      positions[i * 3] = Math.cos(theta) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(theta) * radius

      const hue = 0.65 + Math.random() * 0.2
      particleColor.setHSL(hue, 0.8, 0.55 + Math.random() * 0.2)
      colors[i * 3] = particleColor.r
      colors[i * 3 + 1] = particleColor.g
      colors[i * 3 + 2] = particleColor.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })

    this.galaxy = new THREE.Points(geometry, material)
    this.galaxy.rotation.x = Math.PI * 0.06
    this.scene.add(this.galaxy)
  }

  _setupPostprocessing() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.6,
      0.8,
      0.8,
    )
    bloom.threshold = 0.9
    bloom.strength = 0.6
    bloom.radius = 0.8
    this.composer.addPass(bloom)
  }

  resize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    if (this.composer) {
      this.composer.setSize(width, height)
    }
  }

  update(delta) {
    this.galaxy.rotation.y += delta * 0.08
    this.galaxy.rotation.z += delta * 0.015
    this.entities.forEach((entity) => entity.update(delta))
    this.controls.update()
    this.composer.render()
  }

  get domElement() {
    return this.renderer.domElement
  }
}
