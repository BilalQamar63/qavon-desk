import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import { AnalyticsData } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { Avatar } from '../shared/Avatar.tsx';
import { ReportsSkeleton } from '../shared/Skeleton.tsx';

export const ReportsView: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getAnalytics(range);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        toast.error('Failed to load analytics report');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [range]);

  const wonLostPieData = analytics
    ? [
        { name: 'Won Deals', value: analytics.wonVsLost.wonCount, color: '#16A34A' },
        { name: 'Lost Deals', value: analytics.wonVsLost.lostCount, color: '#DC2626' },
      ]
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[#FAF7F0]">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[#181A1F]">
            Sales Intelligence & Analytics
          </h2>
          <p className="text-xs text-[#66625A] mt-0.5">
            Conversion metrics, stage exposure, and sales representative performance.
          </p>
        </div>

        <div className="flex items-center gap-0.5 p-0.5 bg-[#EFEAE0] border border-[#EAE4D7] rounded-lg text-xs font-medium">
          {[
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'ytd', label: 'Year to Date' },
            { id: 'all', label: 'All Time' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                range === opt.id
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !analytics ? (
        <ReportsSkeleton />
      ) : (
        <>
          {/* 2. Key Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
              <span className="text-xs font-medium text-[#66625A]">Average Deal Size</span>
              <p className="text-xl font-bold font-mono tabular-nums text-[#181A1F] mt-1.5">
                ${(analytics?.keyMetrics?.avgDealSize ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#66625A] mt-1">Across pipeline stages</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
              <span className="text-xs font-medium text-[#66625A]">Win Conversion Rate</span>
              <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
                {analytics?.wonVsLost?.winRate ?? 0}%
              </p>
              <p className="text-[11px] text-[#66625A] mt-1 font-mono tabular-nums">
                {analytics?.wonVsLost?.wonCount ?? 0} won /{' '}
                {(analytics?.wonVsLost?.wonCount ?? 0) + (analytics?.wonVsLost?.lostCount ?? 0)}{' '}
                closed
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
              <span className="text-xs font-medium text-[#66625A]">Average Sales Cycle</span>
              <p className="text-xl font-bold font-mono tabular-nums text-[#181A1F] mt-1.5">
                {analytics?.keyMetrics?.avgDealCycleDays ?? 0} days
              </p>
              <p className="text-[11px] text-[#66625A] mt-1">Creation to closed-won</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAE4D7]">
              <span className="text-xs font-medium text-[#66625A]">Lead-to-Win Conversion</span>
              <p className="text-xl font-bold font-mono tabular-nums text-[#B47200] mt-1.5">
                {analytics?.keyMetrics?.leadToWonRate ?? 0}%
              </p>
              <p className="text-[11px] text-[#66625A] mt-1">Inbound funnel efficiency</p>
            </div>
          </div>

          {/* 3. Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-[#EAE4D7]">
              <h3 className="text-sm font-semibold font-display text-[#181A1F]">
                Deals Value by Pipeline Stage
              </h3>
              <p className="text-xs text-[#66625A] mt-0.5 mb-4">
                Dollar exposure distributed across active and closed milestones
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.stageBreakdown || []}
                    margin={{ top: 8, right: 8, left: -12, bottom: 18 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE4D7" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tickLine={false}
                      axisLine={{ stroke: '#EAE4D7' }}
                      tick={{ fontSize: 10, fill: '#66625A' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                      tick={{
                        fontSize: 10,
                        fill: '#66625A',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Value']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #EAE4D7',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" fill="#F0A818" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold font-display text-[#181A1F]">
                    Closed Outcomes & Conversion Funnel
                  </h3>
                  <p className="text-xs text-[#66625A] mt-0.5">
                    Win/loss distribution and stage-to-stage progression
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-[#66625A] shrink-0">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A] inline-block" />
                    Won ({analytics?.wonVsLost?.wonCount ?? 0})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626] inline-block" />
                    Lost ({analytics?.wonVsLost?.lostCount ?? 0})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wonLostPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {wonLostPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} Deals`, name]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #EAE4D7',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {analytics?.conversionFunnel?.map((step) => (
                    <div key={step.step} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#181A1F]">{step.step}</span>
                        <span className="font-mono tabular-nums text-[#66625A]">
                          {step.count} ({step.conversionRate}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EFEAE0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F0A818] rounded-full"
                          style={{ width: `${Math.max(4, step.conversionRate)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Rep Performance Leaderboard */}
          <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EAE4D7]">
              <h3 className="text-sm font-semibold font-display text-[#181A1F]">
                Sales Team Performance
              </h3>
              <p className="text-xs text-[#66625A] mt-0.5">
                Quota attainment, active pipeline volume, and completed activities
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
                  <tr>
                    <th className="py-2.5 px-5 font-medium">Representative</th>
                    <th className="py-2.5 px-5 font-medium text-right">Deals Won</th>
                    <th className="py-2.5 px-5 font-medium text-right">Revenue Won</th>
                    <th className="py-2.5 px-5 font-medium text-right">Active Pipeline</th>
                    <th className="py-2.5 px-5 font-medium text-right">Activities Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {analytics?.repPerformance?.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#FAF7F0] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={rep.name} src={rep.avatar} size="sm" />
                          <span className="font-semibold text-[#181A1F]">{rep.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-semibold font-mono tabular-nums text-[#181A1F]">
                        {rep.dealsWon}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold font-mono tabular-nums text-emerald-700">
                        ${rep.revenueWon.toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold font-mono tabular-nums text-[#B47200]">
                        ${rep.activePipeline.toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums text-[#66625A]">
                        {rep.activitiesCompleted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
