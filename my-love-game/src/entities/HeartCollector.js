import * as THREE from 'three'
import { gsap } from 'gsap'
import { getRandomFloat, toNormalizedDeviceCoordinates, createStarTexture } from '../utils/threeUtils.js'

export const SPEED_FACTOR = 0.12 // base fall velocity for hearts; increase to make hearts drop faster
export const GRAVITY = 0.05 // acceleration downward over time, similar to gravity strength

const HEART_COUNT = 8
const LEVEL_TARGET = 100
const HEART_COLORS = [0xff4d88, 0xff8bb0, 0xffc2db]

export class HeartCollector {
  constructor(scene, camera, domElement, { onScoreChange, levelComplete } = {}) {
    this.scene = scene
    this.camera = camera
    this.domElement = domElement
    this.onScoreChange = onScoreChange
    this.levelComplete = levelComplete || function () {}
    this.score = 0
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.hearts = []
    this.particles = []

    this._createHeartMaterial()
    this._spawnHearts()
    this._pointerDown = this._onPointerDown.bind(this)
    this.domElement.addEventListener('pointerdown', this._pointerDown, false)
  }

  _createHeartMaterial() {
    this.heartMaterial = new THREE.MeshStandardMaterial({
      color: HEART_COLORS[0],
      emissive: 0xff3f7f,
      emissiveIntensity: 0.6,
      metalness: 0.28,
      roughness: 0.26,
      transparent: false,
    })
  }

  _createHeartGeometry() {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.5)
    shape.bezierCurveTo(-0.45, 0.9, -1.1, 0.6, -1.05, 0.05)
    shape.bezierCurveTo(-1.05, -0.7, -0.25, -1.15, 0, -1.4)
    shape.bezierCurveTo(0.25, -1.15, 1.05, -0.7, 1.05, 0.05)
    shape.bezierCurveTo(1.1, 0.6, 0.45, 0.9, 0, 0.5)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.08,
      bevelSegments: 3,
      steps: 20,
    })
  }

  _spawnHearts() {
    for (let i = 0; i < HEART_COUNT; i += 1) {
      const mesh = new THREE.Mesh(this._createHeartGeometry(), this.heartMaterial.clone())
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.velocity = SPEED_FACTOR + Math.random() * 0.08
      mesh.userData.rotationSpeed = 0.5 + Math.random() * 0.9
      this._resetHeart(mesh, true)
      this.hearts.push(mesh)
      this.scene.add(mesh)
    }
  }

  _resetHeart(mesh, initial = false) {
    mesh.position.set(getRandomFloat(-6, 6), 10 + getRandomFloat(0, 6), getRandomFloat(-5, 5))
    mesh.rotation.set(getRandomFloat(0, Math.PI), getRandomFloat(0, Math.PI), getRandomFloat(0, Math.PI))
    mesh.userData.velocity = SPEED_FACTOR + getRandomFloat(0, 0.06)
    mesh.material.color.setHex(HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)])
    mesh.visible = true
    if (!initial) {
      gsap.fromTo(mesh.scale, { x: 0.15, y: 0.15, z: 0.15 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(1.7)' })
    }
  }

  _onPointerDown(event) {
    const normalized = toNormalizedDeviceCoordinates(event, this.domElement)
    this.pointer.set(normalized.x, normalized.y)
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const hit = this.raycaster.intersectObjects(this.hearts, false)[0]
    if (!hit) {
      return
    }

    this._popHeart(hit.object)
  }

  _popHeart(heart) {
    this._spawnParticles(heart.position)
    this.score += 10
    if (this.score > LEVEL_TARGET) {
      this.score = LEVEL_TARGET
    }

    if (typeof this.onScoreChange === 'function') {
      this.onScoreChange(this.score)
    }

    this._resetHeart(heart)

    if (this.score >= LEVEL_TARGET) {
      this.levelComplete()
    }
  }

  _spawnParticles(origin) {
    const count = 16
    const positions = new Float32Array(count * 3)
    const velocities = []

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = origin.x
      positions[i * 3 + 1] = origin.y
      positions[i * 3 + 2] = origin.z

      const direction = new THREE.Vector3(getRandomFloat(-0.5, 0.5), getRandomFloat(0.4, 1.2), getRandomFloat(-0.5, 0.5)).normalize()
      velocities.push(direction.multiplyScalar(2.2 + getRandomFloat(0, 2.8)))
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.08,
      map: createStarTexture(128, '#ffd7e8'),
      color: 0xffbfd7,
      transparent: true,
      opacity: 0.72,
      alphaTest: 0.12,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const points = new THREE.Points(geometry, material)
    points.userData = { velocities, life: 0 }
    this.particles.push(points)
    this.scene.add(points)

    gsap.to(points.material, { opacity: 0, duration: 0.9, ease: 'power2.out' })
  }

  update(delta) {
    this.hearts.forEach((heart) => {
      heart.userData.velocity += GRAVITY * delta
      heart.position.y -= heart.userData.velocity * 6 * delta
      heart.rotation.x += heart.userData.rotationSpeed * delta
      heart.rotation.z += heart.userData.rotationSpeed * delta * 0.65

      if (heart.position.y < -8) {
        this._resetHeart(heart)
      }
    })

    this.particles = this.particles.filter((point) => {
      const positions = point.geometry.attributes.position.array
      const velocities = point.userData.velocities

      for (let i = 0; i < velocities.length; i += 1) {
        positions[i * 3] += velocities[i].x * delta
        positions[i * 3 + 1] += velocities[i].y * delta
        positions[i * 3 + 2] += velocities[i].z * delta
        velocities[i].y -= GRAVITY * delta * 1.8
      }

      point.geometry.attributes.position.needsUpdate = true
      point.userData.life += delta

      if (point.userData.life > 1.0) {
        this.scene.remove(point)
        point.geometry.dispose()
        point.material.dispose()
        return false
      }

      return true
    })
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._pointerDown, false)
  }
}
