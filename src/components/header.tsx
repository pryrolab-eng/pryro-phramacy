'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet'
import React from 'react'
import { cn } from '@/lib/utils'
import { landingContainerWide } from '@/lib/landing-layout'
import { DynamicLogo } from '@/components/auth-branding'

const menuItems = [
    { name: 'Features', href: '#link' },
    { name: 'Solution', href: '#link' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#link' },
]

const secondaryLinks = [
    { name: 'Help', href: '#link' },
    { name: 'Contact', href: '#link' },
    { name: 'About us', href: '#link' },
    { name: 'Pricing', href: '#pricing' },
]

export const HeroHeader = () => {
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const closeMenu = () => setMenuOpen(false)

    return (
        <header>
            <nav
                className="fixed z-20 w-full px-2 sm:px-3 lg:px-4"
                aria-label="Main"
            >
                <div
                    className={cn(
                        landingContainerWide,
                        'mt-2 transition-all duration-300',
                        isScrolled &&
                            'max-w-5xl rounded-2xl border bg-background/50 backdrop-blur-lg xl:max-w-5xl',
                    )}
                >
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 lg:grid-cols-[auto_1fr_auto] lg:gap-6 lg:py-4">
                        <Link
                            href="/"
                            aria-label="home"
                            className="flex shrink-0 items-center"
                        >
                            <DynamicLogo />
                        </Link>

                        <ul className="col-span-2 hidden justify-center gap-0.5 lg:col-span-1 lg:flex xl:gap-1">
                            {menuItems.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground xl:px-4"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="hidden items-center justify-end gap-2 lg:flex">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className={cn('h-9 rounded-lg', isScrolled && 'lg:hidden')}
                            >
                                <Link href="/sign-in">Log in</Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className={cn('h-9 rounded-lg', isScrolled && 'lg:hidden')}
                            >
                                <Link href="/sign-up">Sign up</Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className={cn(
                                    'h-9 rounded-lg',
                                    isScrolled ? 'lg:inline-flex' : 'hidden',
                                )}
                            >
                                <Link href="/sign-up">Get Started</Link>
                            </Button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                            className="justify-self-end rounded-lg p-2 text-foreground hover:bg-muted/80 lg:hidden"
                        >
                            <Menu className="size-6" strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </nav>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent
                    side="top"
                    showClose={false}
                    aria-describedby={undefined}
                    overlayClassName="bg-neutral-900/30 backdrop-blur-[3px]"
                    className="inset-x-0 top-0 flex h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0"
                >
                    <SheetTitle className="sr-only">Navigation menu</SheetTitle>

                    <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-5 py-4 dark:border-neutral-800">
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="flex items-center"
                        >
                            <DynamicLogo />
                        </Link>
                        <SheetClose asChild>
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                            >
                                <X className="size-5" strokeWidth={1.75} />
                            </button>
                        </SheetClose>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-2">
                        <ul className="py-2">
                            {menuItems.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={closeMenu}
                                        className="flex items-center py-3.5 text-base font-semibold tracking-tight text-neutral-900 transition-colors hover:text-neutral-600 dark:text-neutral-50 dark:hover:text-neutral-300"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div
                            className="my-4 h-px bg-neutral-200 dark:bg-neutral-800"
                            aria-hidden
                        />

                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pb-6">
                            {secondaryLinks.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="shrink-0 space-y-3 border-t border-neutral-200/80 bg-background px-5 py-5 dark:border-neutral-800">
                        <Button
                            asChild
                            size="lg"
                            className="h-11 w-full rounded-lg text-base font-semibold"
                        >
                            <Link href="/sign-up" onClick={closeMenu}>
                                Sign up
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-11 w-full rounded-lg border-neutral-300 bg-white text-base font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-50"
                        >
                            <Link href="/sign-in" onClick={closeMenu}>
                                Log in
                            </Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    )
}
