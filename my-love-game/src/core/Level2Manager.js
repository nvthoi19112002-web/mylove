import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { gsap } from 'gsap'
import { MemoryFrame } from '../entities/MemoryFrame.js'
import memory1 from '../../assets/memory-1.svg'
import memory2 from '../../assets/memory-2.svg'
import memory3 from '../../assets/memory-3.svg'

const memory1Audio = new URL('../../assets/audio/memory-1.wav', import.meta.url).href
const memory2Audio = new URL('../../assets/audio/memory-2.wav', import.meta.url).href
const memory3Audio = new URL('../../assets/audio/memory-3.wav', import.meta.url).href

export const GALLERY_RADIUS = 9.4

export class Level2Manager {
  constructor(scene, camera, domElement, uiManager, audioListener) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.uiManager = uiManager
    this.audioListener = audioListener
    this.memoryFrames = []
    this.isReady = false

    this._createFloor()
    this._createMemoryWalls()
  }

  _createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(92, 92)
    const reflector = new Reflector(floorGeometry, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x0d0e1b,
    })
    reflector.rotation.x = -Math.PI / 2
    reflector.position.y = -2.3
    reflector.visible = false
    this.scene.add(reflector)
    this.floor = reflector
  }

  _createMemoryWalls() {
    const frames = [
      { src: memory1, audioUrl: memory1Audio, title: 'Buổi đầu hẹn hò', story: 'Ngày đầu gặp nhau, tim anh đã bắt đầu đập nhanh hơn mỗi lần em cười.' },
      { src: memory2, audioUrl: memory2Audio, title: 'Lời hứa yêu thương', story: 'Mình đã cùng nhau nhìn về phía trước, hứa hẹn những ngày tháng bình yên.' },
      { src: memory3, audioUrl: memory3Audio, title: 'Nụ cười ấm áp', story: 'Nụ cười em làm cho những ngày mưa bỗng chốc trở nên rực rỡ.' },
    ]

    frames.forEach((frameData, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / (frames.length - 1)
      const position = new THREE.Vector3(
        Math.cos(angle) * GALLERY_RADIUS,
        1.35,
        Math.sin(angle) * GALLERY_RADIUS,
      )
      const memoryFrame = new MemoryFrame(
        this.scene,
        this.camera,
        this.domElement,
        frameData.src,
        frameData.title,
        frameData.story,
        position,
        this.uiManager,
        this.audioListener,
        frameData.audioUrl,
      )
      memoryFrame.group.visible = false
      this.memoryFrames.push(memoryFrame)
    })
  }

  startTransition(collector, onComplete) {
    if (this.isReady) {
      return
    }
    this.isReady = true
    this.floor.visible = true
    this.memoryFrames.forEach((frame) => frame.group.visible = true)
    const heartMeshes = collector.hearts.slice()
    collector.dispose()

    const timeline = gsap.timeline({
      onComplete: () => {
        onComplete?.()
      },
    })

    heartMeshes.forEach((heart, index) => {
      const targetFrame = this.memoryFrames[index % this.memoryFrames.length]
      const targetPosition = targetFrame.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
      heart.material.transparent = true
      heart.material.opacity = 1
      timeline.to(heart.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.7,
        delay: index * 0.05,
        ease: 'power3.inOut',
      }, 0)
      timeline.to(heart.scale, {
        x: 0.18,
        y: 0.18,
        z: 0.18,
        duration: 1.7,
        ease: 'power3.inOut',
      }, 0)
      timeline.to(heart.rotation, {
        y: heart.rotation.y + Math.PI * 1.4,
        x: heart.rotation.x + Math.PI * 0.8,
        duration: 1.7,
        ease: 'power3.inOut',
      }, 0)
      timeline.to(heart.material, {
        opacity: 0,
        duration: 1.7,
        ease: 'power2.out',
      }, 0)
    })

    timeline.add(() => {
      heartMeshes.forEach((heart) => {
        this.scene.remove(heart)
        heart.geometry.dispose()
        if (heart.material.dispose) {
          heart.material.dispose()
        }
      })
      this.memoryFrames.forEach((frame) => {
        frame.reveal()
        frame.enableAudio()
      })
    })
  }

  update(delta) {
    this.memoryFrames.forEach((frame) => frame.update(delta))
  }
}
