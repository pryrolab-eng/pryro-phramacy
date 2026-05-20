'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from './header'

const transitionVariants = {
    item: {
        hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: { type: 'spring', bounce: 0.3, duration: 1.5 },
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
                                    visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.3, duration: 2 } },
                                },
                            }}
                            className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
                        >
                            <Image
                                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                                alt="background"
                                className="hidden size-full dark:block"
                                width="3276"
                                height="4095"
                            />
                        </AnimatedGroup>

                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />

                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="#link"
                                        className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                                    >
                                        <span className="text-foreground text-sm">Introducing Support for AI Models</span>
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
                                    Modern Solutions for Customer Engagement
                                </TextEffect>
                                <TextEffect per="line" preset="fade-in-blur" speedSegment={0.3} delay={0.5} as="p" className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                                    Highly customizable components for building modern websites and applications that look and feel the way you mean it.
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
                                            <Link href="#link"><span className="text-nowrap">Get Started</span></Link>
                                        </Button>
                                    </div>
                                    <Button key={2} asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                                        <Link href="tel:0781604051"><span className="text-nowrap">Request a demo</span></Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview — inline between hero and next section */}
                <section className="bg-background pb-6 pt-8">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="relative rounded-2xl border border-border overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-zinc-950/70">
                            {/* Dashboard body */}
                            <div className="bg-[#f8fafc] dark:bg-zinc-950 flex" style={{ minHeight: '420px' }}>

                                {/* Sidebar */}
                                <div className="w-44 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex flex-col py-4 px-3 gap-1">
                                    <div className="flex items-center gap-2 px-2 mb-4">
                                        <div className="size-6 rounded-md bg-blue-600 flex items-center justify-center">
                                            <svg className="size-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Pryrox</span>
                                    </div>
                                    {[
                                        { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Overview', active: true },
                                        { d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics', active: false },
                                        { d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: 'Orders', active: false },
                                        { d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Patients', active: false },
                                        { d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', label: 'Inventory', active: false },
                                        { d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Reports', active: false },
                                    ].map((item) => (
                                        <div key={item.label} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-default ${item.active ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'text-zinc-400'}`}>
                                            <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.d} />
                                            </svg>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Main content */}
                                <div className="flex-1 p-5 overflow-hidden min-w-0">

                                    {/* Top bar */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Platform Overview</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">May 2026 · Live data</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full">
                                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
                                            </div>
                                            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-500">Last 30 days ▾</div>
                                        </div>
                                    </div>

                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        {[
                                            { label: 'Total Orders', value: '12,430', change: '+18.2%', up: true },
                                            { label: 'Active Users', value: '3,218', change: '+9.4%', up: true },
                                            { label: 'Revenue', value: 'KES 847K', change: '+24.1%', up: true },
                                            { label: 'Avg. Response', value: '1.4 min', change: '-12%', up: false },
                                        ].map((stat) => (
                                            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
                                                <p className="text-[10px] text-zinc-400 mb-1">{stat.label}</p>
                                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-none">{stat.value}</p>
                                                <p className={`text-[10px] mt-1.5 font-medium ${stat.up ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                    {stat.change} <span className="text-zinc-400 font-normal">vs last month</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts row */}
                                    <div className="grid grid-cols-3 gap-3">

                                        {/* Bar chart */}
                                        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
                                            <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 mb-3">Daily Orders — This Week</p>
                                            <div className="flex items-end gap-2 h-20">
                                                {[
                                                    { day: 'Mon', pct: 55, val: 312 },
                                                    { day: 'Tue', pct: 72, val: 408 },
                                                    { day: 'Wed', pct: 48, val: 271 },
                                                    { day: 'Thu', pct: 88, val: 501 },
                                                    { day: 'Fri', pct: 100, val: 568 },
                                                    { day: 'Sat', pct: 63, val: 357 },
                                                    { day: 'Sun', pct: 38, val: 214 },
                                                ].map((d) => (
                                                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-[8px] text-zinc-400">{d.val}</span>
                                                        <div
                                                            className="w-full rounded-t-md bg-blue-500 dark:bg-blue-600"
                                                            style={{ height: `${d.pct * 0.6}px` }}
                                                        />
                                                        <span className="text-[8px] text-zinc-400">{d.day}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Activity feed */}
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
                                            <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 mb-2.5">Recent Activity</p>
                                            <div className="space-y-2.5">
                                                {[
                                                    { initials: 'NK', name: 'Nurse Kamau', action: 'Dispensed Amoxicillin', time: '2m ago', color: 'bg-blue-500' },
                                                    { initials: 'JO', name: 'James Otieno', action: 'Prescription uploaded', time: '5m ago', color: 'bg-violet-500' },
                                                    { initials: 'AM', name: 'Aisha Mwangi', action: 'Stock alert: Metformin', time: '11m ago', color: 'bg-amber-500' },
                                                    { initials: 'PK', name: 'Dr. P. Kimani', action: 'Approved refill request', time: '18m ago', color: 'bg-emerald-500' },
                                                ].map((a) => (
                                                    <div key={a.name} className="flex items-start gap-2">
                                                        <div className={`size-5 shrink-0 rounded-full ${a.color} flex items-center justify-center text-[7px] font-bold text-white mt-0.5`}>
                                                            {a.initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{a.action}</p>
                                                            <p className="text-[9px] text-zinc-400">{a.name} · {a.time}</p>
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
