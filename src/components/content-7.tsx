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

const PharmacyDashboard = () => (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex text-[10px] select-none h-[420px]">

        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col py-4 px-3 gap-3 overflow-y-auto">
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
        <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
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

            <div className="p-6 space-y-5">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg">Overview</h3>

                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Today Revenue', value: '$881.84', sub: 'Current day revenue', icon: BarChart3 },
                        { label: 'Prescriptions', value: '142', sub: 'Filled today', icon: FileText },
                        { label: 'New Patients', value: '12', sub: 'Added this week', icon: UserPlus },
                        { label: 'Low Stock Items', value: '8', sub: 'Needs reorder', icon: Package },
                    ].map(k => (
                        <div key={k.label} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 relative flex flex-col justify-between h-[100px]">
                            <div className="flex items-start justify-between">
                                <span className="text-[11px] font-semibold text-zinc-500">{k.label}</span>
                                <k.icon className="size-4 text-zinc-400 stroke-2" />
                            </div>
                            <div>
                                <p className="font-extrabold text-zinc-800 dark:text-zinc-100 text-xl leading-tight">{k.value}</p>
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
                        <div className="absolute left-11 right-4 bottom-0 flex justify-between text-[10px] text-zinc-500 font-medium px-2">
                            {['Feb 19', 'Feb 20', 'Feb 21', 'Feb 22', 'Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27', 'Feb 28'].map(d => (
                                <span key={d}>{d}</span>
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
        <section className="py-12 md:py-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="max-w-3xl mb-12 mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-medium mb-4">The Pryrox platform brings everything together.</h2>
                    <p className="text-muted-foreground md:text-lg">
                        Powering a complete pharmacy ecosystem — from inventory and prescriptions to billing and staff management.
                    </p>
                </div>

                <div className="relative mx-auto w-full max-w-4xl pb-12 pt-4">
                    {/* The tilted dashboard */}
                    <div
                        className="w-full relative z-10 transition-transform duration-700 ease-out hover:!transform-none shadow-[25px_25px_60px_-15px_rgba(0,0,0,0.1),_0_0_15px_rgba(0,0,0,0.03)] rounded-2xl"
                        style={{
                            transform: "perspective(1400px) rotateX(10deg) rotateY(-18deg) rotateZ(3deg) scale(0.98)",
                            transformOrigin: 'center center'
                        }}
                    >
                        <PharmacyDashboard />
                    </div>
                </div>
            </div>
        </section>
    )
}
