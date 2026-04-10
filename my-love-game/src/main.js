import './style.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { SceneManager } from './core/SceneManager.js'
import { UIManager } from './core/UIManager.js'
import { Level2Manager } from './core/Level2Manager.js'
import { Level3Manager } from './core/Level3Manager.js'
import { GrandFinale } from './core/GrandFinale.js'
import { HeartCollector } from './entities/HeartCollector.js'
import { CrystalHeart } from './entities/CrystalHeart.js'

const container = document.querySelector('#app')
container.innerHTML = `
  <div id="scoreboard">Score: 0</div>
  <div id="game-message">Bắt đầu hành trình bằng cách chạm vào trái tim.</div>
`

const sceneManager = new SceneManager(container)
const uiManager = new UIManager(container)
const scoreElement = document.querySelector('#scoreboard')
const messageElement = document.querySelector('#game-message')

const crystalHeart = new CrystalHeart(sceneManager.scene, sceneManager.camera)
sceneManager.registerEntity(crystalHeart)

const level2Manager = new Level2Manager(sceneManager.scene, sceneManager.camera, sceneManager.domElement, uiManager, sceneManager.audioListener)
sceneManager.registerEntity(level2Manager)

const level3Manager = new Level3Manager(sceneManager.scene, sceneManager.camera, sceneManager.domElement, uiManager, sceneManager.audioListener)
sceneManager.registerEntity(level3Manager)

const grandFinale = new GrandFinale(sceneManager.scene, sceneManager.camera, uiManager)
sceneManager.registerEntity(grandFinale)

uiManager.onSkip(() => {
  sceneManager.skipGalleryTour()
  uiManager.hideSkipButton()
})

const storyCaptions = [
  'Ngày đầu mình gặp nhau...',
  'Nụ cười em như ánh bình minh...',
  'Mỗi trái tim rơi là một kỷ niệm...',
  'Từng khoảnh khắc bên nhau càng lung linh...',
]

let collector = null

function startGame() {
  collector = new HeartCollector(sceneManager.scene, sceneManager.camera, sceneManager.domElement, {
    onScoreChange: (score) => {
      scoreElement.textContent = `Score: ${score}`
      const caption = storyCaptions[(score / 10 - 1) % storyCaptions.length]
      if (caption) {
        uiManager.showCaption(caption)
      }
    },
    levelComplete: () => {
      messageElement.textContent = 'Level Complete! Hành trình tiếp theo đang chờ.'
      uiManager.showLevelComplete()
      const completedCollector = collector
      collector = null
      level2Manager.startTransition(completedCollector, () => {
        sceneManager.startGalleryTour(level2Manager.memoryFrames, uiManager, () => {
          sceneManager.transitionToLevel3(level2Manager, crystalHeart, uiManager, () => {
            level3Manager.startFlight(() => {
              grandFinale.triggerFinale(level2Manager.memoryFrames)
            })
          })
        })
      })
    },
  })

  messageElement.textContent = 'Thu thập trái tim để mở ra những kỷ niệm.'
}

uiManager.onStart(() => {
  sceneManager.resumeAudio()
  startGame()
})

const clock = new THREE.Clock()

function animate() {
  const delta = clock.getDelta()
  sceneManager.update(delta)

  if (collector) {
    collector.update(delta)
  }

  requestAnimationFrame(animate)
}

animate()
