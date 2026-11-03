import { me, sections } from './data'

const Img = ({ src, className }) => (
  <img src={src} alt="" className={className} onError={(e) => (e.currentTarget.style.display = 'none')} />
)

export default function Plain({ onPlay }) {
  return (
    <div className="fixed inset-0 scroll-smooth overflow-y-auto bg-[#07070d] text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(60% 50% at 15% 10%, rgba(124,92,255,.35), transparent 60%), radial-gradient(50% 45% at 85% 20%, rgba(34,211,238,.25), transparent 60%), radial-gradient(55% 50% at 50% 100%, rgba(255,92,170,.25), transparent 60%)' }} />

      <header className="sticky top-0 z-10 p-3">
        <nav className="glass mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2" aria-label="Sections">
          <span className="hidden font-bold grad-text sm:block">{me.short}</span>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="glass-btn">{s.title}</a>)}
            <button className="glass-btn border border-white/20 bg-linear-to-r from-cyan-400/30 to-violet-500/30" onClick={onPlay}>Play the game</button>
          </div>
        </nav>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-16">
        <section className="py-14 text-center md:py-24">
          <h1 className="text-4xl font-extrabold md:text-6xl grad-text">{me.name}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{me.tagline}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={me.github} target="_blank" rel="noreferrer" className="glass-btn border border-white/20 bg-white/10">GitHub</a>
            <a href={me.linkedin} target="_blank" rel="noreferrer" className="glass-btn border border-white/20 bg-white/10">LinkedIn</a>
          </div>
        </section>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="glass mb-6 scroll-mt-24 p-6 md:p-8">
            <h2 className="text-3xl font-bold" style={{ color: s.colors[1] }}>{s.title}</h2>
            <div className={s.image ? 'mt-4 gap-6 md:flex' : 'mt-4'}>
              {s.image && <Img src={s.image} className="mb-4 h-56 w-full rounded-2xl object-cover md:mb-0 md:w-64 md:shrink-0" />}
              <div className="flex-1">
                <p className="text-lg text-white/80">{s.body}</p>
                {s.chips && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {s.chips.map((c) => <li key={c} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm">{c}</li>)}
                  </ul>
                )}
                {s.links && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="glass-btn border border-white/20 bg-linear-to-r from-cyan-400/30 to-violet-500/30">{l.label}</a>)}
                  </div>
                )}
              </div>
            </div>
            {s.items && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((it) => (
                  <a key={it.title} href={it.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <Img src={it.img} className="mb-3 h-36 w-full rounded-xl object-cover" />
                    <p className="font-semibold">{it.title}</p>
                    <p className="text-sm text-white/60">{it.text}</p>
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}

        <footer className="pt-6 text-center text-sm text-white/50">© {new Date().getFullYear()} {me.name}</footer>
      </main>
    </div>
  )
}
