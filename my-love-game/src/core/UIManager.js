import { gsap } from 'gsap'

export class UIManager {
  constructor(container = document.body) {
    this.container = container
    this._createOverlay()
    this._createStartScreen()
    this._createCaptionLayer()
    this._createSecretMessage()
    this._createSkipButton()
    this._createStoryModal()
    this._createGiftButton()
    this._createGiftModal()
    this._createSnowOverlay()
    this.giftCallback = null
  }

  _createOverlay() {
    this.overlay = document.createElement('div')
    this.overlay.className = 'ui-overlay'
    this.container.appendChild(this.overlay)
  }

  _createStartScreen() {
    this.startScreen = document.createElement('section')
    this.startScreen.className = 'start-screen ui-panel'
    this.startScreen.innerHTML = `
      <h1 class="start-title">Love Quest</h1>
      <p class="start-subtitle">Bước vào hành trình kể chuyện đầy ánh sáng và trái tim.</p>
      <button class="start-button" type="button">Bắt đầu hành trình</button>
    `
    this.overlay.appendChild(this.startScreen)
    this.startButton = this.startScreen.querySelector('.start-button')
  }

  _createCaptionLayer() {
    this.captionLayer = document.createElement('div')
    this.captionLayer.className = 'caption-layer'
    this.overlay.appendChild(this.captionLayer)
  }

  _createSecretMessage() {
    this.secretMessage = document.createElement('div')
    this.secretMessage.className = 'secret-message'
    this.secretMessage.innerHTML = '<div><strong>Màn 2: Memory Gallery</strong><p>Phòng triển lãm ảnh kỷ niệm đang chờ em.</p></div>'
    this.overlay.appendChild(this.secretMessage)
  }

  _createSkipButton() {
    this.skipButton = document.createElement('button')
    this.skipButton.className = 'skip-button'
    this.skipButton.textContent = 'Skip Tour'
    this.skipButton.type = 'button'
    this.skipButton.style.opacity = '0'
    this.skipButton.style.pointerEvents = 'none'
    this.overlay.appendChild(this.skipButton)
  }

  _createStoryModal() {
    this.storyModal = document.createElement('div')
    this.storyModal.className = 'story-modal'
    this.storyModal.innerHTML = `
      <div class="story-modal-panel">
        <button class="story-modal-close" type="button">✕</button>
        <h2 class="story-modal-title"></h2>
        <p class="story-modal-body"></p>
      </div>
    `
    this.overlay.appendChild(this.storyModal)
    this.storyModal.querySelector('.story-modal-close').addEventListener('click', () => this.hideMemoryDetail())
  }

  _createGiftButton() {
    this.giftButton = document.createElement('button')
    this.giftButton.className = 'gift-button'
    this.giftButton.type = 'button'
    this.giftButton.textContent = 'Open Gift'
    this.giftButton.style.opacity = '0'
    this.giftButton.style.pointerEvents = 'none'
    this.giftButton.addEventListener('click', () => {
      if (typeof this.giftCallback === 'function') {
        this.giftCallback()
      }
      this.showGiftModal()
    })
    this.overlay.appendChild(this.giftButton)
  }

  _createGiftModal() {
    this.giftModal = document.createElement('div')
    this.giftModal.className = 'gift-modal'
    this.giftModal.innerHTML = `
      <div class="gift-card">
        <button class="gift-modal-close" type="button">✕</button>
        <h2>Gửi đến em</h2>
        <p>Hãy giữ lấy tấm thiệp và quét mã để nhận món quà của anh.</p>
        <div class="gift-qr"></div>
        <p class="gift-note">Cảm ơn em đã cùng anh đi qua mọi khoảnh khắc.</p>
      </div>
    `
    this.overlay.appendChild(this.giftModal)
    this.giftModal.querySelector('.gift-modal-close').addEventListener('click', () => this.hideGiftModal())
  }

  _createSnowOverlay() {
    this.snowOverlay = document.createElement('div')
    this.snowOverlay.className = 'gift-snow-overlay'
    this.snowOverlay.style.opacity = '0'
    this.snowOverlay.style.pointerEvents = 'none'
    for (let i = 0; i < 28; i += 1) {
      const flake = document.createElement('span')
      flake.className = 'snowflake'
      this.snowOverlay.appendChild(flake)
    }
    this.overlay.appendChild(this.snowOverlay)
  }

  _createFlashOverlay() {
    this.flashOverlay = document.createElement('div')
    this.flashOverlay.className = 'flash-overlay'
    this.flashOverlay.style.opacity = '0'
    this.flashOverlay.style.pointerEvents = 'none'
    this.overlay.appendChild(this.flashOverlay)
  }

  flashScreen() {
    if (!this.flashOverlay) {
      this._createFlashOverlay()
    }
    gsap.fromTo(
      this.flashOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.1, ease: 'power2.out', onComplete: () => {
        gsap.to(this.flashOverlay, { opacity: 0, duration: 0.35, ease: 'power2.in' })
      } },
    )
  }

  showSkipButton() {
    if (!this.skipButton) {
      this._createSkipButton()
    }
    this.skipButton.style.pointerEvents = 'auto'
    gsap.to(this.skipButton, { opacity: 1, duration: 0.4, ease: 'power2.out' })
  }

  hideSkipButton() {
    if (!this.skipButton) {
      return
    }
    gsap.to(this.skipButton, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
      this.skipButton.style.pointerEvents = 'none'
    } })
  }

  onSkip(callback) {
    if (!this.skipButton) {
      this._createSkipButton()
    }
    this.skipButton.addEventListener('click', callback)
  }

  showMemoryDetail(title, story) {
    if (!this.storyModal) {
      this._createStoryModal()
    }
    this.storyModal.querySelector('.story-modal-title').textContent = title
    this.storyModal.querySelector('.story-modal-body').textContent = story
    this.storyModal.style.pointerEvents = 'auto'
    gsap.to(this.storyModal, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' })
  }

  hideMemoryDetail() {
    if (!this.storyModal) {
      return
    }
    gsap.to(this.storyModal, { opacity: 0, scale: 0.92, duration: 0.25, ease: 'power2.in' })
  }

  showGiftButton() {
    if (!this.giftButton) {
      this._createGiftButton()
    }
    this.giftButton.style.pointerEvents = 'auto'
    gsap.to(this.giftButton, { opacity: 1, duration: 0.45, ease: 'power2.out' })
  }

  showGiftModal() {
    if (!this.giftModal) {
      this._createGiftModal()
    }
    if (this.snowOverlay) {
      gsap.to(this.snowOverlay, { opacity: 1, duration: 0.45, ease: 'power2.out' })
      gsap.fromTo(
        this.snowOverlay.querySelectorAll('.snowflake'),
        {
          y: -20,
          opacity: 0,
          scale: 0.6,
        },
        {
          y: 220,
          opacity: 1,
          scale: 1,
          duration: 2.8,
          ease: 'none',
          stagger: { each: 0.08, from: 'random' },
          repeat: -1,
          repeatRefresh: true,
        },
      )
    }
    this.giftModal.style.pointerEvents = 'auto'
    gsap.to(this.giftModal, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' })
  }

  hideGiftModal() {
    if (!this.giftModal) {
      return
    }
    if (this.snowOverlay) {
      gsap.to(this.snowOverlay, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    }
    gsap.to(this.giftModal, { opacity: 0, scale: 0.92, duration: 0.28, ease: 'power2.in' })
  }

  onGiftReveal(callback) {
    this.giftCallback = callback
  }

  onStart(callback) {
    this.startButton.addEventListener('click', () => {
      this._hideStartScreen()
      if (typeof callback === 'function') {
        callback()
      }
    })
  }

  _hideStartScreen() {
    gsap.to(this.startScreen, {
      opacity: 0,
      duration: 0.75,
      ease: 'power2.out',
      onComplete: () => {
        this.startScreen.remove()
      },
    })
  }

  showCaption(message) {
    const caption = document.createElement('div')
    caption.className = 'story-caption'
    caption.textContent = message
    this.captionLayer.appendChild(caption)

    gsap.fromTo(
      caption,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: -20,
        duration: 1.1,
        ease: 'power3.out',
        onComplete: () => {
          gsap.to(caption, {
            opacity: 0,
            y: -64,
            duration: 0.85,
            delay: 1.1,
            ease: 'power2.in',
            onComplete: () => caption.remove(),
          })
        },
      },
    )
  }

  showLevelComplete() {
    const overlayCover = document.createElement('div')
    overlayCover.className = 'level-complete-cover'
    this.overlay.appendChild(overlayCover)

    gsap.to(overlayCover, {
      opacity: 1,
      duration: 0.9,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.to(this.secretMessage, {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        })
      },
    })
  }
}
