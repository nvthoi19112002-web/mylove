import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import helvetikerFont from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { gsap } from 'gsap'

export const FIREWORK_DENSITY = 160
export const EXPLOSION_POWER = 3.5

export class GrandFinale {
  constructor(scene, camera, uiManager) {
    this.scene = scene
    this.camera = camera
    this.uiManager = uiManager
    this.particleSystem = null
    this.fireworkGroup = new THREE.Group()
    this.morphProgress = { value: 0 }
    this.isActive = false
    this.scene.add(this.fireworkGroup)
  }

  triggerFinale(memoryFrames) {
    if (this.isActive) {
      return
    }

    this.isActive = true
    const particles = []
    const startPositions = []
    const targetPositions = []

    const textGeometry = new TextGeometry('YÊU EM', {
      font: new FontLoader().parse(helvetikerFont),
      size: 2.4,
      height: 0.18,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.12,
      bevelSegments: 4,
    })

    textGeometry.center()

    const textPositions = textGeometry.attributes.position.array
    const usedTargets = []

    const totalParticles = Math.min(textPositions.length / 3, memoryFrames.length * 120)
    for (let i = 0; i < totalParticles; i += 1) {
      const index = (i * 3) % textPositions.length
      targetPositions.push(new THREE.Vector3(textPositions[index], textPositions[index + 1], textPositions[index + 2]))
    }

    memoryFrames.forEach((frame) => {
      frame.group.children.forEach((child) => {
        const box = new THREE.Box3().setFromObject(child)
        const size = new THREE.Vector3()
        box.getSize(size)
        for (let j = 0; j < 12; j += 1) {
          const start = new THREE.Vector3(
            box.min.x + Math.random() * size.x,
            box.min.y + Math.random() * size.y,
            box.min.z + Math.random() * size.z,
          )
          startPositions.push(start)
        }
      })
    })

    while (startPositions.length < targetPositions.length) {
      const randomPoint = new THREE.Vector3((Math.random() - 0.5) * 14, Math.random() * 6, (Math.random() - 0.5) * 14)
      startPositions.push(randomPoint)
    }

    const particleCount = Math.max(targetPositions.length, startPositions.length)
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i += 1) {
      const start = startPositions[i] || new THREE.Vector3((Math.random() - 0.5) * 14, Math.random() * 6, (Math.random() - 0.5) * 14)
      positions[i * 3] = start.x
      positions[i * 3 + 1] = start.y
      positions[i * 3 + 2] = start.z
      particles.push(start)
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xffe2ea,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    this.particleSystem.position.set(0, 1.8, 0)
    this.scene.add(this.particleSystem)

    this.textTargets = targetPositions
    this.startPositions = startPositions
    this.particleCount = particleCount
    this.particleGeometry = particleGeometry
    this.particlePositions = positions

    memoryFrames.forEach((frame) => {
      this.scene.remove(frame.group)
    })

    gsap.to(this.morphProgress, {
      value: 1,
      duration: 2.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this._updateParticleMorph()
      },
      onComplete: () => {
        this._spawnFireworks(12)
        this.uiManager.showGiftButton()
      },
    })
  }

  _updateParticleMorph() {
    if (!this.particleSystem) {
      return
    }
    const positions = this.particleGeometry.attributes.position.array
    const t = this.morphProgress.value

    for (let i = 0; i < this.particleCount; i += 1) {
      const start = this.startPositions[i] || new THREE.Vector3(0, 0, 0)
      const target = this.textTargets[i % this.textTargets.length]
      const lerpPos = start.clone().lerp(target, t)
      positions[i * 3] = lerpPos.x
      positions[i * 3 + 1] = lerpPos.y
      positions[i * 3 + 2] = lerpPos.z
    }

    this.particleGeometry.attributes.position.needsUpdate = true
  }

  _spawnFireworks(count) {
    for (let i = 0; i < count; i += 1) {
      const firework = this._createFirework()
      this.fireworkGroup.add(firework)
      gsap.to(firework.userData, {
        progress: 1,
        duration: 2.2 + Math.random() * 1.4,
        ease: 'power1.out',
        onUpdate: () => {
          const { start, direction, speed } = firework.userData
          const progress = firework.userData.progress
          firework.position.copy(start).add(direction.clone().multiplyScalar(progress * speed))
          firework.material.opacity = 1 - progress
        },
        onComplete: () => {
          this.fireworkGroup.remove(firework)
        },
      })
    }
  }

  _createFirework() {
    const geometry = new THREE.SphereGeometry(0.08, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd7ff), transparent: true, opacity: 1 })
    const mesh = new THREE.Mesh(geometry, material)
    const start = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1.3, (Math.random() - 0.5) * 6)
    mesh.position.copy(start)
    mesh.userData = {
      start,
      direction: new THREE.Vector3((Math.random() - 0.5), Math.random() * 0.9 + 0.6, (Math.random() - 0.5)).normalize(),
      speed: 5 + Math.random() * 2.8,
      progress: 0,
    }
    return mesh
  }

  update(delta) {
    if (!this.isActive) {
      return
    }

    if (this.fireworkGroup.children.length === 0 && this.particleSystem) {
      const positions = this.particleGeometry.attributes.position.array
      for (let i = 0; i < this.particleCount; i += 1) {
        positions[i * 3 + 1] += Math.sin(i * 0.13 + performance.now() * 0.002) * 0.003
      }
      this.particleGeometry.attributes.position.needsUpdate = true
    }
  }
}
