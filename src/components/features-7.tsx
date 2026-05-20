import { Activity, Cpu, DraftingCompass, Lock, Mail, Sparkles, Zap } from 'lucide-react'

export default function FeaturesSection() {
    return (
        <section className="overflow-hidden pb-6 md:pb-10 pt-8 md:pt-12">
            <div className="mx-auto max-w-6xl px-6 space-y-12">

                {/* Top row: Built for Scaling (left) + Performance Analytics (right) */}
                <div className="grid items-start gap-8 lg:grid-cols-2">

                    {/* Built for Scaling teams */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-3xl font-semibold lg:text-4xl">Built for Scaling teams</h2>
                        <p className="mt-4 text-muted-foreground">Everything your pharmacy team needs to grow — from real-time order tracking and secure payments to collaboration tools that scale with your business.</p>
                        <ul className="mt-6 divide-y border-y *:flex *:items-center *:gap-3 *:py-3 text-sm">
                            <li><Mail className="size-4 shrink-0" /> Email and web support</li>
                            <li><Zap className="size-4 shrink-0" /> Fast response time</li>
                            <li><Activity className="size-4 shrink-0" /> Monitoring and analytics</li>
                            <li><DraftingCompass className="size-4 shrink-0" /> Architectural review</li>
                            <li>
                                <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Payment Processing
                            </li>
                        </ul>
                    </div>

                    {/* Performance Analytics dashboard */}
                    <div className="mask-b-from-75% mask-l-from-75% mask-b-to-95% mask-l-to-95% relative -mx-4 pr-3 pt-3 md:-mx-0">
                        <div className="perspective-midrange">
                            <div className="rotate-x-6 -skew-2">
                                <div className="aspect-88/36 relative bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Performance Analytics</h3>
                                        </div>
                                        <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                                            <span className="px-3 py-1 rounded-md text-xs font-medium text-zinc-500 cursor-pointer">1W</span>
                                            <span className="px-3 py-1 bg-white dark:bg-zinc-800 shadow-sm rounded-md text-xs font-semibold text-purple-600 dark:text-purple-400">1M</span>
                                            <span className="px-3 py-1 rounded-md text-xs font-medium text-zinc-500 cursor-pointer">1Y</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex p-6 gap-6">
                                        <div className="flex flex-col gap-4 w-1/3">
                                            {[
                                                { label: 'Total Revenue', value: '$84,203', trend: '+12.5%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                                                { label: 'New Patients', value: '3,291', trend: '+5.2%', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20' },
                                            ].map(stat => (
                                                <div key={stat.label} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 flex-1 flex flex-col justify-center">
                                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{stat.label}</p>
                                                    <div className="flex items-baseline gap-2.5">
                                                        <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stat.value}</span>
                                                        <span className={`text-[10px] font-bold ${stat.color} ${stat.bg} px-1.5 py-0.5 rounded border`}>{stat.trend}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/20 p-5 flex flex-col relative overflow-hidden group">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenue Growth</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full bg-purple-500" />
                                                    <span className="text-[10px] text-zinc-400">Current Period</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 w-full relative">
                                                <svg viewBox="0 0 400 100" className="absolute inset-0 w-full h-full text-zinc-200 dark:text-zinc-800" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" strokeOpacity="0.5" strokeDasharray="4 4" strokeWidth="1" />
                                                    <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" strokeOpacity="0.5" strokeDasharray="4 4" strokeWidth="1" />
                                                    <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" strokeOpacity="0.5" strokeDasharray="4 4" strokeWidth="1" />
                                                    <path d="M0,80 C40,60 80,90 120,50 C160,10 200,60 240,40 C280,20 320,50 360,20 C380,5 390,10 400,0 L400,100 L0,100 Z" fill="url(#chartGradient)" />
                                                    <path d="M0,80 C40,60 80,90 120,50 C160,10 200,60 240,40 C280,20 320,50 360,20 C380,5 390,10 400,0" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                                                    <circle cx="240" cy="40" r="4" fill="white" stroke="#a855f7" strokeWidth="2.5" className="dark:fill-zinc-900" />
                                                </svg>
                                                <div className="absolute left-[60%] top-[25%] -translate-x-1/2 -translate-y-full bg-zinc-800 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                    $12,450
                                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-zinc-800" />
                                                </div>
                                                <div className="absolute left-[60%] top-[25%] bottom-0 w-px bg-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom row: 4 feature cards */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"><Zap className="size-4" /></div>
                            <h3 className="text-sm font-semibold">Lightning Fast</h3>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">Instant data retrieval and snappy interactions across all devices.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Cpu className="size-4" /></div>
                            <h3 className="text-sm font-semibold">Powerful Engine</h3>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">Process millions of prescriptions and inventory records with zero downtime.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Lock className="size-4" /></div>
                            <h3 className="text-sm font-semibold">Bank-Grade Security</h3>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">End-to-end encryption and row-level security for all patient data.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"><Sparkles className="size-4" /></div>
                            <h3 className="text-sm font-semibold">AI Assistant</h3>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">Smart insights to predict stock shortages and flag prescription errors.</p>
                    </div>
                </div>

            </div>
        </section>
    )
}
