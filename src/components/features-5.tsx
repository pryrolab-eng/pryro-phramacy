import { Activity, DraftingCompass, Mail, Zap } from 'lucide-react'
import Image from 'next/image'

export default function FeaturesSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
                    <div className="lg:col-span-2">
                        <div className="md:pr-6 lg:pr-0">
                            <h2 className="text-4xl font-semibold lg:text-5xl">Built for Scaling teams</h2>
                            <p className="mt-6">Orrupti aut temporibus assumenda atque ab, accusamus sit, molestiae veniam laboriosam pariatur.</p>
                        </div>
                        <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
                            <li>
                                <Mail className="size-5" />
                                Email and web support
                            </li>
                            <li>
                                <Zap className="size-5" />
                                Fast response time
                            </li>
                            <li>
                                <Activity className="size-5" />
                                Menitoring and analytics
                            </li>
                            <li>
                                <DraftingCompass className="size-5" />
                                Architectural review
                            </li>
                        </ul>
                    </div>
                    <div className="border-border/50 relative rounded-3xl border p-3 lg:col-span-3">
                        <div className="bg-linear-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-900 aspect-76/59 rounded-[15px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400">Payment Processing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
