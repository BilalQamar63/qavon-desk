import React, { useEffect, useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  ArrowRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../shared/Avatar.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onUpdated: () => void;
}

const LEAD_STATUSES: Array<{ id: LeadStatus; label: string }> = [
  { id: 'NEW', label: 'New' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'UNQUALIFIED', label: 'Unqualified' },
];

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  users,
  isOpen,
  onClose,
  onEdit,
  onConvert,
  onUpdated,
}) => {
  const { canDeleteRecords } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDeleteOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, confirmDeleteOpen, onClose]);

  if (!isOpen || !lead) return null;

  const assignedUser = users.find((u) => u.id === lead.assignedToId);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (lead.status === newStatus) return;
    try {
      setUpdating(true);
      await api.updateLead(lead.id, { status: newStatus });
      toast.success(`Lead status updated to ${LEAD_STATUSES.find((s) => s.id === newStatus)?.label}`);
      onUpdated();
    } catch {
      toast.error('Failed to update lead status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUpdating(true);
      await api.deleteLead(lead.id);
      toast.success(`Deleted lead "${lead.fullName}"`);
      setConfirmDeleteOpen(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete lead');
    } finally {
      setUpdating(false);
    }
  };

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
          aria-label="Lead Details"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#B47200]">Lead profile</p>
              <h2 className="text-base font-semibold font-display text-[#181A1F] truncate mt-0.5">
                {lead.fullName}
              </h2>
              <p className="text-xs text-[#66625A] truncate">
                {lead.jobTitle ? `${lead.jobTitle} · ` : ''}
                {lead.company}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 text-[#66625A] hover:text-[#181A1F] rounded-md hover:bg-[#EFEAE0] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Value & Source Summary */}
            <div className="p-4 bg-[#FAF7F0] border border-[#EAE4D7] rounded-xl grid grid-cols-2 divide-x divide-[#EAE4D7]">
              <div className="pr-4">
                <p className="text-xs text-[#66625A]">Estimated Deal Value</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1">
                  ${(lead.estimatedValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="pl-4">
                <p className="text-xs text-[#66625A]">Acquisition Source</p>
                <p className="text-base font-semibold text-[#181A1F] mt-1.5">{lead.source}</p>
              </div>
            </div>

            {/* Qualification Status Switcher */}
            <div>
              <label className="block text-xs font-semibold text-[#181A1F] mb-2">
                Qualification Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LEAD_STATUSES.map((st) => {
                  const active = lead.status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(st.id)}
                      className={`py-2 px-2.5 text-xs rounded-lg text-center transition-colors border ${
                        active
                          ? 'border-[#F0A818] bg-[#FEF6E2] text-[#B47200] font-semibold'
                          : 'border-[#EAE4D7] bg-white text-[#181A1F] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Details */}
            <div className="border border-[#EAE4D7] rounded-xl divide-y divide-[#EAE4D7] bg-white text-xs">
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Company</span>
                </span>
                <span className="font-semibold text-[#181A1F]">{lead.company}</span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Email</span>
                </span>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-medium text-[#B47200] hover:underline truncate"
                >
                  {lead.email}
                </a>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>Phone</span>
                </span>
                <span className="font-mono tabular-nums text-[#181A1F]">
                  {lead.phone || 'Not provided'}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Assigned Rep</span>
                </span>
                <div className="flex items-center gap-2">
                  <Avatar name={assignedUser?.name} src={assignedUser?.avatar} size="xs" />
                  <span className="font-medium text-[#181A1F]">
                    {assignedUser?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Created</span>
                </span>
                <span className="font-mono tabular-nums text-[#66625A]">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-semibold text-[#181A1F] mb-2">Qualification Notes</h3>
              <div className="p-3.5 bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-xs text-[#181A1F] leading-relaxed min-h-[72px]">
                {lead.notes || 'No qualification notes recorded yet.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConvert(lead);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Convert Lead into Opportunity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#EAE4D7] bg-[#FAF7F0] flex items-center justify-between gap-3">
            {canDeleteRecords ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={updating}
                className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
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
                  onEdit(lead);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Lead</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete lead?"
        description={`"${lead.fullName}" from ${lead.company} will be permanently deleted.`}
        confirmLabel="Delete Lead"
        loading={updating}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};
