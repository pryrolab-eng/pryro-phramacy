import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const integrations = [
    {
        name: 'Polar',
        description: 'Card payments for pharmacy subscriptions.',
        icon: '💳',
    },
    {
        name: 'RSSB Insurance',
        description: 'Automatic coverage calculations at point of sale.',
        icon: '🏥',
    },
    {
        name: 'Supabase',
        description: 'Real-time database, auth, and secure storage.',
        icon: '⚡',
    },
]

export default function IntegrationsSection() {
    return (
        <section>
            <div className="bg-muted dark:bg-background py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mx-auto max-w-md px-6 [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)]">
                        <div className="bg-background dark:bg-muted/50 rounded-xl border px-6 pb-12 pt-3 shadow-xl">
                            {integrations.map((item) => (
                                <Integration key={item.name} icon={item.icon} name={item.name} description={item.description} />
                            ))}
                        </div>
                    </div>
                    <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
                        <h2 className="text-balance text-3xl font-semibold md:text-4xl lg:text-5xl">Integrates with your pharmacy stack</h2>
                        <p className="text-muted-foreground">Connect with payment gateways, insurance providers, and real-time infrastructure to run your pharmacy smoothly.</p>

                        <Button variant="outline" size="sm" asChild>
                            <Link href="/sign-up">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const Integration = ({ icon, name, description }: { icon: string; name: string; description: string }) => {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed py-3 last:border-b-0">
            <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border text-2xl">
                {icon}
            </div>
            <div className="space-y-0.5">
                <h3 className="text-sm font-medium">{name}</h3>
                <p className="text-muted-foreground line-clamp-1 text-sm">{description}</p>
            </div>
            <Button variant="outline" size="icon" aria-label="Add integration">
                <Plus className="size-4" />
            </Button>
        </div>
    )
}
