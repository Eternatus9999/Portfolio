import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sections } from './data'

const SHAPES = {
  icosa: () => new THREE.IcosahedronGeometry(2.4, 1),
  octa: () => new THREE.OctahedronGeometry(2.7),
  knot: () => new THREE.TorusKnotGeometry(1.7, 0.55, 128, 16),
  dodeca: () => new THREE.DodecahedronGeometry(2.4),
}
const R = 7, B = 36, TOTAL = 40
const cl = (v, a, b) => Math.max(a, Math.min(b, v))
const sm = (a, b, x) => { const k = cl((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k) }

export default function Scene({ onNear, onShard, onToast, apiRef }) {
  const mount = useRef(null)
  const cb = useRef({}); cb.current = { onNear, onShard, onToast }

  useEffect(() => {
    const el = mount.current
    let inv = 0, sq = 0, jy = 0, jv = 0, jn = 0, air = false, crouch = false, cr = 0, tc = false
    let got = 0, combo = 0, lastGot = 0, mute = false, actx = null, cur = 0, near = null, closedRaf
    const keys = {}; let drag = null
    const vel = new THREE.Vector3(), tmp = new THREE.Vector3(), want = new THREE.Vector3()

    const ren = new THREE.WebGLRenderer({ antialias: true })
    ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(ren.domElement)
    const sc = new THREE.Scene()
    sc.background = new THREE.Color('#07070d'); sc.fog = new THREE.FogExp2('#07070d', 0.016)
    // small colourful studio so the glass has something to reflect
    const env = new THREE.Scene(); env.background = new THREE.Color('#150f33')
    ;[['#22d3ee', [8, 6, 0]], ['#ff5caa', [-8, 5, 4]], ['#7c5cff', [0, 8, -8]], ['#ffffff', [0, -2, 8]]].forEach(([c, p]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 0.5), new THREE.MeshBasicMaterial({ color: c })); m.position.set(...p); m.lookAt(0, 0, 0); env.add(m)
    })
    sc.environment = new THREE.PMREMGenerator(ren).fromScene(env, 0.04).texture
    const cam = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 300); cam.position.set(0, 10, 16)
    sc.add(new THREE.AmbientLight('#8877ff', 0.4))
    const sp = new Float32Array(1800).map(() => (Math.random() - 0.5) * 220)
    const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: '#b8b0ff', size: 0.25, transparent: true, opacity: 0.8 }))
    sc.add(stars)

    // ---------- audio ----------
    const initAudio = () => { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)() } catch (e) {} }
    const beep = (f, d) => {
      if (!actx || mute) return
      const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f
      g.gain.setValueAtTime(0.12, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d)
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d)
    }

    // ---------- particles ----------
    const N = 500, pP = new Float32Array(N * 3).fill(-999), pC = new Float32Array(N * 3), pV = new Float32Array(N * 3), pB = new Float32Array(N * 3), pL = new Float32Array(N)
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pP, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pC, 3))
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    pts.frustumCulled = false; sc.add(pts)
    const emit = (x, y, z, vx, vy, vz, c, l) => { const i = cur++ % N, k = new THREE.Color(c); pP.set([x, y, z], i * 3); pV.set([vx, vy, vz], i * 3); pB.set([k.r, k.g, k.b], i * 3); pL[i] = l }
    const burst = (p, c, n) => { for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 6); emit(p.x, p.y, p.z, v.x, v.y, v.z, c, 0.8 + Math.random() * 0.5) } }
    const updParticles = (dt) => {
      for (let i = 0; i < N; i++) {
        const j = i * 3
        if (pL[i] > 0) {
          pL[i] -= dt; pP[j] += pV[j] * dt; pP[j + 1] += pV[j + 1] * dt; pP[j + 2] += pV[j + 2] * dt
          pV[j] *= 0.97; pV[j + 1] *= 0.97; pV[j + 2] *= 0.97
          const f = Math.max(pL[i], 0); pC[j] = pB[j] * f; pC[j + 1] = pB[j + 1] * f; pC[j + 2] = pB[j + 2] * f
        } else pC[j] = pC[j + 1] = pC[j + 2] = 0
      }
      pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = true
    }

    // ---------- hero: robot built from primitives ----------
    const buildHero = () => {
      const g = new THREE.Group(); g.rotation.order = 'YXZ'
      const white = new THREE.MeshPhysicalMaterial({ color: '#f2f0ff', roughness: 0.25, clearcoat: 1, iridescence: 0.6 })
      const dark = new THREE.MeshStandardMaterial({ color: '#0b0b1e', roughness: 0.1, metalness: 0.8, emissive: '#22d3ee', emissiveIntensity: 0.35 })
      const glow = (c) => new THREE.MeshBasicMaterial({ color: c })
      const add = (geo, mat, x, y, z, par = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); par.add(m); return m }
      add(new THREE.CapsuleGeometry(0.5, 0.6, 4, 14), white, 0, -0.1, 0)
      add(new THREE.SphereGeometry(0.62, 24, 18), white, 0, 0.85, 0)
      add(new THREE.SphereGeometry(0.5, 24, 16), dark, 0, 0.9, 0.28).scale.set(1, 0.7, 0.7)
      const ant = new THREE.Group(); ant.position.set(0, 1.4, 0); g.add(ant)
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.4), white, 0, 0.2, 0, ant); add(new THREE.SphereGeometry(0.12), glow('#ff5caa'), 0, 0.45, 0, ant)
      const chest = add(new THREE.SphereGeometry(0.14, 16, 12), glow('#22d3ee'), 0, 0.1, 0.5)
      add(new THREE.BoxGeometry(0.6, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: '#7c5cff', emissive: '#7c5cff', emissiveIntensity: 0.5 }), 0, 0.05, -0.6)
      const limb = (x, y, r, l) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); add(new THREE.CapsuleGeometry(r, l, 4, 10), white, 0, -(l / 2 + r), 0, p); return p }
      const A1 = limb(0.68, 0.4, 0.14, 0.45), A2 = limb(-0.68, 0.4, 0.14, 0.45), L1 = limb(0.25, -0.6, 0.17, 0.35), L2 = limb(-0.25, -0.6, 0.17, 0.35)
      let hd = 0, wv = 0
      const anim = (t, dt) => {
        const spd = Math.hypot(vel.x, vel.z), mv = Math.min(spd / 8, 1), sw = Math.sin(t * 13) * mv
        L1.rotation.x = sw; L2.rotation.x = -sw; A2.rotation.x = sw; A1.rotation.x = -sw * (1 - wv)
        wv += ((spd < 0.4 ? 1 : 0) - wv) * Math.min(1, dt * 5)
        A1.rotation.z = 0.15 + wv * (2.3 + Math.sin(t * 9) * 0.35); A2.rotation.z = -0.15
        if (spd > 0.6) { const a = Math.atan2(vel.x, vel.z), d = Math.atan2(Math.sin(a - hd), Math.cos(a - hd)); hd += d * Math.min(1, dt * 10) }
        g.rotation.y = hd; g.rotation.x = Math.min(spd / 22, 0.45)
        sq += (0 - sq) * Math.min(1, dt * 6); g.scale.set(1 - sq * 0.2, 1 - sq * 0.15, 1 + sq * 0.45)
        g.position.y = Math.sin(t * 2) * 0.08 * (1 - mv) + Math.abs(Math.sin(t * 13)) * 0.14 * mv
        ant.rotation.z = Math.sin(t * 5) * 0.12 - vel.x * 0.02; ant.rotation.x = vel.z * 0.02
        g.visible = inv <= 0 || Math.floor(t * 16) % 2 === 0
      }
      return { g, chest, anim, A1, A2, L1, L2 }
    }
    const hero = buildHero(), core = hero.chest
    const pl = new THREE.Group(); pl.add(hero.g, new THREE.PointLight('#22d3ee', 30, 14)); pl.position.set(0, 0, 3); sc.add(pl)

    // ---------- portals ----------
    const glass = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.05, transmission: 0.95, thickness: 1.5, ior: 1.4, iridescence: 1, clearcoat: 1, envMapIntensity: 1.4 })
    const P = sections.map((s) => {
      const g = new THREE.Group(); g.position.set(s.pos[0], 0, s.pos[1])
      const m = new THREE.Mesh(SHAPES[s.shape](), glass(s.colors[0])), i = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshBasicMaterial({ color: s.colors[1] }))
      const r = new THREE.Mesh(new THREE.RingGeometry(R - 0.25, R, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: s.colors[1], transparent: true, opacity: 0.45, side: 2 })); r.position.y = -2.9
      g.add(m, i, r, new THREE.PointLight(s.colors[1], 60, 22)); sc.add(g)
      const l = document.createElement('div'); l.className = 'label3d glass'; l.style.borderRadius = '999px'; l.textContent = s.title; el.appendChild(l)
      return { s, g, m, i, r, l }
    })

    // ---------- terrain ----------
    const gh = (x, z) => {
      let f = sm(4, 11, Math.hypot(x, z - 3))
      for (const q of P) f = Math.min(f, sm(R + 1, R + 7, Math.hypot(q.g.position.x - x, q.g.position.z - z)))
      return f * (Math.sin(x * 0.17) * Math.cos(z * 0.14) * 0.9 + Math.sin((x + z) * 0.08) * 0.8 + Math.cos(x * 0.05 - z * 0.07) * 0.6)
    }
    const TG = new THREE.PlaneGeometry((B + 8) * 2, (B + 8) * 2, 90, 90).rotateX(-Math.PI / 2), tp = TG.attributes.position, tcol = new Float32Array(tp.count * 3)
    for (let i = 0; i < tp.count; i++) { const h = gh(tp.getX(i), tp.getZ(i)); tp.setY(i, h - 1.25); const k = cl((h + 1) / 3.2, 0, 1); tcol[i * 3] = 0.04 + k * 0.38; tcol[i * 3 + 1] = 0.035 + k * 0.06; tcol[i * 3 + 2] = 0.1 + k * 0.42 }
    TG.setAttribute('color', new THREE.BufferAttribute(tcol, 3)); TG.computeVertexNormals()
    sc.add(new THREE.Mesh(TG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })),
      new THREE.Mesh(TG, new THREE.MeshBasicMaterial({ color: '#5b4fe0', wireframe: true, transparent: true, opacity: 0.22 })))

    // ---------- shards ----------
    const sh = [], pal = ['#22d3ee', '#7c5cff', '#ff5caa', '#34d399', '#f59e0b']
    const mkShard = (x, z) => { const k = pal[sh.length % 5], m = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: k, emissive: k, emissiveIntensity: 1.2 })); m.position.set(x, -1, z); m.userData.ph = Math.random() * 6; sc.add(m); sh.push(m) }
    for (let k = 0; k < TOTAL; k++) { const a = Math.random() * 6.28, d = 6 + Math.random() * 30; mkShard(Math.cos(a) * d, Math.sin(a) * d) }

    // ---------- obstacles ----------
    const pickSpot = (min, max, clear) => { let x, z; do { const a = Math.random() * 6.28, d = min + Math.random() * (max - min); x = Math.cos(a) * d; z = Math.sin(a) * d } while (!P.every((q) => Math.hypot(q.g.position.x - x, q.g.position.z - z) > R + clear) || Math.hypot(x, z - 3) < 9.5); return [x, z] }
    const OB = [] // patrolling spikes
    for (let n = 0; n < 10; n++) {
      const [x, z] = pickSpot(9, 31, 9)
      const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: '#ff3355', emissive: '#ff2244', emissiveIntensity: 1.1, roughness: 0.3 })
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), mat), m2 = new THREE.Mesh(new THREE.OctahedronGeometry(1.3), mat); m2.rotation.set(0.78, 0.78, 0); m.add(m2); g.add(m)
      const rg = new THREE.Mesh(new THREE.RingGeometry(1.7, 2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff3355', transparent: true, opacity: 0.5, side: 2 })); rg.position.y = -1.4; g.add(rg)
      const a2 = Math.random() * 6.28; g.userData = { x, z, dx: Math.cos(a2), dz: Math.sin(a2), amp: 3 + Math.random() * 3, sp: 0.6 + Math.random() * 0.8, ph: Math.random() * 6, m }
      sc.add(g); OB.push(g)
    }
    const TO = [] // low barriers (jump) and overhead beams (crouch)
    for (let n = 0; n < 12; n++) {
      const [x, z] = pickSpot(8, 32, 6), bar = n < 7, a = Math.random() * Math.PI, g = new THREE.Group(), hw = bar ? 2.2 : 2.4
      g.position.set(x, gh(x, z) - 1.25, z); g.rotation.y = a
      if (bar) { const m = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.5, 0.8), new THREE.MeshStandardMaterial({ color: '#ff9f1c', emissive: '#ff9f1c', emissiveIntensity: 0.8 })); m.position.y = 0.75; g.add(m) }
      else {
        const mt = new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 0.9 })
        ;[-2.4, 2.4].forEach((px) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.7), mt); p.position.set(px, 1.35, 0); g.add(p) })
        const b = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.7), mt); b.position.y = 2.5; g.add(b)
      }
      g.userData = { a, hw, hd: 0.4, bar }; sc.add(g); TO.push(g)
    }

    // ---------- game actions ----------
    const toast = (m) => cb.current.onToast(m)
    const report = () => cb.current.onShard(got, combo)
    const jump = () => { if (jn < 2) { jv = jn ? 12 : 14.5; jn++; burst(pl.position, '#9aa0ff', 12); beep(jn > 1 ? 700 : 520, 0.12); sq = 0.6 } }
    const dash = () => { const L = vel.length() || 1; vel.x += vel.x / L * 28; vel.z += vel.z / L * 28; burst(pl.position, '#ffffff', 24); beep(180, 0.2); sq = 1; inv = Math.max(inv, 0.35) }
    const hurt = (dx, dz, msg, color) => {
      inv = 1.6; sq = 1; const L = Math.hypot(dx, dz) || 1; vel.set(dx / L * 15, 0, dz / L * 15)
      burst(pl.position, color, 28); beep(110, 0.35)
      const lose = Math.min(got, 2); got -= lose; combo = 0
      for (let i = 0; i < lose; i++) mkShard(pl.position.x + (Math.random() - 0.5) * 8, pl.position.z + (Math.random() - 0.5) * 8)
      report(); toast(msg + (lose ? ` Dropped ${lose}.` : ''))
    }
    apiRef.current = {
      warp: (id) => { const p = P.find((q) => q.s.id === id); if (!p) return; pl.position.set(p.g.position.x, 0, p.g.position.z + 9); vel.set(0, 0, 0); jy = jv = 0 },
      jump, crouch: (on) => { tc = on },
    }

    // ---------- input ----------
    const kd = (e) => {
      initAudio(); keys[e.code] = true
      if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) jump() }
      if (e.code === 'KeyE' && !e.repeat) dash()
      if (e.code === 'KeyM') mute = !mute
    }
    const ku = (e) => { keys[e.code] = false }
    const pd = (e) => { initAudio(); drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 } }
    const pm = (e) => { if (drag) { drag.dx = cl((e.clientX - drag.x) / 70, -1, 1); drag.dy = cl((e.clientY - drag.y) / 70, -1, 1) } }
    const pu = () => { drag = null }
    addEventListener('keydown', kd); addEventListener('keyup', ku)
    ren.domElement.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu)

    // ---------- loop ----------
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const vis = new Set(); let last = performance.now(), raf
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.05); last = now; const t = now / 1000
      crouch = !!(keys.KeyC || keys.ControlLeft || tc)
      const ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + (drag ? drag.dx : 0)
      const iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + (drag ? drag.dy : 0)
      const bo = (keys.ShiftLeft || keys.ShiftRight ? 1.8 : 1) * (crouch ? 0.55 : 1)
      vel.x += cl(ix, -1, 1) * 38 * bo * dt; vel.z += cl(iz, -1, 1) * 38 * bo * dt
      vel.multiplyScalar(Math.pow(0.03, dt)); pl.position.addScaledVector(vel, dt)
      const d = Math.hypot(pl.position.x, pl.position.z); if (d > B) { pl.position.x *= B / d; pl.position.z *= B / d }

      // jump physics
      jv -= 38 * dt; jy += jv * dt
      if (jy <= 0) { if (air) { burst(pl.position, '#9aa0ff', 10); beep(200, 0.08); sq = 0.5; air = false } jy = 0; jv = 0; jn = 0 } else air = true
      pl.position.y = gh(pl.position.x, pl.position.z) + jy
      hero.anim(t, dt)
      cr += ((crouch && jy <= 0 ? 1 : 0) - cr) * Math.min(1, dt * 12)
      hero.g.scale.y *= 1 - cr * 0.45; hero.g.position.y -= cr * 0.55
      if (jy > 0.05) { hero.L1.rotation.x = -0.7; hero.L2.rotation.x = 0.3; hero.A1.rotation.z = 2.4; hero.A2.rotation.z = -2.4; hero.g.scale.y *= 1 + Math.min(Math.abs(jv) / 60, 0.25) }
      inv = Math.max(0, inv - dt)

      core.scale.setScalar(1 + Math.sin(t * 5) * 0.12)
      cam.fov += ((bo > 1 && vel.length() > 3 ? 76 : 60) - cam.fov) * Math.min(1, dt * 5); cam.updateProjectionMatrix()
      if (vel.length() > 2) emit(pl.position.x, pl.position.y, pl.position.z, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, bo > 1 ? '#ff5caa' : '#22d3ee', 0.7)
      want.set(pl.position.x, 10 + pl.position.y * 0.7, pl.position.z + 14)
      cam.position.lerp(want, 1 - Math.pow(0.002, dt)); cam.lookAt(pl.position.x, pl.position.y * 0.8, pl.position.z - 2)

      // portals
      let n = null; const w = el.clientWidth, h = el.clientHeight
      P.forEach((q, k) => {
        if (!reduce) { q.m.rotation.y += dt * 0.4; q.m.rotation.x += dt * 0.15 }
        q.i.rotation.y -= dt; q.g.position.y = Math.sin(t + k) * 0.3 + 1.6
        const dist = Math.hypot(q.g.position.x - pl.position.x, q.g.position.z - pl.position.z)
        q.r.material.opacity = dist < R ? 0.9 : 0.4
        q.m.scale.setScalar(q.m.scale.x + ((dist < R ? 1.3 : 1) - q.m.scale.x) * Math.min(1, dt * 6)); if (dist < R) q.m.rotation.y += dt * 2
        if (dist < R) n = q.s.id
        tmp.set(q.g.position.x, 5.8, q.g.position.z).project(cam)
        q.l.style.display = tmp.z > 1 ? 'none' : 'block'
        q.l.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`
      })
      if (n !== near) {
        near = n; cb.current.onNear(n)
        if (n && !vis.has(n)) { vis.add(n); beep(660, 0.25); burst(pl.position, '#22d3ee', 30); toast(`Discovered ${sections.find((s) => s.id === n).title} (${vis.size}/${sections.length})` + (vis.size === sections.length ? '. Explorer badge unlocked!' : '')) }
      }

      // spikes
      OB.forEach((g) => {
        const u = g.userData, s = Math.sin(t * u.sp + u.ph) * u.amp, px = u.x + u.dx * s, pz = u.z + u.dz * s
        g.position.set(px, gh(px, pz) + 0.2, pz); u.m.rotation.y += dt * 2; u.m.rotation.x += dt * 1.2; u.m.position.y = Math.sin(t * 3 + u.ph) * 0.3
        const dx = pl.position.x - g.position.x, dz = pl.position.z - g.position.z
        if (Math.hypot(dx, dz) < 2.1 && Math.abs(pl.position.y - g.position.y) < 2 && inv <= 0) hurt(dx, dz, 'Ouch! Dodge the red spikes.', '#ff3355')
      })
      // barriers and beams
      TO.forEach((o) => {
        const u = o.userData, dx = pl.position.x - o.position.x, dz = pl.position.z - o.position.z, c = Math.cos(u.a), s = Math.sin(u.a), lx = dx * c - dz * s, lz = dx * s + dz * c
        if (inv > 0 || Math.abs(lz) > u.hd + 0.5 || Math.abs(lx) > u.hw + 0.5) return
        const hit = u.bar ? jy < 1.6 : Math.abs(lx) > u.hw - 0.4 ? jy < 3 : (jy + (cr > 0.5 ? 1.7 : 3.05) > 2.3 && jy < 2.7)
        if (hit) hurt(dx, dz, u.bar ? 'Ouch! Jump over the orange barriers (Space).' : 'Ouch! Crouch under the cyan beams (C or Crouch).', '#ff9f1c')
      })

      // shards
      for (let k = sh.length - 1; k >= 0; k--) {
        const s = sh[k]; s.rotation.y += dt * 2
        s.position.y = gh(s.position.x, s.position.z) - 0.25 + Math.sin(t * 2 + s.userData.ph) * 0.25
        const dd = s.position.distanceTo(pl.position)
        if (dd < 6) s.position.lerp(pl.position, Math.min(1, dt * (6 - dd) * 0.9))
        if (dd < 1.8) {
          const ns = performance.now(); combo = ns - lastGot < 2000 ? combo + 1 : 1; lastGot = ns
          burst(s.position, s.material.color, 18); beep(330 * Math.pow(2, [0, 2, 4, 7, 9][combo % 5] / 12 + Math.floor(combo / 5)), 0.15)
          sc.remove(s); sh.splice(k, 1); got++; report()
          if (got === 10) toast('10 shards. The orb is warming up!')
          if (got === 25) toast('25 shards. Past halfway!')
          if (got === TOTAL) { toast('All 40 shards found. Legend!'); for (let q = 0; q < 6; q++) setTimeout(() => burst(pl.position, pal[q % 5], 70), q * 150) }
        }
      }
      stars.rotation.y = t * 0.01; updParticles(dt); ren.render(sc, cam)
    }
    raf = requestAnimationFrame(loop)
    const onResize = () => { ren.setSize(el.clientWidth, el.clientHeight); cam.aspect = el.clientWidth / el.clientHeight; cam.updateProjectionMatrix() }
    addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', onResize)
      removeEventListener('pointermove', pm); removeEventListener('pointerup', pu)
      P.forEach((q) => q.l.remove()); ren.dispose(); ren.domElement.remove()
    }
  }, [apiRef])

  return <div ref={mount} className="fixed inset-0 touch-none" aria-label="Interactive 3D portfolio world" />
}
