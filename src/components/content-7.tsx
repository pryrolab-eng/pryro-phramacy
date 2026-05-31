import {
    Cpu,
    Zap,
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    Users,
    UserPlus,
    UserCheck,
    FileText,
    Settings,
    Pill,
    Search,
    Globe,
    User,
    ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    landingContainer,
    landingContainerNarrow,
    landingH2,
    landingLead,
    landingSection,
} from '@/lib/landing-layout'

const PharmacyDashboard = () => (
    <div className="flex min-h-[360px] w-full min-w-0 select-none flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white text-[10px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-950 md:h-[420px] md:flex-row lg:h-[460px] xl:h-[500px]">

        {/* Sidebar — desktop only */}
        <div className="hidden w-48 shrink-0 flex-col gap-3 overflow-y-auto border-r border-zinc-100 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:flex lg:w-52 xl:px-4">
            <div className="px-1 flex items-center gap-2 text-blue-600">
                <Pill className="size-5" />
                <span className="font-extrabold text-lg tracking-tight">Pryrox</span>
            </div>

            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <Search className="size-3.5" />
                <span className="text-[10px]">Search menu...</span>
            </div>

            <div className="flex flex-col gap-0.5 mt-2">
                {[
                    { label: 'Dashboard', active: false, icon: LayoutDashboard },
                    { label: 'Inventory', active: false, icon: Package },
                    { label: 'POS', active: true, icon: ShoppingCart },
                    { label: 'Sales', active: false, icon: BarChart3 },
                    { label: 'Customers', active: false, icon: Users },
                    { label: 'Patients', active: false, icon: UserPlus },
                    { label: 'Staff', active: false, icon: UserCheck },
                    { label: 'Reports', active: false, icon: FileText },
                    { label: 'Settings', active: false, icon: Settings },
                ].map((item) => (
                    <div key={item.label} className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer ${item.active ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}>
                        <div className="flex items-center gap-2">
                            <item.icon className="size-3.5" />
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
            {/* Mobile nav strip */}
            <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
                {['Dashboard', 'Inventory', 'POS', 'Sales', 'Patients'].map((label) => (
                    <span
                        key={label}
                        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium ${
                            label === 'POS'
                                ? 'bg-zinc-100 font-bold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
                                : 'text-zinc-500'
                        }`}
                    >
                        {label}
                    </span>
                ))}
            </div>
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="size-4 text-zinc-400" />
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <span className="text-zinc-800 dark:text-zinc-200 font-bold">POS Dashboard</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-600 font-medium">
                        <Globe className="size-3.5" />
                        <span>English</span>
                        <ChevronDown className="size-3" />
                    </div>
                    <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="size-3.5" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 sm:text-lg">Overview</h3>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                    {[
                        { label: 'Today Revenue', value: '$881.84', sub: 'Current day revenue', icon: BarChart3 },
                        { label: 'Prescriptions', value: '142', sub: 'Filled today', icon: FileText },
                        { label: 'New Patients', value: '12', sub: 'Added this week', icon: UserPlus },
                        { label: 'Low Stock Items', value: '8', sub: 'Needs reorder', icon: Package },
                    ].map(k => (
                        <div key={k.label} className="relative flex min-h-[88px] flex-col justify-between rounded-xl border border-zinc-200/60 bg-zinc-100/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50 sm:min-h-[100px] sm:p-4">
                            <div className="flex items-start justify-between">
                                <span className="text-[10px] font-semibold text-zinc-500 sm:text-[11px]">{k.label}</span>
                                <k.icon className="size-4 text-zinc-400 stroke-2" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold leading-tight text-zinc-800 dark:text-zinc-100 sm:text-xl">{k.value}</p>
                                <p className="text-[9px] text-zinc-400 mt-0.5">{k.sub || '\u00A0'}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Line chart */}
                <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
                    <p className="font-bold text-zinc-800 dark:text-zinc-100 mb-6 text-sm">Last 10 Days Sales Report</p>
                    <div className="relative h-44">
                        {/* Horizontal Grid lines & Y axis labels */}
                        <div className="absolute inset-0 flex flex-col justify-between pb-6">
                            {['6000', '4500', '3000', '1500', '0'].map((v) => (
                                <div key={v} className="flex items-center gap-3 w-full">
                                    <span className="text-[10px] text-zinc-400 w-8 text-right shrink-0">{v}</span>
                                    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/80"></div>
                                </div>
                            ))}
                        </div>

                        {/* Chart area */}
                        <div className="absolute left-11 right-4 top-1.5 bottom-6">
                            <svg viewBox="0 0 800 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <path d="M0,80 C60,40 120,20 180,60 C240,100 300,110 360,90 C420,70 480,90 540,30 C600,-30 660,100 720,95 C760,90 800,85 800,85" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* X axis labels */}
                        <div className="absolute bottom-0 left-11 right-4 flex justify-between gap-0.5 px-1 text-[8px] font-medium text-zinc-500 sm:text-[10px]">
                            {['Feb 19', 'Feb 20', 'Feb 21', 'Feb 22', 'Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27', 'Feb 28'].map((d, i) => (
                                <span key={d} className={i % 2 === 1 ? 'hidden sm:inline' : ''}>{d}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center mt-3">
                        <div className="flex items-center gap-1.5">
                            <svg className="size-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><line x1="2" x2="22" y1="12" y2="12" /></svg>
                            <span className="text-[10px] text-zinc-400 font-medium">Daily Sales</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export default function ContentSection() {
    return (
        <section className={landingSection}>
            <div className={landingContainer}>
                <div className={cn(landingContainerNarrow, 'mb-12 text-center')}>
                    <h2 className={cn(landingH2, 'mb-4 font-medium')}>
                        The Pryrox platform brings everything together.
                    </h2>
                    <p className={landingLead}>
                        Powering a complete pharmacy ecosystem — from inventory and prescriptions to billing and staff management.
                    </p>
                </div>

                <div className="relative mx-auto w-full min-w-0 max-w-5xl overflow-hidden pb-12 pt-4 lg:max-w-6xl xl:max-w-7xl">
                    {/* Tilted dashboard — flat on mobile */}
                    <div
                        className="relative z-10 w-full min-w-0 rounded-2xl shadow-lg transition-transform duration-700 ease-out max-md:transform-none md:shadow-[25px_25px_60px_-15px_rgba(0,0,0,0.1),_0_0_15px_rgba(0,0,0,0.03)] md:hover:!transform-none md:[transform:perspective(1400px)_rotateX(10deg)_rotateY(-18deg)_rotateZ(3deg)_scale(0.98)]"
                        style={{ transformOrigin: 'center center' }}
                    >
                        <PharmacyDashboard />
                    </div>
                </div>
            </div>
        </section>
    )
}
