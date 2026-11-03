import { useCallback, useRef, useState } from 'react'
import Scene from './Scene'
import Plain from './Plain'
import { me, sections } from './data'

const Img = ({ src, className }) => (
  <img src={src} alt="" className={className} onError={(e) => (e.currentTarget.style.display = 'none')} />
)

const SB = { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }

export default function App() {
  const api = useRef(null)
  const timer = useRef(null)
  const [mode, setMode] = useState(null) // null = asking, 'game' = 3D world, 'plain' = scrollable page
  const [near, setNear] = useState(null)
  const [closed, setClosed] = useState(null)
  const [score, setScore] = useState({ n: 0, combo: 0 })
  const [toast, setToast] = useState('')
  const [easy, setEasy] = useState(false)
  const onNear = useCallback((id) => { setNear(id); if (!id) setClosed(null) }, [])
  const onShard = useCallback((n, combo) => setScore({ n, combo }), [])
  const onToast = useCallback((m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2800) }, [])
  const toggleEasy = () => { const v = !easy; setEasy(v); api.current?.setEasy(v) }
  const play = () => { setEasy(false); setScore({ n: 0, combo: 0 }); setNear(null); setClosed(null); setToast(''); setMode('game') }
  const active = sections.find((s) => s.id === near && s.id !== closed)

  return (
    <div className="text-white">
      {mode === 'plain' && <Plain onPlay={play} />}

      {mode === 'game' && (
        <>
          <Scene onNear={onNear} onShard={onShard} onToast={onToast} apiRef={api} />

          <header className="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 px-3 pb-3 safe-top md:gap-3 md:px-6 md:pb-6">
            <div className="pointer-events-auto glass px-3 py-2 md:px-5 md:py-3">
              <p className="text-sm font-bold leading-tight grad-text md:text-lg">{me.name}</p>
              <p className="hidden text-sm text-white/60 sm:block">{me.tagline}</p>
            </div>
            <nav className="pointer-events-auto glass flex flex-wrap items-center gap-1 p-1.5 md:p-2" aria-label="Jump to a section">
              {sections.map((s) => (
                <button key={s.id} className="glass-btn text-sm" onClick={() => api.current?.warp(s.id)}>{s.title}</button>
              ))}
              <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs md:px-3 md:py-1 md:text-sm" aria-live="polite">
                {score.n} / 40 shards{score.combo > 1 ? ` (x${score.combo})` : ''}
              </span>
              <button className="glass-btn border border-white/20 text-sm" aria-pressed={easy} onClick={toggleEasy}>Easy mode: {easy ? 'on' : 'off'}</button>
              <button className="glass-btn border border-white/20 text-sm" onClick={() => setMode('plain')}>Skip the game</button>
            </nav>
          </header>

          <div role="status" className={`glass pointer-events-none fixed left-1/2 top-32 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-semibold transition-opacity ${toast ? 'opacity-100' : 'opacity-0'}`}>{toast}</div>

          <p className="pointer-events-none fixed bottom-4 left-4 z-10 hidden max-w-sm text-sm text-white/50 md:block">
            Move with WASD or arrows, Shift to boost. Space to jump (twice for a double jump), C to crouch, E to dash, M to mute. Jump the orange barriers, crouch under the cyan beams, dodge the red spikes. Drag to steer on touch.
          </p>

          <button className="glass fixed right-[200px] z-30 touch-none select-none px-5 py-3 font-semibold" style={SB} onPointerDown={(e) => { e.preventDefault(); api.current?.dash() }}>Dash</button>
          <button className="glass fixed right-28 z-30 touch-none select-none px-5 py-3 font-semibold" style={SB} onPointerDown={(e) => { e.preventDefault(); api.current?.jump() }}>Jump</button>
          <button className="glass fixed right-4 z-30 touch-none select-none px-5 py-3 font-semibold" style={SB}
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
        </>
      )}

      {mode === null && (
        <div className="fixed inset-0 z-40 grid place-items-center p-4" style={{ background: 'radial-gradient(60% 50% at 20% 15%, rgba(124,92,255,.4), transparent 60%), radial-gradient(50% 45% at 85% 25%, rgba(34,211,238,.3), transparent 60%), radial-gradient(55% 50% at 50% 100%, rgba(255,92,170,.3), transparent 60%), #07070d' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="ask-title" className="glass panel-in max-w-md p-8 text-center">
            <h1 id="ask-title" className="text-3xl font-extrabold grad-text md:text-4xl">Would you like to have a little fun?</h1>
            <p className="mt-3 text-white/70">Explore my portfolio as a small 3D game, or skip straight to a normal page where you can scroll through everything.</p>
            <div className="mt-6 flex flex-col gap-3">
              <button autoFocus className="glass-btn border border-white/25 bg-linear-to-r from-cyan-400/30 via-violet-500/30 to-pink-500/30 px-6 py-3 text-lg font-semibold" onClick={play}>Yes, let’s play</button>
              <button className="glass-btn border border-white/20 bg-white/5 px-6 py-3" onClick={() => setMode('plain')}>No, just show me the portfolio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
