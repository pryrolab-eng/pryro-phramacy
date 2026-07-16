'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from './header'
import { landingContainer, landingContainerWide } from '@/lib/landing-layout'

const transitionVariants = {
    item: {
        hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
        },
    },
}

export default function HeroSection() {

    return (
        <React.Fragment>
            <HeroHeader />

            <main className="overflow-hidden">
                <div aria-hidden className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block">
                    <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={{
                                container: { visible: { transition: { delayChildren: 1 } } },
                                item: {
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.3, duration: 2 } },
                                },
                            }}
                            className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
                        >
                            <Image
                                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                                alt=""
                                aria-hidden
                                className="hidden size-full dark:block"
                                width={3276}
                                height={4095}
                                sizes="100vw"
                                priority
                            />
                        </AnimatedGroup>

                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />

                        <div className={landingContainer}>
                            <div className="text-center sm:mx-auto lg:mt-0 xl:max-w-4xl xl:mx-auto">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="/#pricing"
                                        className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                                    >
                                        <span className="text-foreground text-sm">POS, inventory &amp; billing in one platform</span>
                                        <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />
                                        <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6"><ArrowRight className="m-auto size-3" /></span>
                                                <span className="flex size-6"><ArrowRight className="m-auto size-3" /></span>
                                            </div>
                                        </div>
                                    </Link>
                                </AnimatedGroup>

                                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="h1" className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                                    Pharmacy operations, built for modern teams
                                </TextEffect>
                                <TextEffect per="line" preset="fade-in-blur" speedSegment={0.3} delay={0.5} as="p" className="mx-auto mt-8 max-w-2xl text-balance text-lg md:text-xl lg:max-w-3xl">
                                    Run POS, stock, prescriptions, staff, and branches from one place  with plans that match how your pharmacy actually works.
                                </TextEffect>

                                <AnimatedGroup
                                    variants={{
                                        container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                                >
                                    <div key={1} className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                                        <Button asChild size="lg" className="rounded-xl px-5 text-base">
                                            <Link href="/sign-up"><span className="text-nowrap">Get Started</span></Link>
                                        </Button>
                                    </div>
                                    <Button key={2} asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                                        <Link href="/#pricing"><span className="text-nowrap">View plans</span></Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview */}
                <section className="overflow-x-hidden bg-background pb-8 pt-8 md:pb-10 lg:pb-12 xl:pb-14">
                    <div className={landingContainerWide}>
                        <div className="relative mx-auto min-w-0 max-w-6xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60 lg:max-w-7xl xl:rounded-3xl">
                            <div className="flex min-h-0 flex-col bg-zinc-50/80 md:min-h-[420px] md:flex-row lg:min-h-[460px] xl:min-h-[500px]">

                                {/* Sidebar — desktop only */}
                                <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-white py-4 px-3 md:flex lg:w-48 xl:w-52 xl:px-4">
                                    <div className="mb-4 flex items-center gap-2 px-2">
                                        <div className="flex size-6 items-center justify-center rounded-md bg-primary">
                                            <svg className="size-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-zinc-900">Pryrox</span>
                                    </div>
                                    {[
                                        { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard', active: true },
                                        { d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: 'POS', active: false },
                                        { d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', label: 'Inventory', active: false },
                                        { d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Patients', active: false },
                                        { d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Reports', active: false },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className={`flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                                                item.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-zinc-500 hover:text-zinc-800'
                                            }`}
                                        >
                                            <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.d} />
                                            </svg>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Main content */}
                                <div className="min-w-0 flex-1 overflow-hidden p-4 sm:p-5 lg:p-6 xl:p-8">

                                    {/* Mobile nav strip */}
                                    <div className="mb-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
                                        {['Dashboard', 'POS', 'Inventory', 'Patients', 'Reports'].map((label, i) => (
                                            <span
                                                key={label}
                                                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
                                                    i === 0
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-white text-zinc-500 ring-1 ring-zinc-200'
                                                }`}
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900">Pharmacy dashboard</p>
                                            <p className="mt-0.5 text-xs text-zinc-500">Today · Live sales &amp; stock</p>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                <span className="text-xs font-medium text-emerald-700">Live</span>
                                            </div>
                                            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 whitespace-nowrap">
                                                Last 30 days ▾
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4 xl:gap-5">
                                        {[
                                            { label: 'POS sales today', value: '428', change: '+12%', up: true },
                                            { label: 'Low stock items', value: '7', change: '3 urgent', up: false },
                                            { label: 'Revenue (RWF)', value: '1.2M', change: '+18%', up: true },
                                            { label: 'Active staff', value: '14', change: '2 branches', up: true },
                                        ].map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="min-w-0 rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 lg:p-4"
                                            >
                                                <p className="mb-1 truncate text-[10px] text-zinc-500">{stat.label}</p>
                                                <p className="text-sm font-bold leading-none text-zinc-900">{stat.value}</p>
                                                <p
                                                    className={`mt-1.5 text-[10px] font-medium ${
                                                        stat.up ? 'text-emerald-600' : 'text-amber-600'
                                                    }`}
                                                >
                                                    {stat.change}{' '}
                                                    <span className="font-normal text-zinc-400">vs last month</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:gap-4 xl:gap-5">
                                        <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 md:col-span-2 lg:p-4 xl:p-5">
                                            <p className="mb-3 text-[10px] font-semibold text-zinc-700 lg:text-xs">
                                                POS sales — this week
                                            </p>
                                            <div className="flex h-20 items-end gap-2 lg:h-24 xl:h-28 xl:gap-3">
                                                {[
                                                    { day: 'Mon', pct: 55, val: 312 },
                                                    { day: 'Tue', pct: 72, val: 408 },
                                                    { day: 'Wed', pct: 48, val: 271 },
                                                    { day: 'Thu', pct: 88, val: 501 },
                                                    { day: 'Fri', pct: 100, val: 568 },
                                                    { day: 'Sat', pct: 63, val: 357 },
                                                    { day: 'Sun', pct: 38, val: 214 },
                                                ].map((d) => (
                                                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                                                        <span className="text-[8px] text-zinc-500">{d.val}</span>
                                                        <div
                                                            className="w-full rounded-t-md bg-primary"
                                                            style={{ height: `${d.pct * 0.6}px` }}
                                                        />
                                                        <span className="text-[8px] text-zinc-500">{d.day}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3">
                                            <p className="mb-2.5 text-[10px] font-semibold text-zinc-700">
                                                Recent activity
                                            </p>
                                            <div className="space-y-2.5">
                                                {[
                                                     { initials: 'NK', name: 'Nurse Kamau', action: 'Dispensed Amoxicillin', time: '2m ago', color: 'bg-primary text-primary-foreground' },
                                                    { initials: 'JO', name: 'James Otieno', action: 'Prescription uploaded', time: '5m ago', color: 'bg-zinc-700 text-white' },
                                                    { initials: 'AM', name: 'Aisha Mwangi', action: 'Stock alert: Metformin', time: '11m ago', color: 'bg-zinc-500 text-white' },
                                                    { initials: 'PK', name: 'Dr. P. Kimani', action: 'Approved refill request', time: '18m ago', color: 'bg-zinc-300 text-zinc-900' },
                                                ].map((a) => (
                                                    <div key={a.name} className="flex items-start gap-2">
                                                        <div
                                                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold ${a.color}`}
                                                        >
                                                            {a.initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[10px] font-medium text-zinc-800">
                                                                {a.action}
                                                            </p>
                                                            <p className="text-[9px] text-zinc-500">
                                                                {a.name} · {a.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </React.Fragment>
    )
}
