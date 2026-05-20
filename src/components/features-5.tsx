import { Activity, DraftingCompass, Mail, Plus, Zap } from 'lucide-react'
import PolarPricing from '@/components/polar-pricing'

const integrations = [
    { name: 'KPay', description: 'Accept mobile money and card payments directly at the counter.', icon: '💳' },
    { name: 'RSSB Insurance', description: 'Automatically calculate how much insurance covers for each medicine.', icon: '🏥' },
    { name: 'Supabase', description: 'Your data is saved instantly and stays safe — always up to date.', icon: '⚡' },
]

export default function FeaturesSection() {
    return (
        <section className="pt-6 md:pt-10 pb-8 md:pb-12">
            <div className="mx-auto max-w-6xl px-6 space-y-24">

                {/* Top: Integrations */}
                <div className="mx-auto max-w-3xl flex flex-col gap-8 text-center">
                    <div>
                        <h2 className="text-3xl font-semibold lg:text-4xl">Integrates with your pharmacy stack</h2>
                        <p className="mt-3 text-muted-foreground text-sm">Connect with payment gateways, insurance providers, and real-time infrastructure to run your pharmacy smoothly.</p>
                    </div>
                    <div className="rounded-2xl border bg-background px-6 pb-8 pt-4 shadow-sm text-left">
                        {integrations.map((item, i) => (
                            <div key={item.name} className={`grid grid-cols-[auto_1fr] items-center gap-4 py-4 ${i < integrations.length - 1 ? 'border-b border-dashed' : ''}`}>
                                <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border text-2xl">{item.icon}</div>
                                <div>
                                    <h3 className="text-base font-medium">{item.name}</h3>
                                    <p className="text-muted-foreground text-sm line-clamp-1">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Polar Pricing */}
                <div id="pricing" className="w-full pt-4 scroll-mt-24">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-serif tracking-tight lg:text-5xl text-gray-900 dark:text-white">Choose Pricing Plan</h2>
                        <p className="mt-4 text-gray-500 text-sm max-w-lg mx-auto">Choose the perfect plan for your pharmacy needs — from getting started to scaling your branches.</p>
                    </div>
                    <PolarPricing />
                </div>

            </div>
        </section>
    )
}
