<template>
  <div class="home-page home-page-body-bg">
    <!-- 英雄区域 -->
    <header class="hero">
      <div class="hero-content">
        <p class="hero-eyebrow moss-eyebrow">苔生方块 · 无限可能</p>
        <h1 class="hero-title">
          造你所想<br>
          <span class="title-accent-blue">探索</span>无界
        </h1>
        <p class="hero-subtitle">在由方块构成的无尽世界中，建造、冒险、生存。<br>让每一寸苔藓，都生长出新的可能。</p>

        <!-- 动态计数器 -->
        <div class="counter-card" id="counterCard">
          <div class="counter-item">
            <div class="counter-label">当前在线</div>
            <div class="counter-value" id="onlineCount">—</div>
          </div>
          <div class="counter-divider"></div>
          <div class="counter-item">
            <div class="counter-label">最大容量</div>
            <div class="counter-value coral" id="maxCount">—</div>
          </div>
          <div class="counter-divider"></div>
          <div class="counter-item">
            <div class="counter-label">服务器状态</div>
            <div class="counter-status" id="serverStatus">
              <span class="status-dot status-dot-pending"></span>
              <span class="status-text">连接中…</span>
            </div>
          </div>
        </div>

        <!-- 胶囊按钮 -->
        <div class="hero-cta">
          <a href="#join" class="capsule-btn capsule-primary" id="joinBtnHero">
            <span>加入服务器</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <a href="#features" class="capsule-btn capsule-secondary">
            <span>了解特性</span>
          </a>
        </div>
      </div>
    </header>

    <!-- 核心玩法 -->
    <section class="features-section" id="features">
      <div class="section-header">
        <p class="section-eyebrow">核心玩法</p>
        <h2 class="section-title">每一种玩法，都是一种态度</h2>
        <p class="section-desc">滑动探索 Minecraft 的多维世界</p>
      </div>

      <div class="carousel-wrapper">
        <button class="carousel-btn carousel-prev" id="prevBtn" aria-label="上一个">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="carousel-track" id="carouselTrack">
          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon blue-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-name">探索</h3>
            <p class="feature-tag blue">EXPLORATION</p>
            <p class="feature-desc">穿越繁茂洞穴、深邃黑暗，丈量从基岩到天空的每一寸可能。</p>
          </div>

          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon coral-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M14.5 3.5L19 8l-9 9-4.5-4.5 9-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M5 17l-2 4 4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 11l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-name">战斗</h3>
            <p class="feature-tag coral">COMBAT</p>
            <p class="feature-desc">挥剑迎击末影龙，在下界要塞中与凋灵展开生死对决。</p>
          </div>

          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon blue-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M3 21l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 15l5-5 5 5-5 5-5-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M14 10l3-3a2 2 0 013 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="feature-name">采集</h3>
            <p class="feature-tag blue">GATHERING</p>
            <p class="feature-desc">挥动钻石镐，挖掘远古残骸，收集构建文明的每一块基石。</p>
          </div>

          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon coral-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M6 20V8l6-4 6 4v12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M10 20v-5h4v5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="feature-name">建造</h3>
            <p class="feature-tag coral">BUILDING</p>
            <p class="feature-desc">从红石机械到摩天城堡，将想象力浇筑进每一个方块。</p>
          </div>

          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon blue-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-6 6 2 2 6-6a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="feature-name">合成</h3>
            <p class="feature-tag blue">CRAFTING</p>
            <p class="feature-desc">在工作台中调配万物，从木剑到附魔装备，创造你的工具谱系。</p>
          </div>

          <div class="feature-card neu-card">
            <div class="feature-icon neu-icon coral-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="feature-name">红石</h3>
            <p class="feature-tag coral">REDSTONE</p>
            <p class="feature-desc">用红石电路编织自动化机械，让方块世界拥有心跳与脉搏。</p>
          </div>
        </div>

        <button class="carousel-btn carousel-next" id="nextBtn" aria-label="下一个">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="carousel-dots" id="carouselDots"></div>
    </section>

    <!-- 世界掠影画廊 -->
    <section class="gallery-section" id="gallery">
      <div class="section-header">
        <p class="section-eyebrow moss-eyebrow">世界掠影</p>
        <h2 class="section-title">来自苔生世界的真实瞬间</h2>
        <p class="section-desc">由 MossyMC 玩家共同建造与捕捉</p>
      </div>

      <div class="gallery-grid">
        <figure class="gallery-item gallery-featured neu-frame">
          <div class="gallery-img-wrap">
            <img :src="baseUrl + 'resource/特色建筑.webp'" alt="特色建筑" loading="lazy">
          </div>
          <figcaption>
            <span class="caption-title">特色建筑</span>
            <span class="caption-sub">新增建筑</span>
          </figcaption>
        </figure>

        <figure class="gallery-item neu-frame">
          <div class="gallery-img-wrap">
            <img :src="baseUrl + 'resource/美景1.webp'" alt="美景一" loading="lazy">
          </div>
          <figcaption>
            <span class="caption-title">晨曦之境</span>
            <span class="caption-sub">方块世界的日出</span>
          </figcaption>
        </figure>

        <figure class="gallery-item neu-frame">
          <div class="gallery-img-wrap">
            <img :src="baseUrl + 'resource/美景2.webp'" alt="美景二" loading="lazy">
          </div>
          <figcaption>
            <span class="caption-title">静谧之地</span>
            <span class="caption-sub">无人打扰的角落</span>
          </figcaption>
        </figure>

        <figure class="gallery-item neu-frame">
          <div class="gallery-img-wrap">
            <img :src="baseUrl + 'resource/美景3.webp'" alt="美景三" loading="lazy">
          </div>
          <figcaption>
            <span class="caption-title">远眺之峰</span>
            <span class="caption-sub">登顶方知天地广</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 加入区 -->
    <section class="join-section" id="join">
      <div class="join-card neu-card">
        <p class="section-eyebrow moss-eyebrow">立即开始</p>
        <h2 class="join-title">你的方块冒险，<br>从此刻启程</h2>
        <p class="join-desc">复制服务器地址，进入游戏多人模式，加入全球玩家的方块宇宙。</p>

        <div class="server-address neu-inset">
          <span class="address-text">mossymc.top</span>
          <button class="copy-btn" id="copyBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>复制</span>
          </button>
        </div>

        <a href="#" class="capsule-btn capsule-primary capsule-large" id="joinBtnMain">
          <span>加入服务器</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <p class="join-hint">支持 Java 版 1.20+ · 基岩版同步开放</p>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" fill="currentColor"/>
          </svg>
          <span>Mossy<span class="moss-accent">MC</span></span>
        </div>
        <p class="footer-text">© 2026 MossyMC · 苔生方块，致敬无限创造。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const baseUrl = import.meta.env.BASE_URL
const SERVER_HOST = 'mossymc.top'

// 动态计数器状态
const onlineCount = ref('—')
const maxCount = ref('—')
const serverStatusText = ref('连接中…')
const serverStatusClass = ref('status-dot-pending')
const onlineBump = ref(false)

// 弹簧式数字滚动
function animateNumber(el, from, to, duration) {
  if (Number.isNaN(from)) from = 0
  const start = performance.now()
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    const c1 = 1.4, c3 = c1 + 1
    const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2)
    const value = Math.round(from + (to - from) * Math.max(0, eased))
    el.textContent = value.toLocaleString()
    if (progress < 1) requestAnimationFrame(step)
    else el.textContent = to.toLocaleString()
  }
  requestAnimationFrame(step)
}

async function fetchStatus() {
  try {
    serverStatusText.value = '连接中…'
    serverStatusClass.value = 'status-dot-pending'
    const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_HOST}`)
    if (!res.ok) throw new Error('接口异常')
    const data = await res.json()

    if (!data.online) {
      onlineCount.value = '—'
      maxCount.value = '—'
      serverStatusText.value = '未连接'
      serverStatusClass.value = 'status-dot-offline'
      return
    }

    const online = data.players?.online ?? 0
    const max = data.players?.max ?? 0
    serverStatusText.value = '运行中'
    serverStatusClass.value = 'status-dot-online'

    // 动画更新数字
    const onlineEl = document.getElementById('onlineCount')
    const maxEl = document.getElementById('maxCount')
    if (onlineEl) animateNumber(onlineEl, parseInt(onlineCount.value) || 0, online, 1200)
    if (maxEl) animateNumber(maxEl, 0, max, 1200)

    // 在线人数变化时高亮
    if (online > 0) {
      onlineBump.value = true
      setTimeout(() => onlineBump.value = false, 700)
    }
  } catch (err) {
    onlineCount.value = '—'
    maxCount.value = '—'
    serverStatusText.value = '未连接'
    serverStatusClass.value = 'status-dot-offline'
  }
}

// 复制服务器地址
function initCopy() {
  const copyBtn = document.getElementById('copyBtn')
  if (!copyBtn) return
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('mossymc.top')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = 'mossymc.top'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    const label = copyBtn.querySelector('span')
    if (label) {
      const original = label.textContent
      label.textContent = '已复制'
      copyBtn.classList.add('copied')
      setTimeout(() => {
        label.textContent = original
        copyBtn.classList.remove('copied')
      }, 1800)
    }
  })
}

// 轮播图：无缝无限循环（手动）
// 前后各克隆一整组卡片作为缓冲，滑进克隆区后静默平移一个整组宽度，
// 视觉上首尾相接、永远滑不到尽头
function initCarousel() {
  const track = document.getElementById('carouselTrack')
  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')
  const dotsContainer = document.getElementById('carouselDots')
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return

  const originals = Array.from(track.querySelectorAll('.feature-card'))
  const COUNT = originals.length
  if (!COUNT) return

  let programmatic = false
  let userInteracted = false
  let rafId = null
  let dotsTimer = null
  let settleTimer = null

  // 前后各克隆一组，长度足够让两个方向都滑不到物理尽头
  const fragmentBefore = document.createDocumentFragment()
  const fragmentAfter = document.createDocumentFragment()
  originals.forEach((card) => {
    const cloneBefore = card.cloneNode(true)
    cloneBefore.setAttribute('aria-hidden', 'true')
    cloneBefore.setAttribute('data-clone', 'true')
    fragmentBefore.appendChild(cloneBefore)

    const cloneAfter = card.cloneNode(true)
    cloneAfter.setAttribute('aria-hidden', 'true')
    cloneAfter.setAttribute('data-clone', 'true')
    fragmentAfter.appendChild(cloneAfter)
  })
  track.insertBefore(fragmentBefore, track.firstChild)
  track.appendChild(fragmentAfter)

  const allCards = Array.from(track.querySelectorAll('.feature-card'))

  // 位置统一以 track 的滚动内容为参照系，避免 offsetParent 带来的固定偏差
  function posInTrack(card) {
    return card.offsetLeft - track.offsetLeft
  }

  // 让第 index 张卡片居中所需的 scrollLeft
  function cardOffset(index) {
    const card = allCards[index]
    return Math.round(posInTrack(card) - (track.clientWidth - card.clientWidth) / 2)
  }

  // 相邻两组中同一张卡片的间距 = 一个整组宽度
  function groupWidth() {
    return posInTrack(allCards[COUNT]) - posInTrack(allCards[0])
  }

  function getCenterIndex() {
    const trackCenter = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    allCards.forEach((card, i) => {
      const dist = Math.abs(posInTrack(card) + card.clientWidth / 2 - trackCenter)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    return closest
  }

  // 瞬时定位：临时关闭平滑滚动，归位时不会出现可见动画
  function jumpTo(left) {
    const prevBehavior = track.style.scrollBehavior
    track.style.scrollBehavior = 'auto'
    track.scrollLeft = left
    track.style.scrollBehavior = prevBehavior
  }

  function scrollToCard(index) {
    programmatic = true
    track.scrollTo({ left: cardOffset(index), behavior: 'smooth' })
    scheduleSettle()
  }

  // 滑进克隆区就静默平移一个整组，视觉上等同回到原位
  function normalize() {
    const idx = getCenterIndex()
    if (idx < COUNT) jumpTo(track.scrollLeft + groupWidth())
    else if (idx >= COUNT * 2) jumpTo(track.scrollLeft - groupWidth())
  }

  // 指示点：把克隆位置映射回对应的原始卡片
  function updateDots() {
    const idx = getCenterIndex()
    const dotIndex = ((idx - COUNT) % COUNT + COUNT) % COUNT
    dots.forEach((dot, i) => dot.classList.toggle('active', i === dotIndex))
  }

  // 平滑滚动结束（停止 140ms）后归位并校正指示点
  function scheduleSettle() {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      programmatic = false
      normalize()
      updateDots()
    }, 140)
  }

  // 生成指示点（只对应原始卡片）
  originals.forEach((_, i) => {
    const dot = document.createElement('button')
    dot.className = 'dot' + (i === 0 ? ' active' : '')
    dot.setAttribute('aria-label', `跳转到第 ${i + 1} 张`)
    dot.addEventListener('click', () => scrollToCard(COUNT + i))
    dotsContainer.appendChild(dot)
  })

  const dots = dotsContainer.querySelectorAll('.dot')

  // 手动拖动时实时归位；程序化动画期间等滚动停下再归位，避免打断动画
  track.addEventListener('scroll', () => {
    if (!programmatic && !rafId) {
      rafId = requestAnimationFrame(() => {
        rafId = null
        normalize()
      })
    }
    clearTimeout(dotsTimer)
    dotsTimer = setTimeout(updateDots, 80)
  }, { passive: true })

  // 按钮不用再手写绕回逻辑，克隆区负责无缝衔接
  nextBtn.addEventListener('click', () => {
    userInteracted = true
    scrollToCard(getCenterIndex() + 1)
  })

  prevBtn.addEventListener('click', () => {
    userInteracted = true
    scrollToCard(getCenterIndex() - 1)
  })

  track.setAttribute('tabindex', '0')
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click() }
  })

  const interactionEvents = ['pointerdown', 'wheel', 'touchstart']
  interactionEvents.forEach((evt) => {
    track.addEventListener(evt, () => { userInteracted = true }, { passive: true, once: true })
  })

  // 初始居中到中间一组的第一张，保证两个方向都有缓冲
  const centerOnFirst = () => jumpTo(cardOffset(COUNT))
  centerOnFirst()
  requestAnimationFrame(() => requestAnimationFrame(centerOnFirst))
  window.addEventListener('load', () => { if (!userInteracted) centerOnFirst() })

  // 窗口尺寸变化后重新对齐当前卡片
  window.addEventListener('resize', () => {
    clearTimeout(settleTimer)
    jumpTo(cardOffset(getCenterIndex()))
  })

  updateDots()
}

// 胶囊按钮波纹
function initRipple() {
  document.querySelectorAll('.capsule-primary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect()
      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        background: rgba(255,255,255,0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.6s ease-out;
        pointer-events: none;
      `
      this.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    })
  })
}

// 磁吸按钮
function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return
  document.querySelectorAll('.capsule-primary, .capsule-secondary').forEach(btn => {
    const STRENGTH = 0.25
    let raf
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate(${x * STRENGTH}px, ${y * STRENGTH}px)`
      })
    })
    btn.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf)
      btn.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      btn.style.transform = 'translate(0, 0)'
      setTimeout(() => { btn.style.transition = '' }, 500)
    })
  })
}

// 卡片光标追踪高光
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return
  document.querySelectorAll('.feature-card').forEach(card => {
    let raf
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--mx', x + '%')
        card.style.setProperty('--my', y + '%')
        card.classList.add('tilting')
      })
    })
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf)
      card.classList.remove('tilting')
      card.style.removeProperty('--mx')
      card.style.removeProperty('--my')
    })
  })
}

// 滚动揭示
function initScrollReveal() {
  // 轮播的克隆卡片不参与，避免滑入克隆区时闪烁
  const groups = ['.feature-card:not([data-clone])', '.gallery-item']
  groups.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal')
      el.style.setProperty('--i', i)
    })
  })
  document.querySelectorAll('.section-header, .join-card').forEach(el => {
    el.classList.add('reveal')
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
}

// 英雄区视差
function initHeroParallax() {
  const hero = document.querySelector('.hero-content')
  if (!hero) return
  let ticking = false
  function update() {
    const y = window.scrollY
    if (y < window.innerHeight) {
      const opacity = Math.max(0, 1 - y / (window.innerHeight * 0.7))
      const translate = y * 0.35
      hero.style.opacity = opacity
      hero.style.transform = `translateY(${translate}px)`
    }
    ticking = false
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update)
      ticking = true
    }
  }, { passive: true })
}

// ===========================
// 隐秘彩蛋（FIM）：不可逆，触发后只能刷新恢复
// 触发方式：1.4 秒内连点页脚 Logo 5 次
// 效果：循环播放 resource/fim.mp3
//      resource/fim.png 铺满全屏，由全透明在 60 秒内逐渐显现
//      整页套上黑白滤镜，所有文字变为 FRIEND INSIDE ME
// ===========================
const FIM_TEXT = 'FRIEND INSIDE ME'

// 立即把所有可见文本改写为 FIM_TEXT
function rewritePageText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {
        return NodeFilter.FILTER_REJECT
      }
      if (parent.closest && parent.closest('.fim-overlay')) return NodeFilter.FILTER_REJECT
      return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    }
  })
  const targets = []
  while (walker.nextNode()) targets.push(walker.currentNode)
  targets.forEach((n) => { n.nodeValue = FIM_TEXT })
}

// 持续强制：之后任何 JS 写入的文本（如在线人数轮询）都会立刻被改写
function enforceFimText() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      const t = m.target
      if (t.nodeType === Node.TEXT_NODE && t.nodeValue && t.nodeValue.trim() && t.nodeValue !== FIM_TEXT) {
        const parent = t.parentElement
        if (parent && parent.closest && parent.closest('.fim-overlay')) return
        t.nodeValue = FIM_TEXT
      }
    })
  })
  observer.observe(document.body, { subtree: true, characterData: true })
}

function triggerFim() {
  document.body.classList.add('fim-active')

  // 所有文字变为 FRIEND INSIDE ME
  rewritePageText()
  enforceFimText()

  // 循环播放 fim.mp3，音量渐入
  const audio = new Audio(`${baseUrl}resource/fim.mp3`)
  audio.loop = true
  audio.volume = 0
  const fadeIn = () => {
    if (audio.volume < 0.9) {
      audio.volume = Math.min(0.9, audio.volume + 0.012)
      requestAnimationFrame(fadeIn)
    }
  }
  const playPromise = audio.play()
  if (playPromise && playPromise.catch) {
    playPromise.catch(() => {
      // 自动播放被拦截时，等下一次点击再补放
      document.addEventListener('pointerdown', () => { audio.play().catch(() => {}) }, { once: true })
    })
  }
  fadeIn()

  // fim.webp 覆盖层：先插入 DOM，下一帧再加 .show 触发动画
  const overlay = document.createElement('div')
  overlay.className = 'fim-overlay'
  const img = document.createElement('img')
  img.src = `${baseUrl}resource/fim.webp`
  img.alt = ''
  overlay.appendChild(img)
  document.body.appendChild(overlay)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('show'))
  })
}

function initFimEasterEgg() {
  // VitePress 页面没有导航 Logo，用页脚 Logo 作为隐秘触发点
  const logo = document.querySelector('.home-page .footer-logo')
  if (!logo) return

  const CLICKS_NEEDED = 5
  const WINDOW_MS = 1400
  let clicks = 0
  let timer = null
  let fired = false

  logo.addEventListener('click', () => {
    if (fired) return
    clicks++
    clearTimeout(timer)
    timer = setTimeout(() => { clicks = 0 }, WINDOW_MS)
    if (clicks < CLICKS_NEEDED) return
    clicks = 0
    fired = true
    triggerFim()
  })
}

let statusTimer = null

onMounted(() => {
  // 计数器
  fetchStatus()
  statusTimer = setInterval(fetchStatus, 30000)

  // 其他交互
  initCarousel()
  initCopy()
  initRipple()
  initMagneticButtons()
  initCardTilt()
  initScrollReveal()
  initHeroParallax()
  initFimEasterEgg()
})

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer)
})
</script>

<style>
/* ===========================
   HomePage 组件样式（全局，以 .home-page 包裹）
   =========================== */

/* 基础重置 */
.home-page * {
  box-sizing: border-box;
}

.home-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
               "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", sans-serif;
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

.home-page a {
  color: inherit;
  text-decoration: none;
}

/* Logo 标记 */
.home-page .logo-mark {
  position: relative;
  display: inline-flex;
}

.home-page .logo-moss {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
  background: linear-gradient(135deg, var(--moss-soft), var(--moss));
  box-shadow: 0 1px 2px rgba(61, 107, 60, 0.35);
}

.home-page .moss-accent {
  color: var(--moss);
}

.home-page .moss-eyebrow {
  color: var(--moss) !important;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.home-page .moss-eyebrow::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50% 50% 45% 55% / 55% 45% 55% 45%;
  background: linear-gradient(135deg, var(--moss-soft), var(--moss));
}

/* ===========================
   英雄区域
   =========================== */
.home-page .hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 32px 60px;
  text-align: center;
  background-image:
    linear-gradient(180deg,
      rgba(12, 20, 16, 0.78) 0%,
      rgba(12, 20, 16, 0.62) 45%,
      rgba(12, 20, 16, 0.55) 65%,
      rgba(232, 232, 237, 0.96) 96%,
      var(--bg) 100%),
    url("/resource/美景1.webp");
  background-size: cover;
  background-position: center 30%;
  background-repeat: no-repeat;
}

.home-page .hero-content {
  max-width: 820px;
  transition: opacity 0.1s linear, transform 0.1s linear;
  will-change: opacity, transform;
}

.home-page .hero-eyebrow {
  font-size: 17px;
  color: var(--blue);
  font-weight: 500;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
  animation: fadeUpSpring 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.home-page .hero-title {
  font-size: clamp(48px, 8vw, 88px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
  color: #FFFFFF;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
  animation: fadeUpSpring 1.15s cubic-bezier(0.34, 1.56, 0.64, 1) 0.22s both;
}

.home-page .title-accent-blue {
  background: linear-gradient(135deg, var(--blue-soft) 0%, #A8E6FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.home-page .hero-subtitle {
  font-size: clamp(17px, 2vw, 21px);
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.5;
  margin-bottom: 48px;
  font-weight: 400;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.3);
  animation: fadeUpSpring 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.36s both;
}

.home-page .hero .moss-eyebrow {
  color: var(--moss-soft) !important;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.4);
}

/* ===========================
   动态计数器
   =========================== */
.home-page .counter-card {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 28px 40px;
  border-radius: var(--radius-lg);
  margin-bottom: 48px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.16);
  animation: fadeUpSpring 1.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
}

.home-page .counter-item {
  padding: 0 28px;
  text-align: center;
  min-width: 120px;
}

.home-page .counter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  font-weight: 500;
}

.home-page .counter-value {
  font-size: 36px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.home-page .counter-value.coral {
  color: var(--coral-soft);
}

.home-page .counter-divider {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.25), transparent);
}

.home-page .counter-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
}

.home-page .status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.home-page .status-dot-online {
  background: #34C759;
  box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.5);
  animation: pulse 2s infinite;
}

.home-page .status-dot-offline {
  background: var(--text-tertiary);
}

.home-page .status-dot-pending {
  background: #FF9F0A;
  box-shadow: 0 0 0 0 rgba(255, 159, 10, 0.5);
  animation: pulse-amber 1.4s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.5); }
  70% { box-shadow: 0 0 0 12px rgba(52, 199, 89, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
}

@keyframes pulse-amber {
  0% { box-shadow: 0 0 0 0 rgba(255, 159, 10, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(255, 159, 10, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 159, 10, 0); }
}

.home-page .counter-value.bump {
  animation: bump 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

/* ===========================
   胶囊按钮
   =========================== */
.home-page .hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeUpSpring 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.64s both;
}

.home-page .capsule-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  border-radius: 980px;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  border: none;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.home-page .capsule-primary {
  background: linear-gradient(135deg, var(--blue) 0%, var(--blue-deep) 100%);
  color: #FFFFFF;
  box-shadow: 0 8px 24px rgba(10, 132, 255, 0.35),
              0 2px 8px rgba(10, 132, 255, 0.2);
}

.home-page .capsule-primary:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 14px 36px rgba(10, 132, 255, 0.45),
              0 4px 12px rgba(10, 132, 255, 0.3);
}

.home-page .capsule-primary:active {
  transform: translateY(-1px) scale(1.01);
}

.home-page .capsule-primary svg {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.home-page .capsule-primary:hover svg {
  transform: translateX(4px);
}

.home-page .capsule-secondary {
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  color: #FFFFFF;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.home-page .capsule-secondary:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.home-page .capsule-large {
  padding: 20px 44px;
  font-size: 19px;
  margin-top: 32px;
}

/* ===========================
   通用区块
   =========================== */
.home-page .section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 64px;
  padding: 0 32px;
}

.home-page .section-eyebrow {
  font-size: 15px;
  color: var(--coral);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.home-page .section-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.home-page .section-desc {
  font-size: 19px;
  color: var(--text-secondary);
  font-weight: 400;
}

/* ===========================
   特性轮播
   =========================== */
.home-page .features-section {
  padding: 120px 0;
}

.home-page .carousel-wrapper {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-page .carousel-track {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  padding: 30px 10px 40px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.home-page .carousel-track::-webkit-scrollbar {
  display: none;
}

.home-page .feature-card {
  position: relative;
  flex: 0 0 320px;
  scroll-snap-align: center;
  padding: 40px 32px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  text-align: center;
  --mx: 50%;
  --my: 0%;
}

.home-page .feature-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle 180px at var(--mx) var(--my),
              rgba(255, 255, 255, 0.35), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 0;
}

.home-page .feature-card.tilting::after {
  opacity: 1;
}

.home-page .feature-card > * {
  position: relative;
  z-index: 1;
}

.home-page .feature-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.home-page .neu-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-page .feature-card:hover .neu-icon {
  transform: scale(1.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.home-page .blue-icon { color: var(--blue); }
.home-page .coral-icon { color: var(--coral); }

.home-page .feature-name {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.home-page .feature-tag {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  margin-bottom: 18px;
}

.home-page .feature-tag.blue { color: var(--blue); }
.home-page .feature-tag.coral { color: var(--coral); }

.home-page .feature-desc {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* 轮播按钮 */
.home-page .carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  z-index: 10;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-page .carousel-btn:hover {
  background: rgba(255, 255, 255, 0.68);
  color: var(--blue);
  box-shadow: 0 12px 32px rgba(10, 132, 255, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.home-page .carousel-btn:active {
  transform: translateY(-50%) scale(0.94);
}

.home-page .carousel-prev { left: 8px; }
.home-page .carousel-next { right: 8px; }

/* 轮播指示器 */
.home-page .carousel-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.home-page .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--shadow-dark);
  border: none;
  cursor: pointer;
  transition: all 0.4s ease;
}

.home-page .dot.active {
  width: 28px;
  border-radius: 4px;
  background: var(--blue);
}

/* ===========================
   世界掠影画廊
   =========================== */
.home-page .gallery-section {
  padding: 120px 32px;
}

.home-page .gallery-grid {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.home-page .neu-frame {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.65);
  padding: 14px;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              background 0.5s ease;
  margin: 0;
}

.home-page .gallery-item {
  display: flex;
  flex-direction: column;
}

.home-page .gallery-item:hover {
  transform: translateY(-6px);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.home-page .gallery-featured {
  grid-column: 1 / -1;
}

.home-page .gallery-img-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--bg-light);
}

.home-page .gallery-featured .gallery-img-wrap {
  aspect-ratio: 16 / 9;
}

.home-page .gallery-item:not(.gallery-featured) .gallery-img-wrap {
  aspect-ratio: 4 / 3;
}

.home-page .gallery-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-page .gallery-item:hover .gallery-img-wrap img {
  transform: scale(1.05);
}

.home-page .gallery-item figcaption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 6px 4px;
}

.home-page .caption-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.home-page .gallery-featured .caption-title {
  font-size: 24px;
}

.home-page .caption-sub {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* ===========================
   加入区
   =========================== */
.home-page .join-section {
  padding: 120px 32px;
}

.home-page .join-card {
  position: relative;
  max-width: 680px;
  margin: 0 auto;
  padding: 64px 48px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(26px) saturate(150%);
  -webkit-backdrop-filter: blur(26px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
  text-align: center;
  overflow: hidden;
}

.home-page .join-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='20' viewBox='0 0 28 20'%3E%3Cdefs%3E%3ClinearGradient id='m' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%238BB888'/%3E%3Cstop offset='1' stop-color='%235B8C5A'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0 0H28V11A7 7 0 0 1 14 11A7 7 0 0 1 0 11Z' fill='url(%23m)'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 28px 20px;
  background-position: top;
  opacity: 0.9;
  pointer-events: none;
}

.home-page .join-title {
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 12px 0 16px;
}

.home-page .join-desc {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.home-page .server-address {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px 16px 28px;
  border-radius: 980px;
  background: rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
}

.home-page .address-text {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: "SF Mono", "Menlo", monospace;
  letter-spacing: -0.01em;
}

.home-page .copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 980px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--blue);
  font-family: inherit;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-page .copy-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: var(--blue-deep);
  box-shadow: 0 8px 22px rgba(10, 132, 255, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.home-page .copy-btn.copied {
  color: #34C759;
}

.home-page .join-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 20px;
}

/* ===========================
   页脚
   =========================== */
.home-page .footer {
  padding: 48px 32px;
  border-top: 1px solid rgba(200, 200, 206, 0.4);
}

.home-page .footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.home-page .footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.home-page .footer-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* ===========================
   动画入场
   =========================== */
@keyframes fadeUpSpring {
  0% {
    opacity: 0;
    filter: blur(16px);
    transform: translateY(36px) scale(0.95);
  }
  60% {
    opacity: 0.95;
    filter: blur(2px);
    transform: translateY(-4px) scale(1.01);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

@keyframes rippleAnim {
  to { transform: scale(2.5); opacity: 0; }
}

/* 滚动揭示 */
.home-page .reveal {
  opacity: 0;
  filter: blur(14px);
  transform: translateY(54px) scale(0.96);
  transition:
    opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1),
    transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 1.1s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform, filter;
}

.home-page .reveal.in-view {
  opacity: 1;
  filter: blur(0) !important;
  transform: translateY(0) scale(1);
}

.home-page .reveal[style*="--i"] {
  transition-delay: calc(var(--i) * 0.06s);
}

.home-page .feature-card.reveal,
.home-page .gallery-item.reveal,
.home-page .join-card.reveal {
  transform: translateY(40px);
  filter: blur(8px);
}

.home-page .feature-card.reveal.in-view,
.home-page .gallery-item.reveal.in-view,
.home-page .join-card.reveal.in-view {
  transform: translateY(0);
}

.home-page .section-header.reveal {
  transform: translateY(40px) scale(0.98);
  filter: blur(10px);
}

.home-page .section-header.reveal.in-view {
  transform: translateY(0) scale(1);
}

/* ===========================
   响应式
   =========================== */
@media (max-width: 768px) {
  .home-page .gallery-grid {
    grid-template-columns: 1fr;
  }

  .home-page .gallery-featured {
    grid-column: span 1;
    grid-row: span 1;
  }

  .home-page .hero {
    min-height: auto;
    padding: 60px 24px 40px;
  }

  .home-page .counter-card {
    flex-direction: column;
    gap: 20px;
    padding: 32px 28px;
  }

  .home-page .counter-divider {
    width: 60%;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--shadow-dark), transparent);
  }

  .home-page .counter-item {
    padding: 8px 0;
  }

  .home-page .feature-card {
    flex: 0 0 280px;
    padding: 32px 24px;
  }

  .home-page .carousel-btn {
    display: none;
  }

  .home-page .join-card {
    padding: 48px 28px;
  }

  .home-page .section-header {
    margin-bottom: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page *::before,
  .home-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
