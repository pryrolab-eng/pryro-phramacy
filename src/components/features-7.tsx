import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'

export default function FeaturesSection() {
    return (
        <section className="overflow-hidden py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl font-semibold lg:text-5xl">Built for Scaling teams</h2>
                    <p className="mt-6 text-lg">Empower your team with workflows that adapt to your needs, whether you prefer git synchronization or a AI Agents interface.</p>
                </div>
                <div className="mask-b-from-75% mask-l-from-75% mask-b-to-95% mask-l-to-95% relative -mx-4 pr-3 pt-3 md:-mx-12">
                    <div className="perspective-midrange">
                        <div className="rotate-x-6 -skew-2">
                            <div className="aspect-88/36 relative bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-purple-500 rounded-xl mx-auto mb-6 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Analytics Dashboard</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            <h3 className="text-sm font-medium">Faaast</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">It supports an entire helping developers and innovate.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-4" />
                            <h3 className="text-sm font-medium">Powerful</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">It supports an entire helping developers and businesses.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4" />
                            <h3 className="text-sm font-medium">Security</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">It supports an helping developers businesses innovate.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4" />

                            <h3 className="text-sm font-medium">AI Powered</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">It supports an helping developers businesses innovate.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
