import { useCallback, useEffect, useRef, useState } from 'react'

// ═══════════════ CONSTANTS ═══════════════════════
const BH = 44
const BSTEP = BH + 5
const MIN_W = 22
const PERF = 10
const INIT_W = 252
const INIT_SPD = 2.7
const SPD_INC = 0.068
const MAX_SPD = 12
const DROP_A = 1.7
const GV = 0.52
const GR = 0.80
const CAM_TOP = 0.40
const ABOVE = 118
const PAUSE_MS = 220
const S_BASE = 10
const S_PERF = 55
const S_GOOD = 22

// ═══════════════ TYPES ═══════════════════════════
type Phase = 'start' | 'playing' | 'gameover'

interface Block { x: number; w: number }
interface DropB { x: number; y: number; w: number; vy: number }
interface Piece  { x: number; y: number; w: number; vx: number; vy: number; rot: number; vrot: number; alpha: number }
interface Spark  { x: number; y: number; vx: number; vy: number; r: number; alpha: number; c: string }
interface Flash  { txt: string; x: number; y: number; alpha: number; c: string; vy: number; sz: number }

interface G {
  sub: 'moving' | 'dropping' | 'paused'
  blocks: Block[]
  mv: { x: number; w: number; dir: number; spd: number }
  drop: DropB | null
  pieces: Piece[]
  sparks: Spark[]
  flashes: Flash[]
  scroll: number
  scrollT: number
  score: number
  combo: number
  placed: number
  pauseT: number
}

// ═══════════════ MATH ════════════════════════════
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const rand = (a: number, b: number) => a + Math.random() * (b - a)

const bY = (level: number, ch: number, scroll: number) =>
  ch * GR - level * BSTEP - BH + scroll

const tScroll = (topLvl: number, ch: number) =>
  Math.max(0, ch * (CAM_TOP - GR) + topLvl * BSTEP + BH)

// ═══════════════ DRAWING: BACKGROUND ══════════════
function drawBg(ctx: CanvasRenderingContext2D, cw: number, ch: number, t: number) {
  const sg = ctx.createLinearGradient(0, 0, 0, ch)
  sg.addColorStop(0, '#f8d466')
  sg.addColorStop(0.42, '#f5ecd7')
  sg.addColorStop(1, '#efe3c4')
  ctx.fillStyle = sg
  ctx.fillRect(0, 0, cw, ch)

  const gY = ch * GR

  // Far hill
  ctx.fillStyle = 'rgba(212,232,160,0.42)'
  ctx.beginPath()
  ctx.moveTo(0, ch)
  ctx.bezierCurveTo(cw * 0.15, gY - 80, cw * 0.45, gY - 118, cw * 0.7, gY - 54)
  ctx.bezierCurveTo(cw * 0.88, gY - 18, cw, gY - 40, cw, ch)
  ctx.closePath()
  ctx.fill()

  // Mid hill
  ctx.fillStyle = 'rgba(168,200,112,0.38)'
  ctx.beginPath()
  ctx.moveTo(0, ch)
  ctx.bezierCurveTo(cw * 0.22, gY - 30, cw * 0.58, gY - 64, cw * 0.88, gY - 27)
  ctx.bezierCurveTo(cw * 0.96, gY - 9, cw, gY - 20, cw, ch)
  ctx.closePath()
  ctx.fill()

  const sway = Math.sin(t * 0.0006) * 2.5
  drawBamboo(ctx, cw * 0.05, gY, sway)
  drawBamboo(ctx, cw * 0.12, gY, sway * 0.7)
  drawBamboo(ctx, cw * 0.91, gY, -sway)
  drawBamboo(ctx, cw * 0.84, gY, -sway * 0.7)

  // Ground
  const gg = ctx.createLinearGradient(0, gY - 2, 0, ch)
  gg.addColorStop(0, '#b06230')
  gg.addColorStop(0.12, '#8e4e22')
  gg.addColorStop(1, '#6b3818')
  ctx.fillStyle = gg
  ctx.fillRect(0, gY, cw, ch - gY)

  ctx.strokeStyle = 'rgba(42,36,24,0.22)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 9])
  ctx.beginPath()
  ctx.moveTo(0, gY)
  ctx.lineTo(cw, gY)
  ctx.stroke()
  ctx.setLineDash([])

  // Rice stalks along ground
  const cnt = Math.floor(cw / 15)
  ctx.lineWidth = 0.85
  for (let i = 0; i < cnt; i++) {
    const x = (i / cnt) * cw + 5
    const sw = Math.sin(t * 0.0009 + i * 1.15) * 2.6
    ctx.strokeStyle = 'rgba(185,155,55,0.42)'
    ctx.beginPath()
    ctx.moveTo(x, gY)
    ctx.quadraticCurveTo(x + sw, gY - 11, x + sw * 1.5, gY - 19)
    ctx.stroke()
    ctx.fillStyle = 'rgba(195,165,55,0.48)'
    ctx.beginPath()
    ctx.ellipse(x + sw * 1.5, gY - 21, 1.7, 3.5, 0.15, 0, Math.PI * 2)
    ctx.fill()
  }

  // Kite in the sky (decorative)
  const kx = cw * 0.72 + Math.sin(t * 0.0004) * 12
  const ky = ch * 0.18 + Math.cos(t * 0.0005) * 8
  ctx.save()
  ctx.strokeStyle = 'rgba(232,116,50,0.55)'
  ctx.fillStyle = 'rgba(232,116,50,0.45)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(kx, ky - 12)
  ctx.lineTo(kx + 9, ky)
  ctx.lineTo(kx, ky + 14)
  ctx.lineTo(kx - 9, ky)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(138,125,101,0.4)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(kx, ky + 14)
  ctx.quadraticCurveTo(kx + 20, ky + 40, cw * 0.85, ch * 0.45)
  ctx.stroke()
  ctx.restore()

  // Egrets (3 small V shapes)
  ctx.strokeStyle = 'rgba(42,36,24,0.28)'
  ctx.lineWidth = 1.0
  const egrets = [[0.2, 0.12], [0.28, 0.09], [0.35, 0.13]]
  egrets.forEach(([ex, ey], i) => {
    const bx = cw * ex + Math.sin(t * 0.0005 + i) * 8
    const by = ch * ey + Math.cos(t * 0.0004 + i) * 4
    ctx.beginPath()
    ctx.moveTo(bx - 6, by)
    ctx.quadraticCurveTo(bx, by - 5, bx + 6, by)
    ctx.stroke()
  })
}

function drawBamboo(ctx: CanvasRenderingContext2D, x: number, gY: number, sway: number) {
  for (let i = 0; i < 3; i++) {
    const bx = x + i * 6 - 6
    const bh = 55 + i * 14
    const a = 0.38 + i * 0.07
    ctx.strokeStyle = `rgba(107,142,61,${a})`
    ctx.lineWidth = 2.0 - i * 0.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(bx, gY)
    ctx.quadraticCurveTo(bx + sway, gY - bh * 0.55, bx + sway * 1.4, gY - bh)
    ctx.stroke()
    for (let j = 1; j <= 2; j++) {
      const ny = gY - bh * (j / 3)
      const nx = bx + sway * (j / 3)
      ctx.strokeStyle = `rgba(76,102,48,${a * 0.65})`
      ctx.lineWidth = 0.65
      ctx.beginPath()
      ctx.moveTo(nx - 2.5, ny)
      ctx.lineTo(nx + 2.5, ny)
      ctx.stroke()
    }
  }
}

// ═══════════════ DRAWING: BLOCK ══════════════════
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, alpha = 1, glow = 0) {
  if (w < 2 || alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha

  const h = BH
  const r = clamp(Math.min(7, w * 0.14), 2, 7)

  if (glow > 0) {
    ctx.shadowColor = 'rgba(240,184,64,0.55)'
    ctx.shadowBlur = 14 * glow
  }

  const bg = ctx.createLinearGradient(x, y, x, y + h)
  bg.addColorStop(0, '#f5c030')
  bg.addColorStop(0.42, '#e8a820')
  bg.addColorStop(0.85, '#c88010')
  bg.addColorStop(1, '#b07008')
  ctx.fillStyle = bg
  rr(ctx, x, y, w, h, r)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  // Straw texture lines
  ctx.strokeStyle = 'rgba(100,58,8,0.18)'
  ctx.lineWidth = 0.7
  for (let i = 1; i <= 4; i++) {
    const ly = y + (h / 5) * i
    const jit = Math.sin(x * 0.11 + i * 29) * 1.1
    ctx.beginPath()
    ctx.moveTo(x + 3, ly + jit)
    ctx.lineTo(x + w - 3, ly - jit)
    ctx.stroke()
  }

  // Rope bands
  const ropes = w >= 50 ? [0.33, 0.67] : w >= 32 ? [0.5] : []
  ropes.forEach(f => {
    const rx = x + w * f
    ctx.fillStyle = '#3a5020'
    ctx.fillRect(rx - 2.5, y + 3, 5, h - 6)
    ctx.fillStyle = 'rgba(107,142,61,0.5)'
    ctx.fillRect(rx - 1.5, y + 3, 1.8, h - 6)
  })

  // Top shine
  ctx.strokeStyle = 'rgba(255,228,90,0.40)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x + r + 1, y + 2)
  ctx.lineTo(x + w - r - 1, y + 2)
  ctx.stroke()

  // Border
  ctx.strokeStyle = 'rgba(42,36,24,0.32)'
  ctx.lineWidth = 1.15
  rr(ctx, x, y, w, h, r)
  ctx.stroke()

  ctx.restore()
}

// ═══════════════ GAME STATE ═══════════════════════
const SPARK_COLS = ['#f5c030', '#e8a010', '#c8d68a', '#f0b840', '#e87432', '#ffe08a']

function makeG(cw: number, ch: number): G {
  const baseW = Math.min(INIT_W + 52, cw * 0.82)
  return {
    sub: 'moving',
    blocks: [{ x: (cw - baseW) / 2, w: baseW }],
    mv: { x: (cw - INIT_W) / 2, w: INIT_W, dir: 1, spd: INIT_SPD },
    drop: null, pieces: [], sparks: [], flashes: [],
    scroll: 0, scrollT: 0,
    score: 0, combo: 0, placed: 0, pauseT: 0
  }
}

function addFlash(g: G, txt: string, x: number, y: number, c: string, sz: number) {
  g.flashes.push({ txt, x, y, alpha: 1, c, vy: -1.9, sz })
}

// Returns true if game over
function update(g: G, dt: number, cw: number, ch: number): boolean {
  const topLvl = g.blocks.length - 1

  // Camera smooth follow
  g.scrollT = tScroll(topLvl, ch)
  g.scroll = lerp(g.scroll, g.scrollT, 0.065)

  // Particles always update
  for (let i = g.pieces.length - 1; i >= 0; i--) {
    const p = g.pieces[i]
    p.vy += GV; p.x += p.vx; p.y += p.vy
    p.rot += p.vrot; p.alpha -= 0.013
    if (p.alpha <= 0) g.pieces.splice(i, 1)
  }
  for (let i = g.sparks.length - 1; i >= 0; i--) {
    const s = g.sparks[i]
    s.vy += 0.3; s.x += s.vx; s.y += s.vy; s.alpha -= 0.024
    if (s.alpha <= 0) g.sparks.splice(i, 1)
  }
  for (let i = g.flashes.length - 1; i >= 0; i--) {
    const f = g.flashes[i]
    f.y += f.vy; f.alpha -= 0.020
    if (f.alpha <= 0) g.flashes.splice(i, 1)
  }

  if (g.sub === 'moving') {
    g.mv.x += g.mv.dir * g.mv.spd
    if (g.mv.x <= 0) { g.mv.x = 0; g.mv.dir = 1 }
    if (g.mv.x + g.mv.w >= cw) { g.mv.x = cw - g.mv.w; g.mv.dir = -1 }
  }

  if (g.sub === 'dropping' && g.drop) {
    g.drop.vy += DROP_A
    g.drop.y += g.drop.vy

    const landY = bY(g.blocks.length, ch, g.scroll)

    if (g.drop.y >= landY) {
      const top = g.blocks[topLvl]
      const aL = g.drop.x, aR = g.drop.x + g.drop.w
      const bL = top.x, bR = top.x + top.w
      const oL = Math.max(aL, bL), oR = Math.min(aR, bR)
      const overlap = oR - oL

      if (overlap <= 0) {
        g.pieces.push({
          x: g.drop.x, y: landY, w: g.drop.w,
          vx: rand(-2, 2), vy: -1,
          rot: 0, vrot: rand(-0.07, 0.07), alpha: 1
        })
        g.drop = null
        return true
      }

      const cutL = oL - aL
      const cutR = aR - oR
      const totalCut = cutL + cutR
      const isPerfect = totalCut <= PERF

      const newW = isPerfect ? g.drop.w : overlap
      const newX = isPerfect ? g.drop.x : oL
      g.blocks.push({ x: newX, w: newW })

      if (isPerfect) {
        g.combo++
        g.score += S_PERF + S_BASE * Math.min(g.combo, 6)
        addFlash(g, 'Chuẩn! ✓', newX + newW / 2, landY - 12, '#e87432', 24)
      } else if (totalCut < 36) {
        g.combo++
        g.score += S_GOOD + S_BASE
        addFlash(g, 'Tốt!', newX + newW / 2, landY - 12, '#6b8e3d', 20)
      } else {
        g.combo = 0
        g.score += S_BASE
      }

      if (g.combo >= 3) {
        addFlash(g, `×${g.combo} 🔥`, cw - 60, 65, '#e87432', 19)
      }

      if (!isPerfect) {
        if (cutL >= 3) {
          g.pieces.push({
            x: aL, y: landY, w: cutL,
            vx: rand(-3, -1.2), vy: rand(-2, 0.5),
            rot: 0, vrot: rand(-0.08, -0.02), alpha: 1
          })
        }
        if (cutR >= 3) {
          g.pieces.push({
            x: oR, y: landY, w: cutR,
            vx: rand(1.2, 3), vy: rand(-2, 0.5),
            rot: 0, vrot: rand(0.02, 0.08), alpha: 1
          })
        }
      }

      for (let i = 0; i < 16; i++) {
        g.sparks.push({
          x: rand(oL + 4, oR - 4), y: landY,
          vx: rand(-3.5, 3.5), vy: rand(-5, -1.2),
          r: rand(2, 5), alpha: 1,
          c: SPARK_COLS[Math.floor(rand(0, SPARK_COLS.length))]
        })
      }

      if (newW <= MIN_W) {
        g.drop = null
        return true
      }

      g.placed++
      g.drop = null
      g.sub = 'paused'
      g.pauseT = PAUSE_MS
    }
  }

  if (g.sub === 'paused') {
    g.pauseT -= dt
    if (g.pauseT <= 0) {
      const top = g.blocks[g.blocks.length - 1]
      const spd = Math.min(INIT_SPD + g.placed * SPD_INC, MAX_SPD)
      const startLeft = g.placed % 2 === 0
      g.mv = {
        x: startLeft ? 0 : cw - top.w,
        w: top.w, dir: startLeft ? 1 : -1, spd
      }
      g.sub = 'moving'
    }
  }

  return false
}

function draw(ctx: CanvasRenderingContext2D, g: G, cw: number, ch: number, t: number) {
  ctx.clearRect(0, 0, cw, ch)
  drawBg(ctx, cw, ch, t)

  // Placed blocks
  for (let i = 0; i < g.blocks.length; i++) {
    const b = g.blocks[i]
    const y = bY(i, ch, g.scroll)
    if (y < ch + BH && y > -BH) {
      drawBlock(ctx, b.x, y, b.w)
    }
  }

  // Moving block
  if (g.sub === 'moving') {
    const topY = bY(g.blocks.length - 1, ch, g.scroll)
    const mvY = topY - ABOVE
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.003)
    drawBlock(ctx, g.mv.x, mvY, g.mv.w, 1, pulse)

    // Guide line (faint dashed)
    ctx.save()
    ctx.setLineDash([3, 6])
    ctx.strokeStyle = 'rgba(42,36,24,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(g.mv.x + g.mv.w / 2, mvY + BH)
    ctx.lineTo(g.mv.x + g.mv.w / 2, topY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // Dropping block
  if (g.sub === 'dropping' && g.drop) {
    drawBlock(ctx, g.drop.x, g.drop.y, g.drop.w, 0.95)
  }

  // Falling pieces
  for (const p of g.pieces) {
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.translate(p.x + p.w / 2, p.y + BH / 2)
    ctx.rotate(p.rot)
    ctx.translate(-p.w / 2, -BH / 2)
    drawBlock(ctx, 0, 0, p.w, 1)
    ctx.restore()
  }

  // Sparks
  for (const s of g.sparks) {
    ctx.save()
    ctx.globalAlpha = s.alpha
    ctx.fillStyle = s.c
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Flash messages
  ctx.textAlign = 'center'
  for (const f of g.flashes) {
    ctx.save()
    ctx.globalAlpha = f.alpha
    ctx.font = `800 ${f.sz}px "Be Vietnam Pro", sans-serif`
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 3.5
    ctx.strokeText(f.txt, f.x, f.y)
    ctx.fillStyle = f.c
    ctx.fillText(f.txt, f.x, f.y)
    ctx.restore()
  }

  // HUD
  ctx.textAlign = 'left'
  ctx.font = '700 20px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = '#2a2418'
  ctx.fillText(`Điểm: ${g.score}`, 16, 36)
  ctx.font = '600 13px "Be Vietnam Pro", sans-serif'
  ctx.fillStyle = '#8a7d65'
  ctx.fillText(`Tầng ${Math.max(0, g.blocks.length - 1)}`, 16, 54)

  if (g.combo >= 2) {
    ctx.textAlign = 'right'
    ctx.font = '700 17px "Be Vietnam Pro", sans-serif'
    ctx.fillStyle = '#e87432'
    ctx.fillText(`Combo ×${g.combo}`, cw - 16, 36)
  }
  ctx.textAlign = 'left'
}

// ═══════════════ COMPONENT ═══════════════════════
export function StrawStackGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gRef = useRef<G | null>(null)
  const rafRef = useRef<number>(0)
  const lastTRef = useRef<number>(0)
  const bestRef = useRef<number>(0)

  const [phase, setPhase] = useState<Phase>('start')
  const [dispScore, setDispScore] = useState(0)
  const [dispBest, setDispBest] = useState(0)
  const [dispFloors, setDispFloors] = useState(0)

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    gRef.current = makeG(cw, ch)
    setDispScore(0)
    setDispFloors(0)
    setPhase('playing')
  }, [])

  const handleAction = useCallback(() => {
    const g = gRef.current
    if (!g || g.sub !== 'moving') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ch = canvas.clientHeight
    const topY = bY(g.blocks.length - 1, ch, g.scroll)
    const mvY = topY - ABOVE
    g.drop = { x: g.mv.x, y: mvY, w: g.mv.w, vy: 1.5 }
    g.sub = 'dropping'
  }, [])

  // Background idle loop (always draws background on start/gameover)
  const idleRafRef = useRef<number>(0)
  useEffect(() => {
    if (phase !== 'start' && phase !== 'gameover') {
      cancelAnimationFrame(idleRafRef.current)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = (t: number) => {
      const dpr = window.devicePixelRatio || 1
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      drawBg(ctx, cw, ch, t)

      // Draw a demo tower of blocks
      const demoBlocks = 4
      const demoW = Math.min(220, cw * 0.58)
      for (let i = 0; i < demoBlocks; i++) {
        const demoX = (cw - demoW + i * 8) / 2
        const demoY = bY(i, ch, 0)
        if (demoY < ch && demoY > -BH) {
          drawBlock(ctx, demoX, demoY, demoW - i * 16, 0.75)
        }
      }

      idleRafRef.current = requestAnimationFrame(loop)
    }

    idleRafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(idleRafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [phase])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    let prevScore = -1
    let prevFloors = -1

    const loop = (t: number) => {
      const dt = Math.min(t - lastTRef.current, 50)
      lastTRef.current = t

      const g = gRef.current!
      const dpr = window.devicePixelRatio || 1
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const gameOver = update(g, dt, cw, ch)
      draw(ctx, g, cw, ch, t)

      // Throttled React state update
      if (g.score !== prevScore) {
        prevScore = g.score
        setDispScore(g.score)
      }
      const floors = Math.max(0, g.blocks.length - 1)
      if (floors !== prevFloors) {
        prevFloors = floors
        setDispFloors(floors)
      }

      if (gameOver) {
        if (g.score > bestRef.current) bestRef.current = g.score
        setDispBest(bestRef.current)
        setDispScore(g.score)
        setDispFloors(Math.max(0, g.blocks.length - 1))
        setPhase('gameover')
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [phase])

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={phase === 'playing' ? handleAction : undefined}
        onTouchStart={phase === 'playing' ? (e) => { e.preventDefault(); handleAction() } : undefined}
      />

      {/* START SCREEN */}
      {phase === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-6"
          style={{ background: 'rgba(239,227,196,0.72)', backdropFilter: 'blur(2px)' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 56, display: 'block', textAlign: 'center' }}>🌾</span>
          </div>
          <div style={{
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: 'clamp(26px, 7vw, 38px)',
            fontWeight: 800,
            color: '#2a2418',
            textAlign: 'center',
            marginBottom: 6,
            textShadow: '0 2px 0 rgba(255,255,255,0.6)',
            lineHeight: 1.15
          }}>
            Chồng Rơm Lên Mây
          </div>
          <div style={{
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: 15,
            color: '#4a4232',
            textAlign: 'center',
            marginBottom: 28
          }}>
            Xếp chồng các bó rơm thật cao!
          </div>
          {dispBest > 0 && (
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 13,
              color: '#8a7d65',
              marginBottom: 20,
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px dashed rgba(138,125,101,0.4)',
              borderRadius: 999,
              padding: '6px 20px'
            }}>
              🏆 Kỷ lục: {dispBest} điểm
            </div>
          )}
          <button
            onClick={startGame}
            style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(180deg, #f08a48 0%, #e87432 100%)',
              border: '3px solid #b85a22',
              borderRadius: 999,
              padding: '15px 44px',
              cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(232,116,50,0.45)',
              marginBottom: 18
            }}
          >
            🎮 Bắt Đầu Chơi
          </button>
          <div style={{
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: 13,
            color: '#8a7d65'
          }}>
            Chạm hoặc click để thả bó rơm ↓
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ background: 'rgba(239,227,196,0.88)', backdropFilter: 'blur(3px)' }}>
          <div style={{
            fontFamily: '"Be Vietnam Pro", sans-serif',
            fontSize: 'clamp(22px, 6vw, 34px)',
            fontWeight: 800,
            color: '#2a2418',
            textAlign: 'center',
            marginBottom: 28,
            textShadow: '0 2px 0 rgba(255,255,255,0.5)'
          }}>
            Tháp Đổ Rồi! 🌾
          </div>

          {/* Score card */}
          <div style={{
            background: 'rgba(253,246,234,0.95)',
            border: '1.5px solid rgba(138,125,101,0.28)',
            borderRadius: 22,
            padding: '24px 48px',
            textAlign: 'center',
            boxShadow: '0 14px 40px rgba(42,36,24,0.12)',
            marginBottom: 18,
            minWidth: 200
          }}>
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#8a7d65',
              marginBottom: 8
            }}>
              Điểm của bạn
            </div>
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 56,
              fontWeight: 800,
              color: '#2a2418',
              lineHeight: 1.0,
              marginBottom: 8
            }}>
              {dispScore}
            </div>
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 13,
              color: '#6b8e3d',
              fontWeight: 600
            }}>
              Đạt tầng {dispFloors} 🌾
            </div>
          </div>

          {dispScore > 0 && dispScore >= bestRef.current && (
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 15,
              fontWeight: 800,
              color: '#f0b840',
              marginBottom: 12,
              textShadow: '0 1px 0 rgba(0,0,0,0.15)'
            }}>
              🏆 Kỷ Lục Mới!
            </div>
          )}

          {dispBest > 0 && dispScore < dispBest && (
            <div style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 13,
              color: '#8a7d65',
              marginBottom: 16,
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px dashed rgba(138,125,101,0.4)',
              borderRadius: 999,
              padding: '5px 18px'
            }}>
              Kỷ lục: {dispBest} điểm
            </div>
          )}

          <button
            onClick={startGame}
            style={{
              fontFamily: '"Be Vietnam Pro", sans-serif',
              fontSize: 17,
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(180deg, #f08a48 0%, #e87432 100%)',
              border: '3px solid #b85a22',
              borderRadius: 999,
              padding: '14px 40px',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(232,116,50,0.42)',
              marginTop: 8
            }}
          >
            🔄 Chơi Lại
          </button>
        </div>
      )}
    </div>
  )
}
