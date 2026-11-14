import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { DashboardSummary, DealStage } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../layout/Sidebar.tsx';
import { DashboardSkeleton } from '../shared/Skeleton.tsx';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenNewDealModal: () => void;
  onOpenNewLeadModal: () => void;
  onSelectDeal: (deal: any) => void;
}

const STAGE_DISPLAY: Record<DealStage, { label: string; colorClass: string }> = {
  NEW_OPPORTUNITY: { label: 'New Opportunity', colorClass: 'text-[#66625A]' },
  QUALIFIED: { label: 'Qualified', colorClass: 'text-blue-700' },
  PROPOSAL_SENT: { label: 'Proposal Sent', colorClass: 'text-[#B47200]' },
  NEGOTIATION: { label: 'Negotiation', colorClass: 'text-amber-700' },
  WON: { label: 'Won', colorClass: 'text-emerald-700' },
  LOST: { label: 'Lost', colorClass: 'text-rose-700' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewDealModal,
  onOpenNewLeadModal,
  onSelectDeal,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueChartData, setRevenueChartData] = useState<
    Array<{ month: string; pipeline: number; won: number }>
  >([]);

  const fetchSummary = useCallback(async (showSkeleton = false) => {
    try {
      if (showSkeleton) setLoading(true);
      const [data, analyticsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getAnalytics('30d'),
      ]);
      setSummary(data);
      if (analyticsData?.revenueTrend) {
        setRevenueChartData(analyticsData.revenueTrend);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Could not load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(true);
  }, [fetchSummary]);

  const handleToggleActivity = async (id: string, title: string) => {
    try {
      await api.toggleActivity(id);
      toast.success(`Completed "${title}"`);
      fetchSummary(false);
    } catch {
      toast.error('Failed to update activity status');
    }
  };

  if (loading && !summary) {
    return <DashboardSkeleton />;
  }

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const maxStageValue = Math.max(
    1,
    ...(summary?.stageSummaries?.map((s) => s.totalValue) || [1])
  );

  const renderDelta = (pct: number | undefined, suffix: string) => {
    const val = pct ?? 0;
    const isPositive = val >= 0;
    return (
      <div
        className={`mt-2 flex items-center gap-1 text-xs font-medium tabular-nums ${
          isPositive ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>
          {isPositive ? '+' : ''}
          {val}% {suffix}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* 1. Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#EAE4D7]">
        <div>
          <p className="text-xs text-[#66625A] font-medium tabular-nums">{currentDateFormatted}</p>
          <h2 className="text-xl font-bold font-display text-[#181A1F] tracking-tight mt-0.5">
            Welcome back, {user?.name?.split(' ')[0] || 'Sarah'}
          </h2>
          <p className="text-xs text-[#66625A] mt-1">
            Active pipeline holds{' '}
            <span className="font-mono tabular-nums font-semibold text-[#181A1F]">
              ${(summary?.totalPipelineValue ?? 0).toLocaleString()}
            </span>{' '}
            across{' '}
            <span className="font-mono tabular-nums font-semibold text-[#181A1F]">
              {summary?.activeDealsCount ?? 0}
            </span>{' '}
            open opportunities with a{' '}
            <span className="font-mono tabular-nums font-semibold text-emerald-700">
              {summary?.winRate ?? 0}%
            </span>{' '}
            win rate.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenNewLeadModal}
            className="px-3.5 py-2 text-xs font-medium text-[#181A1F] bg-white hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#66625A]" />
            <span>New Lead</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewDealModal}
            className="px-4 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Opportunity</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Strip (Clean hairline cards, zero rainbow icon boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
          <span className="text-xs font-medium text-[#66625A]">Total Pipeline Value</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1.5">
            ${(summary?.totalPipelineValue ?? 0).toLocaleString()}
          </p>
          {renderDelta(summary?.pipelineChangePct, 'vs prior period')}
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
          <span className="text-xs font-medium text-[#66625A]">Active Deals</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1.5">
            {summary?.activeDealsCount ?? 0}
          </p>
          {renderDelta(summary?.activeDealsChangePct, 'pipeline volume')}
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
          <span className="text-xs font-medium text-[#66625A]">New Inbound Leads</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1.5">
            {summary?.newLeadsCount ?? 0}
          </p>
          {renderDelta(summary?.leadsChangePct, 'inbound pace')}
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
          <span className="text-xs font-medium text-[#66625A]">Won Revenue</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
            ${(summary?.wonRevenue ?? 0).toLocaleString()}
          </p>
          {renderDelta(summary?.wonChangePct, 'win velocity')}
        </div>
      </div>

      {/* 3. Main Chart & Pipeline Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#EAE4D7] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold font-display text-[#181A1F]">
                Revenue & Pipeline Velocity
              </h3>
              <p className="text-xs text-[#66625A]">
                Active pipeline exposure versus closed won revenue
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[#66625A]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#F0A818] inline-block" aria-hidden="true" />
                <span>Active Pipeline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#10B981] inline-block" aria-hidden="true" />
                <span>Won Revenue</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F0A818" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#F0A818" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE4D7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#EAE4D7' }}
                  tick={{ fontSize: 11, fill: '#66625A' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  tick={{ fontSize: 11, fill: '#66625A', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #EAE4D7',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(24, 26, 31, 0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pipeline"
                  name="Active Pipeline"
                  stroke="#D9930C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#pipelineGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="won"
                  name="Won Revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#wonGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Stage Summary with proportional bars */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold font-display text-[#181A1F]">Pipeline Summary</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('deals')}
                className="text-xs text-[#B47200] font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Open Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {summary?.stageSummaries?.map((st) => {
                const widthPct = Math.max(4, Math.round((st.totalValue / maxStageValue) * 100));
                const barColor =
                  st.stage === 'WON'
                    ? 'bg-emerald-500'
                    : st.stage === 'LOST'
                    ? 'bg-rose-400'
                    : 'bg-[#F0A818]';
                return (
                  <div key={st.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[#181A1F] font-medium truncate">{st.label}</span>
                        <span className="text-[11px] text-[#66625A] font-mono tabular-nums">
                          ({st.count})
                        </span>
                      </div>
                      <span className="font-semibold font-mono tabular-nums text-[#181A1F] shrink-0">
                        ${st.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFEAE0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${st.totalValue > 0 ? widthPct : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAE4D7] flex items-center justify-between text-xs">
            <span className="text-[#66625A] font-medium">Average Deal Size</span>
            <span className="text-sm font-semibold font-mono tabular-nums text-[#181A1F]">
              ${(summary?.averageDealValue ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Upcoming Follow-ups & Recent Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE4D7]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-display text-[#181A1F]">
              Upcoming Follow-ups{' '}
              <span className="text-xs font-mono tabular-nums font-normal text-[#66625A]">
                ({summary?.upcomingActivities?.length || 0})
              </span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('activities')}
              className="text-xs text-[#B47200] font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>All Activities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#EAE4D7]">
            {summary?.upcomingActivities && summary.upcomingActivities.length > 0 ? (
              summary.upcomingActivities.map((act) => {
                const isOverdue = new Date(act.dueDate).getTime() < Date.now();
                return (
                  <div key={act.id} className="py-3 flex items-start gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleActivity(act.id, act.title)}
                      title="Mark completed"
                      aria-label={`Mark ${act.title} as completed`}
                      className="mt-0.5 text-[#D6CFC0] hover:text-emerald-600 transition-colors shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#181A1F] truncate">{act.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#66625A]">
                        <span className="truncate">{act.entityLabel || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{act.assignedToName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Overdue</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono tabular-nums text-[#66625A]">
                          {new Date(act.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-[#66625A]">No pending follow-ups scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Deals Table */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE4D7]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-display text-[#181A1F]">
              Recent Opportunities
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('deals')}
              className="text-xs text-[#B47200] font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>View Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE4D7] text-[#66625A]">
                  <th className="pb-2.5 font-medium">Opportunity</th>
                  <th className="pb-2.5 font-medium">Stage</th>
                  <th className="pb-2.5 font-medium text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {summary?.recentDeals?.map((deal) => {
                  const stageMeta = STAGE_DISPLAY[deal.stage] || {
                    label: deal.stage.replace(/_/g, ' '),
                    colorClass: 'text-[#66625A]',
                  };
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className="hover:bg-[#FAF7F0] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-[#181A1F] truncate max-w-[220px]">
                          {deal.title}
                        </p>
                        <p className="text-[11px] text-[#66625A] truncate">{deal.companyName}</p>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${stageMeta.colorClass}`}>
                          {stageMeta.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold font-mono tabular-nums text-[#181A1F] whitespace-nowrap">
                        ${deal.value.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
