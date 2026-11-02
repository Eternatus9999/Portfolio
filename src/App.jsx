import { useCallback, useRef, useState } from 'react'
import Scene from './Scene'
import { me, sections } from './data'

const Img = ({ src, className }) => (
  <img src={src} alt="" className={className} onError={(e) => (e.currentTarget.style.display = 'none')} />
)

export default function App() {
  const api = useRef(null)
  const timer = useRef(null)
  const [started, setStarted] = useState(false)
  const [near, setNear] = useState(null)
  const [closed, setClosed] = useState(null)
  const [score, setScore] = useState({ n: 0, combo: 0 })
  const [toast, setToast] = useState('')
  const onNear = useCallback((id) => { setNear(id); if (!id) setClosed(null) }, [])
  const onShard = useCallback((n, combo) => setScore({ n, combo }), [])
  const onToast = useCallback((m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2800) }, [])
  const active = sections.find((s) => s.id === near && s.id !== closed)

  return (
    <div className="text-white">
      <Scene onNear={onNear} onShard={onShard} onToast={onToast} apiRef={api} />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-4 md:p-6">
        <div className="pointer-events-auto glass px-5 py-3">
          <p className="text-lg font-bold leading-tight grad-text">{me.name}</p>
          <p className="text-sm text-white/60">{me.tagline}</p>
        </div>
        <nav className="pointer-events-auto glass flex flex-wrap items-center gap-1 p-2" aria-label="Jump to a section">
          {sections.map((s) => (
            <button key={s.id} className="glass-btn text-sm" onClick={() => { setStarted(true); api.current?.warp(s.id) }}>{s.title}</button>
          ))}
          <span className="ml-1 rounded-full bg-white/10 px-3 py-1 text-sm" aria-live="polite">
            {score.n} / 40 shards{score.combo > 1 ? ` (x${score.combo})` : ''}
          </span>
        </nav>
      </header>

      <div role="status" className={`glass pointer-events-none fixed left-1/2 top-32 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-semibold transition-opacity ${toast ? 'opacity-100' : 'opacity-0'}`}>{toast}</div>

      <p className="pointer-events-none fixed bottom-4 left-4 z-10 hidden max-w-sm text-sm text-white/50 md:block">
        Move with WASD or arrows, Shift to boost. Space to jump (twice for a double jump), C to crouch, E to dash, M to mute. Jump the orange barriers, crouch under the cyan beams, dodge the red spikes. Drag to steer on touch.
      </p>

      <button className="glass fixed bottom-4 right-28 z-30 touch-none select-none px-5 py-3 font-semibold" onPointerDown={(e) => { e.preventDefault(); api.current?.jump() }}>Jump</button>
      <button className="glass fixed bottom-4 right-4 z-30 touch-none select-none px-5 py-3 font-semibold"
        onPointerDown={(e) => { e.preventDefault(); api.current?.crouch(true) }}
        onPointerUp={() => api.current?.crouch(false)} onPointerLeave={() => api.current?.crouch(false)} onPointerCancel={() => api.current?.crouch(false)}>Crouch</button>

      {active && (
        <aside key={active.id} className="glass panel-in fixed inset-x-3 bottom-24 z-20 max-h-[50vh] overflow-y-auto p-5 md:inset-x-auto md:bottom-auto md:right-6 md:top-28 md:max-h-[70vh] md:w-[420px]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold" style={{ color: active.colors[1] }}>{active.title}</h2>
            <button className="glass-btn text-sm" onClick={() => setClosed(active.id)} aria-label="Close panel">Close</button>
          </div>
          {active.image && <Img src={active.image} className="mb-3 h-40 w-full rounded-2xl object-cover" />}
          <p className="text-white/80">{active.body}</p>
          {active.chips && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {active.chips.map((c) => <li key={c} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm">{c}</li>)}
            </ul>
          )}
          {active.items && (
            <div className="mt-4 grid gap-3">
              {active.items.map((it) => (
                <a key={it.title} href={it.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                  <Img src={it.img} className="mb-2 h-28 w-full rounded-xl object-cover" />
                  <p className="font-semibold">{it.title}</p>
                  <p className="text-sm text-white/60">{it.text}</p>
                </a>
              ))}
            </div>
          )}
          {active.links && (
            <div className="mt-4 flex flex-wrap gap-2">
              {active.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="glass-btn border border-white/20 bg-linear-to-r from-cyan-400/30 to-violet-500/30">{l.label}</a>
              ))}
            </div>
          )}
        </aside>
      )}

      {!started && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="glass panel-in max-w-md p-8 text-center">
            <h1 className="text-4xl font-extrabold grad-text">Hi, I’m {me.short}.</h1>
            <p className="mt-3 text-white/70">This portfolio is a small world. Run, jump and crouch your robot past the obstacles, collect all 40 shards, and fly into each crystal to open a section.</p>
            <button className="glass-btn mt-6 border border-white/25 bg-linear-to-r from-cyan-400/30 via-violet-500/30 to-pink-500/30 px-6 py-3 text-lg font-semibold" onClick={() => setStarted(true)}>Start exploring</button>
          </div>
        </div>
      )}
    </div>
  )
}
