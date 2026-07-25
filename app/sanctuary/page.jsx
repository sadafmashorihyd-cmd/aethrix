import { Feather, Shield, Heart, Eye, Lock, Zap } from 'lucide-react'

const LAWS = [
  { icon: Eye,    title: 'No Metrics. No Counts.',      body: 'You will never see a like count, follower number, or engagement rate on AETHRIX. Art is not data.', color: 'var(--cyan)' },
  { icon: Shield, title: 'Every Artist is Verified.',   body: 'Our curators personally review every application. No bots. No brands. No exceptions.', color: 'var(--violet)' },
  { icon: Heart,  title: 'Appreciation, Not Addiction.',body: 'AETHRIX is designed to be savored, not scrolled. No infinite feeds. No push notifications designed to trap.', color: 'var(--ember)' },
  { icon: Lock,   title: 'Your Art is Yours.',          body: 'We will never sell your data, license your art, or train AI models on your work without explicit permission.', color: 'var(--cyan)' },
  { icon: Zap,    title: 'No Pay-to-Play.',             body: 'There is no boosting. No sponsored posts. No algorithm you can buy your way to the top of.', color: 'var(--violet)' },
  { icon: Feather,'title': 'Pure Expression Only.',     body: 'Hate, harassment, and toxicity result in immediate and permanent passport revocation. No exceptions.', color: 'var(--ember)' },
]

export default function SanctuaryPage() {
  return (
    <div className="page-enter pt-24 pb-28 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-20">
          <span className="section-label">The Sacred Space</span>
          <h1 className="font-display font-light mb-5" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
            Why We Built<br />
            <em className="italic" style={{ color: 'var(--cyan)' }}>The Sanctuary</em>
          </h1>
          <p className="font-display text-xl font-light italic max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(234,230,242,0.4)' }}>
            The internet broke something sacred between art and its audience.
            We built AETHRIX to repair it.
          </p>
        </div>

        {/* Manifesto Block */}
        <div className="rounded-sm p-8 md:p-12 mb-16 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', opacity: 0.3 }} />
          <div className="space-y-6 text-center">
            {[
              'Before the algorithm, art found its audience through patience and reverence.',
              'A painting hung on a gallery wall for months before the right eyes discovered it.',
              'A poem was passed hand to hand until it reached the person who needed it.',
              'We have forgotten this. AETHRIX exists to remember.',
            ].map((line, i) => (
              <p key={i} className="font-display text-xl md:text-2xl font-light leading-relaxed"
                style={{ color: i === 3 ? 'var(--cyan)' : 'rgba(234,230,242,0.55)', fontStyle: i === 3 ? 'italic' : 'normal' }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Sacred Laws */}
        <div className="mb-16">
          <h2 className="section-title text-center mb-10">The Six Sacred Laws</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LAWS.map((law, i) => {
              const Icon = law.icon
              return (
                <div key={i} className="tenet-card">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center mb-4"
                    style={{ background: `${law.color}12`, border: `1px solid ${law.color}22` }}>
                    <Icon size={15} style={{ color: law.color }} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl font-light mb-2" style={{ color: 'var(--ghost)' }}>{law.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(234,230,242,0.38)' }}>{law.body}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="font-display text-2xl font-light italic mb-6" style={{ color: 'rgba(234,230,242,0.4)' }}>
            This is the space you always deserved.
          </p>
          <a href="/apply" className="btn-ember inline-flex mx-auto">
            <span>Claim Your Artist Passport</span>
            <Feather size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
