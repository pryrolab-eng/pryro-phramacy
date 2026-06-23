import { Activity, DraftingCompass, Mail, Plus, Zap } from 'lucide-react'
import PolarPricing from '@/components/polar-pricing'
import {
    landingContainer,
    landingContainerNarrow,
    landingH2,
    landingLead,
    landingSectionTight,
} from '@/lib/landing-layout'

const integrations = [
    { name: 'Polar', description: 'Accept card payments for subscriptions.', icon: '💳' },
    { name: 'RSSB Insurance', description: 'Automatically calculate how much insurance covers for each medicine.', icon: '🏥' },
    { name: 'Supabase', description: 'Your data is saved instantly and stays safe — always up to date.', icon: '⚡' },
]

export default function FeaturesSection() {
    return (
        <section className={landingSectionTight}>
            <div className={`${landingContainer} space-y-16 md:space-y-20 lg:space-y-24`}>

                {/* Top: Integrations */}
                <div className={`${landingContainerNarrow} flex flex-col gap-8 text-center lg:max-w-4xl`}>
                    <div>
                        <h2 className={landingH2}>Integrates with your pharmacy stack</h2>
                        <p className={`${landingLead} mt-3`}>Connect with payment gateways, insurance providers, and real-time infrastructure to run your pharmacy smoothly.</p>
                    </div>
                    <div className="rounded-2xl border bg-background px-5 pb-8 pt-4 text-left shadow-sm sm:px-6 lg:px-8 xl:mx-auto xl:max-w-2xl">
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
                    <div className="mb-8 text-center">
                        <h2 className="text-balance font-serif text-4xl tracking-tight text-gray-900 dark:text-white lg:text-5xl xl:text-[3.25rem]">Choose Pricing Plan</h2>
                        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-500 md:text-base">Choose the perfect plan for your pharmacy needs — from getting started to scaling your branches.</p>
                    </div>
                    <PolarPricing />
                </div>

            </div>
        </section>
    )
}
