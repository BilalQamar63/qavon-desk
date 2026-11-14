import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  User,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  CalendarPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Deal, DealStage } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../shared/Avatar.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

interface DealDetailDrawerProps {
  deal:
    | (Deal & {
        companyName?: string;
        ownerName?: string;
        ownerAvatar?: string;
        contactName?: string;
      })
    | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
  onDeleted: () => void;
  onStageChanged: () => void;
  onScheduleActivity: (dealId: string, companyId: string) => void;
}

const STAGES: Array<{ id: DealStage; label: string }> = [
  { id: 'NEW_OPPORTUNITY', label: 'New Opportunity' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { id: 'NEGOTIATION', label: 'Negotiation' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' },
];

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
  onStageChanged,
  onScheduleActivity,
}) => {
  const { canDeleteRecords } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDeleteOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, confirmDeleteOpen, onClose]);

  if (!isOpen || !deal) return null;

  const handleStageChange = async (newStage: DealStage) => {
    try {
      setUpdating(true);
      await api.updateDealStage(deal.id, newStage);
      const label = STAGES.find((s) => s.id === newStage)?.label || newStage;
      toast.success(`Stage updated to ${label}`);
      onStageChanged();
    } catch {
      toast.error('Failed to update deal stage');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUpdating(true);
      await api.deleteDeal(deal.id);
      toast.success(`Deleted "${deal.title}"`);
      setConfirmDeleteOpen(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete deal');
    } finally {
      setUpdating(false);
    }
  };

  const priorityLabel =
    deal.priority === 'HIGH'
      ? { text: 'High priority', cls: 'text-rose-700 font-semibold' }
      : deal.priority === 'MEDIUM'
      ? { text: 'Medium priority', cls: 'text-amber-700 font-semibold' }
      : { text: 'Low priority', cls: 'text-[#66625A] font-medium' };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-[#181A1F]/40 backdrop-blur-[1px] flex justify-end"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#EAE4D7] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Opportunity Details"
        >
          {/* Drawer header */}
          <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#B47200]">Opportunity overview</p>
              <h2 className="text-base font-semibold font-display text-[#181A1F] truncate mt-0.5">
                {deal.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 text-[#66625A] hover:text-[#181A1F] rounded-md hover:bg-[#FAF7F0] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Value & Probability Strip */}
            <div className="p-4 bg-[#FAF7F0] border border-[#EAE4D7] rounded-xl grid grid-cols-2 divide-x divide-[#EAE4D7]">
              <div className="pr-4">
                <p className="text-xs text-[#66625A]">Opportunity Value</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1">
                  ${deal.value.toLocaleString()}
                </p>
              </div>
              <div className="pl-4">
                <p className="text-xs text-[#66625A]">Win Probability</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-[#B47200] mt-1">
                  {deal.probability}%
                </p>
                <p className="text-[11px] font-mono tabular-nums text-[#66625A] mt-0.5">
                  ${Math.round((deal.value * deal.probability) / 100).toLocaleString()} weighted
                </p>
              </div>
            </div>

            {/* Pipeline Stage Switcher */}
            <div>
              <label className="block text-xs font-semibold text-[#181A1F] mb-2">
                Pipeline Stage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {STAGES.map((st) => {
                  const isCurrent = deal.stage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStageChange(st.id)}
                      className={`py-2 px-2.5 text-xs rounded-lg text-left transition-colors border ${
                        isCurrent
                          ? 'border-[#F0A818] bg-[#FEF6E2] text-[#B47200] font-semibold'
                          : 'border-[#EAE4D7] bg-white text-[#181A1F] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <span className="truncate block">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metadata List */}
            <div className="border border-[#EAE4D7] rounded-xl divide-y divide-[#EAE4D7] bg-white text-xs">
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Company</span>
                </span>
                <span className="font-semibold text-[#181A1F] text-right">
                  {deal.companyName || 'Unknown Company'}
                </span>
              </div>

              {deal.contactName && (
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[#66625A] flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span>Primary Contact</span>
                  </span>
                  <span className="font-medium text-[#181A1F] text-right">{deal.contactName}</span>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <User className="w-4 h-4 shrink-0" />
                  <span>Deal Owner</span>
                </span>
                <div className="flex items-center gap-2">
                  <Avatar name={deal.ownerName} src={deal.ownerAvatar} size="xs" />
                  <span className="font-medium text-[#181A1F]">
                    {deal.ownerName || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Target Close Date</span>
                </span>
                <span className="font-mono tabular-nums text-[#181A1F]">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString()
                    : 'Not set'}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Last Activity</span>
                </span>
                <span className="font-mono tabular-nums text-[#66625A]">
                  {deal.lastActivityAt
                    ? new Date(deal.lastActivityAt).toLocaleDateString()
                    : 'None'}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A]">Priority</span>
                <span className={priorityLabel.cls}>{priorityLabel.text}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-semibold text-[#181A1F] mb-2">Deal Notes & Scope</h3>
              <div className="p-3.5 bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-xs text-[#181A1F] leading-relaxed min-h-[72px]">
                {deal.description || 'No additional notes provided for this opportunity.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onScheduleActivity(deal.id, deal.companyId)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#B47200] bg-[#FEF6E2] hover:bg-[#FDECC2] border border-[#F0A818]/25 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule Follow-up Activity</span>
            </button>
          </div>

          {/* Drawer footer */}
          <div className="px-6 py-4 border-t border-[#EAE4D7] bg-[#FAF7F0] flex items-center justify-between gap-3">
            {canDeleteRecords ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={updating}
                className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <span className="text-[11px] text-[#66625A]">Admin or Owner role required to delete</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-[#181A1F] bg-white hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(deal);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete opportunity?"
        description={`"${deal.title}" will be permanently removed from your pipeline.`}
        confirmLabel="Delete Opportunity"
        loading={updating}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};
