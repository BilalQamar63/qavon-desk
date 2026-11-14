import React, { useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Workspace } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

interface SettingsViewProps {
  workspace: Workspace | null;
  onRefresh: () => void;
}

const PIPELINE_STAGES = [
  { order: '01', name: 'New Opportunity', prob: 20 },
  { order: '02', name: 'Qualified', prob: 40 },
  { order: '03', name: 'Proposal Sent', prob: 65 },
  { order: '04', name: 'Negotiation', prob: 85 },
  { order: '05', name: 'Won', prob: 100 },
  { order: '06', name: 'Lost', prob: 0 },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ workspace, onRefresh }) => {
  const { canManageUsers, demoMode } = useAuth();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.exportWorkspaceData();
      toast.success('Exporting workspace JSON');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export workspace data');
    } finally {
      setExporting(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemoData();
      toast.success('Workspace database restored to default demo state.');
      setConfirmResetOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[#FAF7F0]">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7]">
        <h2 className="text-lg font-bold font-display text-[#181A1F]">Workspace Settings</h2>
        <p className="text-xs text-[#66625A] mt-0.5">
          Organization profile, pipeline stage probabilities, schema status, and data portability.
        </p>
      </div>

      {/* 2. Workspace Profile */}
      <div className="bg-white rounded-xl border border-[#EAE4D7] p-5 space-y-4">
        <h3 className="text-sm font-semibold font-display text-[#181A1F]">Workspace Profile</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#66625A] font-medium mb-1">Organization Name</label>
            <input
              type="text"
              readOnly
              value={workspace?.name || 'Acme Cloud Dynamics'}
              className="w-full px-3 py-2 border border-[#EAE4D7] bg-[#FAF7F0] rounded-lg text-[#181A1F] font-medium"
            />
          </div>

          <div>
            <label className="block text-[#66625A] font-medium mb-1">Workspace Slug</label>
            <input
              type="text"
              readOnly
              value={workspace?.slug || 'acme-corp'}
              className="w-full px-3 py-2 border border-[#EAE4D7] bg-[#FAF7F0] rounded-lg text-[#181A1F] font-mono"
            />
          </div>

          <div>
            <label className="block text-[#66625A] font-medium mb-1">Currency</label>
            <input
              type="text"
              readOnly
              value={`${workspace?.currency || 'USD'} ($)`}
              className="w-full px-3 py-2 border border-[#EAE4D7] bg-[#FAF7F0] rounded-lg text-[#181A1F] font-medium"
            />
          </div>

          <div>
            <label className="block text-[#66625A] font-medium mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value={workspace?.timezone || 'America/New_York'}
              className="w-full px-3 py-2 border border-[#EAE4D7] bg-[#FAF7F0] rounded-lg text-[#181A1F] font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Pipeline Stages Configuration */}
      <div className="bg-white rounded-xl border border-[#EAE4D7] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold font-display text-[#181A1F]">
            Deal Pipeline Stages
          </h3>
          <p className="text-xs text-[#66625A] mt-0.5">
            Default stage weights applied to weighted forecast calculations.
          </p>
        </div>

        <div className="border border-[#EAE4D7] rounded-xl divide-y divide-[#EAE4D7]">
          {PIPELINE_STAGES.map((st) => (
            <div
              key={st.order}
              className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono tabular-nums text-[#66625A]">{st.order}</span>
                <span className="font-medium text-[#181A1F]">{st.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-1.5 bg-[#EFEAE0] rounded-full overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full ${
                      st.prob === 100
                        ? 'bg-emerald-500'
                        : st.prob === 0
                        ? 'bg-rose-400'
                        : 'bg-[#F0A818]'
                    }`}
                    style={{ width: `${st.prob}%` }}
                  />
                </div>
                <span className="font-mono tabular-nums font-medium text-[#181A1F] w-12 text-right">
                  {st.prob}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Data Architecture & Prisma ORM */}
      <div className="bg-white rounded-xl border border-[#EAE4D7] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold font-display text-[#181A1F]">
              PostgreSQL & Prisma ORM Schema
            </h3>
            <p className="text-xs text-[#66625A] mt-0.5">
              Relational schema defined in{' '}
              <code className="font-mono text-[#181A1F] bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#EAE4D7]">
                prisma/schema.prisma
              </code>{' '}
              with workspace isolation and cascade deletes.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700">Prisma v6 Client Ready</span>
        </div>

        <div className="border-y border-[#EAE4D7] py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-[#EAE4D7] text-xs">
          <div className="sm:pr-4">
            <span className="text-[11px] text-[#66625A] block">Schema Models</span>
            <span className="font-semibold text-[#181A1F] font-mono tabular-nums mt-0.5 block">
              9 Models
            </span>
          </div>
          <div className="sm:px-4">
            <span className="text-[11px] text-[#66625A] block">Workspace Scoping</span>
            <span className="font-semibold text-emerald-700 mt-0.5 block">Enforced</span>
          </div>
          <div className="sm:px-4">
            <span className="text-[11px] text-[#66625A] block">Foreign Key Cascades</span>
            <span className="font-semibold text-[#181A1F] mt-0.5 block">Configured</span>
          </div>
          <div className="sm:pl-4">
            <span className="text-[11px] text-[#66625A] block">Seed Script</span>
            <span className="font-semibold font-mono text-[#181A1F] mt-0.5 block">
              prisma/seed.ts
            </span>
          </div>
        </div>

        <dl className="space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-[#66625A]">Database Engine</dt>
            <dd className="font-mono text-[#181A1F]">PostgreSQL / Relational Store</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-[#66625A]">Connection Pooler</dt>
            <dd className="font-mono text-[#181A1F]">DATABASE_URL (PgBouncer)</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-[#66625A]">Migration Command</dt>
            <dd className="font-mono text-[#181A1F]">prisma migrate deploy</dd>
          </div>
        </dl>
      </div>

      {/* 5. Data Portability & Reset */}
      {canManageUsers ? (
        <div className="bg-white rounded-xl border border-[#EAE4D7] divide-y divide-[#EAE4D7] overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-[#181A1F]">Export Workspace Data</h4>
              <p className="text-xs text-[#66625A] mt-0.5">
                Download all leads, companies, contacts, deals, and activities as structured JSON.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="px-3.5 py-2 text-xs font-medium text-[#181A1F] bg-white hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#66625A]" />
              <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>

          {demoMode && (
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold text-rose-800">Reset Demo Database</h4>
                <p className="text-xs text-[#66625A] mt-0.5">
                  Restore the baseline dataset of 18 deals, 14 leads, 8 companies, and 14 activities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                disabled={resetting}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EAE4D7] p-5">
          <h4 className="text-xs font-semibold text-[#181A1F]">Data Portability & Reset</h4>
          <p className="text-xs text-[#66625A] mt-0.5">
            Workspace export and database administration require an Owner or Admin role.
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset workspace to demo data?"
        description="This restores the default 18 deals, 14 leads, 8 companies, and 14 activities. Any custom edits made during this session will be replaced."
        confirmLabel="Reset Demo Data"
        variant="danger"
        loading={resetting}
        onConfirm={handleResetDemo}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
