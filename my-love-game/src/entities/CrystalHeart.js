import * as THREE from 'three'
import { gsap } from 'gsap'
import { getRandomFloat } from '../utils/threeUtils.js'

export const IRIDESCENCE_INTENSITY = 1.25 // higher value increases the shimmer intensity of the shader

const VERTEX_SHADER = `varying vec3 vNormal;
varying vec3 vViewDirection;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDirection = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}`

const FRAGMENT_SHADER = `uniform float time;
uniform float iridescenceIntensity;
uniform vec3 baseColor;
varying vec3 vNormal;
varying vec3 vViewDirection;

vec3 hueShift(vec3 color, float shift) {
  float angle = shift * 6.28318530718;
  float s = sin(angle);
  float c = cos(angle);
  mat3 m = mat3(
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
  );
  return m * color;
}

void main() {
  float angle = dot(vNormal, vViewDirection);
  float reflectFactor = pow(1.0 - angle, 1.6);
  float shift = fract(angle * 1.4 + time * 0.07);
  vec3 iridescentA = hueShift(vec3(1.0, 0.6, 0.95), shift);
  vec3 iridescentB = hueShift(vec3(0.5, 0.95, 1.0), shift + 0.25);
  vec3 iridescentC = hueShift(vec3(0.95, 1.0, 0.6), shift + 0.5);
  vec3 iridescent = mix(mix(iridescentA, iridescentB, smoothstep(0.0, 0.5, reflectFactor)), iridescentC, smoothstep(0.5, 1.0, reflectFactor));
  float fresnel = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 2.0) * iridescenceIntensity;
  vec3 finalColor = mix(baseColor, iridescent, 0.78) * (0.8 + fresnel * 0.45);
  gl_FragColor = vec4(finalColor, 1.0);
}`

export class CrystalHeart {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.time = 0

    this.uniforms = {
      time: { value: 0 },
      iridescenceIntensity: { value: IRIDESCENCE_INTENSITY },
      baseColor: { value: new THREE.Color(0xff6ea7) },
    }

    this.mesh = new THREE.Mesh(this._createGeometry(), this._createMaterial())
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.position.set(0, 0, 0)
    this.mesh.scale.set(1.5, 1.5, 1.5)
    scene.add(this.mesh)
    this._setupLevitation()
  }

  _createGeometry() {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.8)
    shape.bezierCurveTo(-0.55, 1.3, -1.25, 1.0, -1.2, 0.08)
    shape.bezierCurveTo(-1.2, -0.8, -0.28, -1.35, 0, -1.6)
    shape.bezierCurveTo(0.28, -1.35, 1.2, -0.8, 1.2, 0.08)
    shape.bezierCurveTo(1.25, 1.0, 0.55, 1.3, 0, 0.8)

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.52,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelSegments: 4,
      steps: 30,
    })
  }

  _createMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: false,
      side: THREE.DoubleSide,
    })
  }

  _setupLevitation() {
    gsap.to(this.mesh.position, {
      y: 0.35,
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    gsap.to(this.mesh.rotation, {
      y: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: 'linear',
    })

    gsap.to(this.mesh.rotation, {
      x: 0.25,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }

  update(delta) {
    this.time += delta
    this.uniforms.time.value = this.time
  }
}
