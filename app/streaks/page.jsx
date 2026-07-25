'use client'
import { useState, useEffect } from 'react'
import { Feather, Flame, Trophy, Star, Zap, Crown, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const BADGES = [
    { days: 7, name: 'Midnight Initiate', icon: Feather, color: '#00E5FF', desc: '7 days of pure creation' },
    { days: 15, name: 'Rising Stroke', icon: Star, color: '#B57BFF', desc: '15 days unbroken' },
    { days: 30, name: 'Wildfire Artist', icon: Flame, color: '#FF6B35', desc: '30 days of fire' },
    { days: 60, name: 'Diamond Hand', icon: Zap, color: '#FFD580', desc: '60 days — you are unstoppable' },
    { days: 90, name: 'Sacred Master', icon: Crown, color: '#C084FC', desc: '90 days of mastery' },
    { days: 180, name: 'Legendary', icon: Trophy, color: '#FF4444', desc: '180 days — a legend walks among us' },
    { days: 365, name: 'AETHRIX IMMORTAL', icon: Award, color: '#FFD700', desc: '365 days — you are eternal' },
]

function BadgeCard({ badge, earned, streak }) {
    const Icon = badge.icon
    const progress = Math.min((streak / badge.days) * 100, 100)

    return (
        <div className="tenet-card relative overflow-hidden"
            style={{ opacity: earned ? 1 : 0.5 }}>

            {earned && (
                <div className="absolute top-3 right-3">
                    <span className="text-xs tracking-widest uppercase px-2 py-1 rounded-sm"
                        style={{ color: badge.color, background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}>
                        EARNED
                    </span>
                </div>
            )}

            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}>
                <Icon size={20} style={{ color: badge.color }} strokeWidth={1.5} />
            </div>

            <h3 className="font-display text-xl font-light mb-1" style={{ color: earned ? badge.color : 'var(--ghost)' }}>
                {badge.name}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(234,230,242,0.3)' }}>{badge.desc}</p>

            <div className="w-full h-1 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: badge.color }} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(234,230,242,0.25)' }}>
                {Math.min(streak, badge.days)} / {badge.days} days
            </p>
        </div>
    )
}

function ShareBadge({ badge, artistName }) {
    const Icon = badge.icon

    const handleShare = (platform) => {
        const text = `I just earned the "${badge.name}" badge on AETHRIX! ${badge.days} days of unbroken creation. 🎨✨ #AETHRIX #ArtStreak #${badge.name.replace(/ /g, '')}`
        const url = 'https://aethrix-tii8.vercel.app'

        const links = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            instagram: `https://www.instagram.com/`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
            tiktok: `https://www.tiktok.com/`,
        }
        window.open(links[platform], '_blank')
    }

    return (
        <div className="rounded-sm p-6 mb-8" style={{ background: `${badge.color}08`, border: `1px solid ${badge.color}25` }}>
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}>
                    <Icon size={24} style={{ color: badge.color }} strokeWidth={1.5} />
                </div>
                <div>
                    <p className="font-display text-2xl font-light" style={{ color: badge.color }}>{badge.name}</p>
                    <p className="text-sm" style={{ color: 'rgba(234,230,242,0.4)' }}>{artistName} · {badge.days} day streak</p>
                </div>
            </div>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(234,230,242,0.3)' }}>Share this achievement</p>
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'twitter', label: 'Twitter', color: '#1DA1F2' },
                    { id: 'instagram', label: 'Instagram', color: '#E1306C' },
                    { id: 'linkedin', label: 'LinkedIn', color: '#0077B5' },
                    { id: 'tiktok', label: 'TikTok', color: '#00F2EA' },
                ].map(p => (
                    <button key={p.id} onClick={() => handleShare(p.id)}
                        className="btn-velvet text-xs"
                        style={{ borderColor: `${p.color}40`, color: p.color }}>
                        Share on {p.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function StreaksPage() {
    const [streaks, setStreaks] = useState([])
    const [myStreak, setMyStreak] = useState(null)
    const [artist, setArtist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [topBadge, setTopBadge] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Get leaderboard
        const { data: leaderData } = await supabase
            .from('streaks')
            .select('*')
            .order('current_streak', { ascending: false })
            .limit(10)

        if (leaderData) setStreaks(leaderData)

        if (user) {
            // Get artist info
            const { data: artistData } = await supabase
                .from('applications')
                .select('*')
                .eq('email', user.email)
                .single()
            if (artistData) setArtist(artistData)

            // Get my streak
            const { data: myStreakData } = await supabase
                .from('streaks')
                .select('*')
                .eq('artist_username', artistData?.username)
                .single()

            if (myStreakData) {
                setMyStreak(myStreakData)
                // Find top earned badge
                const earned = BADGES.filter(b => myStreakData.current_streak >= b.days)
                if (earned.length > 0) setTopBadge(earned[earned.length - 1])
            }
        }

        setLoading(false)
    }

    const myStreakCount = myStreak?.current_streak || 0

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>Loading...</p>
        </div>
    )

    return (
        <div className="page-enter pt-24 pb-28 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="section-label">Sacred Streaks</span>
                    <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--ghost)' }}>
                        The Art of
                        <br /><em className="italic" style={{ color: 'var(--ember)' }}>Consistency</em>
                    </h1>
                    <p className="font-display text-lg font-light italic" style={{ color: 'rgba(234,230,242,0.4)' }}>
                        Upload daily. Earn badges. Share your journey.
                    </p>
                </div>

                {/* My Streak */}
                {artist && (
                    <div className="rounded-sm p-8 mb-12 text-center relative overflow-hidden"
                        style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}>
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.08), transparent)', filter: 'blur(40px)' }} />
                        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(234,230,242,0.3)' }}>Your Current Streak</p>
                        <p className="font-display font-light mb-2" style={{ fontSize: '6rem', color: 'var(--ember)', lineHeight: 1 }}>
                            {myStreakCount}
                        </p>
                        <p className="font-display text-2xl font-light" style={{ color: 'rgba(234,230,242,0.5)' }}>days</p>
                        {myStreak?.longest_streak > 0 && (
                            <p className="text-sm mt-4" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                Longest streak: {myStreak.longest_streak} days · Total uploads: {myStreak.total_uploads}
                            </p>
                        )}
                    </div>
                )}

                {/* Share top badge */}
                {topBadge && artist && (
                    <ShareBadge badge={topBadge} artistName={artist.name} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Badges */}
                    <div>
                        <h2 className="section-title mb-8">Achievement Badges</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {BADGES.map(badge => (
                                <BadgeCard key={badge.days} badge={badge}
                                    earned={myStreakCount >= badge.days}
                                    streak={myStreakCount} />
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                        <h2 className="section-title mb-8">Leaderboard</h2>
                        {streaks.length === 0 ? (
                            <div className="text-center py-16">
                                <Flame size={32} className="mx-auto mb-4 opacity-20" strokeWidth={0.8} />
                                <p className="font-display text-xl font-light" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                    No streaks yet. Be the first!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {streaks.map((s, i) => {
                                    const topBadgeForUser = [...BADGES].reverse().find(b => s.current_streak >= b.days)
                                    const Icon = topBadgeForUser?.icon || Feather
                                    return (
                                        <div key={s.id} className="tenet-card flex items-center gap-4">
                                            <div className="font-display text-3xl font-light w-10 text-center"
                                                style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(234,230,242,0.3)' }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-display text-lg font-light" style={{ color: 'var(--ghost)' }}>
                                                    @{s.artist_username}
                                                </p>
                                                <p className="text-xs" style={{ color: 'rgba(234,230,242,0.3)' }}>
                                                    {s.current_streak} day streak · {s.total_uploads} uploads
                                                </p>
                                            </div>
                                            {topBadgeForUser && (
                                                <div className="flex items-center gap-1">
                                                    <Icon size={14} style={{ color: topBadgeForUser.color }} />
                                                    <span className="text-xs" style={{ color: topBadgeForUser.color }}>{topBadgeForUser.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}