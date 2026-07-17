'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreatePrescriptionMutation,
  usePrescriptions,
  useUpdatePrescriptionMutation,
  type PrescriptionRow,
} from '@/hooks/usePrescriptions'
import { PRYROX_BRAND_BLUE, PRYROX_BRAND_BLUE_MID } from '@/lib/brand/colors'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Pill,
} from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, CartesianGrid, XAxis } from 'recharts'
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTabsList,
  DashboardChartCard,
  DashboardTableCard,
  DashboardSearchInput,
  DashboardListRow,
  DashboardProgressTrack,
  DashboardPaginatedListCard,
  DashboardPageLoading,
  DashboardPanelEmpty,
  DashboardButton,
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogFooter,
} from '@/components/dashboard'
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { statusToneBadgeClass } from '@/lib/ui/status-tone'

const STATUS_CHART_CONFIG = {
  share: { label: 'Share' },
  pending: { label: 'Pending', color: '#f59e0b' },
  completed: { label: 'Completed', color: PRYROX_BRAND_BLUE_MID },
  dispensed: { label: 'Dispensed', color: '#10b981' },
} satisfies ChartConfig

const volumeChartConfig = {
  count: { label: 'Prescriptions', color: PRYROX_BRAND_BLUE },
} satisfies ChartConfig

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case 'high':
    case 'urgent':
      return statusToneBadgeClass.danger
    case 'medium':
      return statusToneBadgeClass.warning
    case 'low':
      return statusToneBadgeClass.success
    default:
      return statusToneBadgeClass.muted
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return statusToneBadgeClass.warning
    case 'completed':
      return statusToneBadgeClass.info
    case 'dispensed':
      return statusToneBadgeClass.success
    default:
      return statusToneBadgeClass.muted
  }
}

function filterPrescriptions(
  prescriptions: PrescriptionRow[],
  searchTerm: string,
  statusFilter: string,
) {
  let filtered = prescriptions

  const q = searchTerm.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.patient.toLowerCase().includes(q) ||
        p.doctor.toLowerCase().includes(q) ||
        p.medications.some((m) => m.toLowerCase().includes(q)),
    )
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((p) => p.status === statusFilter)
  }

  return filtered
}

function PrescriptionStatusChart({ prescriptions }: { prescriptions: PrescriptionRow[] }) {
  const pending = prescriptions.filter((p) => p.status === 'pending').length
  const completed = prescriptions.filter((p) => p.status === 'completed').length
  const dispensed = prescriptions.filter((p) => p.status === 'dispensed').length
  const hasData = pending + completed + dispensed > 0

  const pieData = [
    { segment: 'pending', share: pending, fill: 'var(--color-pending)' },
    { segment: 'completed', share: completed, fill: 'var(--color-completed)' },
    { segment: 'dispensed', share: dispensed, fill: 'var(--color-dispensed)' },
  ].filter((row) => row.share > 0)

  const footer = (
    <div className="grid gap-2">
      {(
        [
          ['pending', pending, STATUS_CHART_CONFIG.pending.color],
          ['completed', completed, STATUS_CHART_CONFIG.completed.color],
          ['dispensed', dispensed, STATUS_CHART_CONFIG.dispensed.color],
        ] as const
      ).map(([key, count, color]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted-foreground">
            {STATUS_CHART_CONFIG[key].label} ({count})
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <DashboardChartCard
      title="Status distribution"
      description="Pending, completed, and dispensed"
      config={STATUS_CHART_CONFIG}
      chartClassName="mx-auto aspect-square max-h-[220px] w-full"
      footer={footer}
      empty={
        !hasData ? (
          <DashboardPanelEmpty
            icon={Pill}
            title="No prescriptions yet"
            description="Create a prescription to see status breakdown."
            className="min-h-[220px] border-0 bg-transparent shadow-none"
          />
        ) : undefined
      }
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="segment"
              formatter={(value, name) => {
                const key = String(name) as keyof typeof STATUS_CHART_CONFIG
                const label = STATUS_CHART_CONFIG[key]?.label ?? name
                return [`${value}`, label]
              }}
            />
          }
        />
        <Pie
          data={pieData}
          dataKey="share"
          nameKey="segment"
          innerRadius={56}
          outerRadius={80}
          strokeWidth={4}
          stroke="hsl(var(--background))"
        />
      </PieChart>
    </DashboardChartCard>
  )
}

export default function PrescriptionsPage() {
  const prescriptionsQuery = usePrescriptions()
  const createPrescriptionMutation = useCreatePrescriptionMutation()
  const updatePrescriptionMutation = useUpdatePrescriptionMutation()

  const prescriptions = prescriptionsQuery.data ?? []
  const loading = prescriptionsQuery.isPending

  const [isAddingPrescription, setIsAddingPrescription] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newPrescription, setNewPrescription] = useState({
    patient: '',
    doctor: '',
    medications: '',
    priority: 'medium',
    insurance: '',
  })

  const filteredPrescriptions = useMemo(
    () => filterPrescriptions(prescriptions, searchTerm, statusFilter),
    [prescriptions, searchTerm, statusFilter],
  )

  const stats = useMemo(() => {
    const total = prescriptions.length
    const pending = prescriptions.filter((p) => p.status === 'pending').length
    const completed = prescriptions.filter((p) => p.status === 'completed').length
    const dispensed = prescriptions.filter((p) => p.status === 'dispensed').length
    const insurance = prescriptions.filter(
      (p) => p.insurance && p.insurance !== 'None',
    ).length
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
    return {
      total,
      pending,
      completed,
      dispensed,
      insurance,
      completionRate: pct(completed + dispensed),
      insuranceRate: pct(insurance),
    }
  }, [prescriptions])

  const volumeByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = Object.fromEntries(days.map((d) => [d, 0]))
    for (const rx of prescriptions) {
      if (!rx.created_at) continue
      const d = new Date(rx.created_at)
      if (Number.isNaN(d.getTime())) continue
      const key = days[d.getDay()]
      counts[key] = (counts[key] ?? 0) + 1
    }
    return days.map((day) => ({ day, count: counts[day] ?? 0 }))
  }, [prescriptions])

  const pendingList = useMemo(
    () => prescriptions.filter((p) => p.status === 'pending'),
    [prescriptions],
  )
  const readyList = useMemo(
    () => prescriptions.filter((p) => p.status === 'completed'),
    [prescriptions],
  )

  const handleAddPrescription = async () => {
    try {
      await createPrescriptionMutation.mutateAsync({
        ...newPrescription,
        medications: newPrescription.medications
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
      })
      setIsAddingPrescription(false)
      setNewPrescription({
        patient: '',
        doctor: '',
        medications: '',
        priority: 'medium',
        insurance: '',
      })
      toast.success('Prescription added')
    } catch (error) {
      console.error('Error adding prescription:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to add prescription',
      )
    }
  }

  const updatePrescriptionStatus = async (id: string, status: string) => {
    try {
      await updatePrescriptionMutation.mutateAsync({ id, body: { status } })
      toast.success(`Marked as ${status}`)
    } catch (error) {
      console.error('Error updating prescription:', error)
      toast.error('Could not update prescription')
    }
  }

  if (loading) {
    return <DashboardPageLoading label="Loading prescriptions…" />
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Prescriptions"
        description="Clinical Rx queue — verify, prepare, and dispense before or at POS"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DashboardButton variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DashboardButton>
            <DashboardButton size="sm" onClick={() => setIsAddingPrescription(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New prescription
            </DashboardButton>
          </div>
        }
      />

      <DashboardMetricGrid>
        <DashboardStatCard
          label="Total prescriptions"
          value={stats.total}
          hint="Live prescription count"
          icon={FileText}
        />
        <DashboardStatCard
          label="Pending"
          value={stats.pending}
          hint="Awaiting processing"
          icon={Clock}
        />
        <DashboardStatCard
          label="Ready to dispense"
          value={stats.completed}
          hint="Completed — hand to patient"
          icon={AlertCircle}
        />
        <DashboardStatCard
          label="Dispensed"
          value={stats.dispensed}
          hint="Successfully completed"
          icon={CheckCircle}
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="overview" className="space-y-4">
        <DashboardTabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">All prescriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </DashboardTabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3 md:items-start">
            <DashboardPaginatedListCard
              title="Pending prescriptions"
              description="Awaiting pharmacist review"
              items={pendingList}
              getItemKey={(rx) => rx.id}
              pageSize={5}
              empty={{
                icon: Clock,
                title: 'No pending prescriptions',
                description: 'New Rx orders will appear here.',
              }}
              renderItem={(rx) => (
                <DashboardListRow>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{rx.patient}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Dr. {rx.doctor}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge className={cn('text-xs', priorityBadgeClass(rx.priority))}>
                      {rx.priority}
                    </Badge>
                    <DashboardButton
                      size="sm"
                      onClick={() => updatePrescriptionStatus(rx.id, 'completed')}
                    >
                      Process
                    </DashboardButton>
                  </div>
                </DashboardListRow>
              )}
            />

            <DashboardPaginatedListCard
              title="Ready to dispense"
              description="Completed — release at counter or POS"
              items={readyList}
              getItemKey={(rx) => rx.id}
              pageSize={5}
              empty={{
                icon: CheckCircle,
                title: 'Nothing ready',
                description: 'Processed prescriptions show here before dispense.',
              }}
              renderItem={(rx) => (
                <DashboardListRow>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{rx.patient}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Dr. {rx.doctor} · {rx.insurance || 'Cash'}
                    </p>
                  </div>
                  <DashboardButton
                    size="sm"
                    onClick={() => updatePrescriptionStatus(rx.id, 'dispensed')}
                  >
                    Dispense
                  </DashboardButton>
                </DashboardListRow>
              )}
            />

            <DashboardPaginatedListCard
              title="Quick stats"
              description="Pipeline health"
              items={[{ id: 'stats' }]}
              getItemKey={() => 'stats'}
              showCountBadge={false}
              renderItem={() => (
                <div className="space-y-4 py-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Completion rate</span>
                      <span className="text-muted-foreground tabular-nums">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <DashboardProgressTrack value={stats.completionRate} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Insurance Rx</span>
                      <span className="text-muted-foreground tabular-nums">
                        {stats.insuranceRate}%
                      </span>
                    </div>
                    <DashboardProgressTrack
                      value={stats.insuranceRate}
                      barClassName="bg-[#003459] dark:bg-[#5a8aad]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg processing time is not tracked yet.
                  </p>
                </div>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <DashboardTableCard
            title="All prescriptions"
            description="Search and advance status through the workflow"
            toolbar={
              <>
                <DashboardSearchInput
                  placeholder="Search patient, doctor, medication…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dispensed">Dispensed</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          >
            {filteredPrescriptions.length === 0 ? (
              <DashboardPanelEmpty
                icon={Pill}
                title="No prescriptions found"
                description={
                  searchTerm || statusFilter !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Add a prescription to get started.'
                }
                className="border-0 shadow-none"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Prescriber</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.patient}</TableCell>
                      <TableCell>Dr. {rx.doctor}</TableCell>
                      <TableCell>
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {rx.medications.slice(0, 2).map((med, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {med}
                            </Badge>
                          ))}
                          {rx.medications.length > 2 ? (
                            <Badge variant="outline" className="text-xs">
                              +{rx.medications.length - 2}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityBadgeClass(rx.priority)}>
                          {rx.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(rx.status)}>
                          {rx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rx.insurance || '—'}</TableCell>
                      <TableCell className="text-right">
                        {rx.status === 'pending' ? (
                          <DashboardButton
                            size="sm"
                            variant="outline"
                            onClick={() => updatePrescriptionStatus(rx.id, 'completed')}
                          >
                            Complete
                          </DashboardButton>
                        ) : null}
                        {rx.status === 'completed' ? (
                          <DashboardButton
                            size="sm"
                            onClick={() => updatePrescriptionStatus(rx.id, 'dispensed')}
                          >
                            Dispense
                          </DashboardButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DashboardTableCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <DashboardChartCard
              title="Prescription volume"
              description="By day of week (from created dates)"
              config={volumeChartConfig}
              chartClassName="aspect-auto h-[280px] w-full"
              empty={
                stats.total === 0 ? (
                  <DashboardPanelEmpty
                    icon={FileText}
                    title="No volume data"
                    description="Prescription counts appear once records exist."
                    className="h-full border-0 bg-transparent shadow-none"
                  />
                ) : undefined
              }
            >
              <BarChart accessibilityLayer data={volumeByDay}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={4}
                />
              </BarChart>
            </DashboardChartCard>

            <PrescriptionStatusChart prescriptions={prescriptions} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddingPrescription} onOpenChange={setIsAddingPrescription}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>New prescription</DashboardDialogTitle>
            <DashboardDialogDescription>
              Record a doctor&apos;s order before dispensing at the counter or POS.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Patient name</Label>
              <Input
                value={newPrescription.patient}
                onChange={(e) =>
                  setNewPrescription({ ...newPrescription, patient: e.target.value })
                }
                placeholder="Who receives the medication"
              />
            </div>
            <div className="space-y-2">
              <Label>Prescriber</Label>
              <Input
                value={newPrescription.doctor}
                onChange={(e) =>
                  setNewPrescription({ ...newPrescription, doctor: e.target.value })
                }
                placeholder="Doctor name"
              />
            </div>
            <div className="space-y-2">
              <Label>Medications</Label>
              <Textarea
                value={newPrescription.medications}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    medications: e.target.value,
                  })
                }
                placeholder="Paracetamol 500mg, Amoxicillin 250mg"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newPrescription.priority}
                  onValueChange={(value) =>
                    setNewPrescription({ ...newPrescription, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Insurance</Label>
                <Select
                  value={newPrescription.insurance}
                  onValueChange={(value) =>
                    setNewPrescription({ ...newPrescription, insurance: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RSSB">RSSB</SelectItem>
                    <SelectItem value="MMI">MMI</SelectItem>
                    <SelectItem value="Radiant">Radiant</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton
              variant="outline"
              onClick={() => setIsAddingPrescription(false)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              onClick={() => void handleAddPrescription()}
              disabled={
                !newPrescription.patient.trim() ||
                !newPrescription.doctor.trim() ||
                createPrescriptionMutation.isPending
              }
            >
              Add prescription
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
