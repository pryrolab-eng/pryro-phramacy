'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'
import {
    landingContainer,
    landingContainerNarrow,
    landingH2,
    landingLead,
    landingSectionTight,
} from '@/lib/landing-layout'

export default function FAQsFour() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'How do I get started with Pryrox?',
            answer: 'Sign up, create your pharmacy profile, and you can start managing inventory, sales, and staff right away. Onboarding takes less than 10 minutes.',
        },
        {
            id: 'item-2',
            question: 'Does Pryrox support multiple branches?',
            answer: 'Yes. Pryrox is built for multi-branch pharmacies. Each branch has its own inventory, staff, and sales data, all visible from a single owner dashboard.',
        },
        {
            id: 'item-3',
            question: 'Which insurance providers are supported?',
            answer: 'Pryrox natively supports RSSB, RAMA, MMI, and Radiant insurance providers with automatic coverage calculations per item at the point of sale.',
        },
        {
            id: 'item-4',
            question: 'What payment methods does the POS support?',
            answer: 'The POS supports cash, card, mobile money, insurance, and mixed payments. Subscription billing is powered by Polar.',
        },
        {
            id: 'item-5',
            question: 'Is my data secure?',
            answer: 'Yes. All data is stored in Supabase with Row-Level Security enforced at the database level. Each pharmacy can only access its own data. Sessions use HTTP-only cookies with JWT authentication.',
        },
        {
            id: 'item-6',
            question: 'Can I manage prescriptions and patients?',
            answer: 'Yes. Pryrox includes a full prescription queue with priority levels, patient profiles, insurance numbers, and dispensing workflows for pharmacists.',
        },
    ]

    return (
        <section className={landingSectionTight}>
            <div className={landingContainer}>
                <div className={`${landingContainerNarrow} text-center`}>
                    <h2 className={landingH2}>Frequently Asked Questions</h2>
                    <p className={`${landingLead} mt-4`}>Everything you need to know about Pryrox pharmacy management platform.</p>
                </div>

                <div className={`${landingContainerNarrow} mt-12 max-w-2xl`}>
                    <Accordion type="single" collapsible className="bg-muted dark:bg-muted/50 w-full rounded-2xl p-1">
                        {faqItems.map((item) => (
                            <div className="group" key={item.id}>
                                <AccordionItem
                                    value={item.id}
                                    className="data-[state=open]:bg-card dark:data-[state=open]:bg-muted peer rounded-xl border-none px-7 py-1 data-[state=open]:border-none data-[state=open]:shadow-sm">
                                    <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-base">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <hr className="mx-7 border-dashed group-last:hidden peer-data-[state=open]:opacity-0" />
                            </div>
                        ))}
                    </Accordion>

                    <p className="text-muted-foreground mt-6 px-8">
                        Still have questions?{' '}
                        <Link href="/sign-up" className="text-primary font-medium hover:underline">
                            Start a free trial
                        </Link>{' '}
                        or{' '}
                        <Link href="#" className="text-primary font-medium hover:underline">
                            contact support
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
