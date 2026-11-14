import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Users,
  Edit3,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Company, Deal, Contact, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../shared/Avatar.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

function getSafeHttpUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

interface CompanyDetailDrawerProps {
  company: Company | null;
  deals: Deal[];
  contacts: Contact[];
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (company: Company) => void;
  onDeleted: () => void;
  onSelectCompanyDeals: (companyId: string) => void;
}

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({
  company,
  deals,
  contacts,
  users,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
  onSelectCompanyDeals,
}) => {
  const { canDeleteRecords } = useAuth();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDeleteOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, confirmDeleteOpen, onClose]);

  if (!isOpen || !company) return null;

  const companyDeals = deals.filter((d) => d.companyId === company.id);
  const companyContacts = contacts.filter((c) => c.companyId === company.id);
  const owner = users.find((u) => u.id === company.ownerId);
  const totalDealValue = companyDeals.reduce((sum, d) => sum + d.value, 0);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.deleteCompany(company.id);
      toast.success(`Deleted company "${company.name}"`);
      setConfirmDeleteOpen(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete company');
    } finally {
      setDeleting(false);
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
          aria-label="Company Details"
        >
          <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#B47200]">Account profile</p>
              <h2 className="text-base font-semibold font-display text-[#181A1F] truncate mt-0.5">
                {company.name}
              </h2>
              <p className="text-xs text-[#66625A] truncate">
                {company.industry}
                {company.size ? ` · ${company.size}` : ''}
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Pipeline summary */}
            <div className="p-4 bg-[#FAF7F0] border border-[#EAE4D7] rounded-xl grid grid-cols-2 divide-x divide-[#EAE4D7]">
              <div className="pr-4">
                <p className="text-xs text-[#66625A]">Total Deal Value</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1">
                  ${totalDealValue.toLocaleString()}
                </p>
              </div>
              <div className="pl-4 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-[#66625A]">Associated Opportunities</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#181A1F] mt-1">
                    {companyDeals.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div className="border border-[#EAE4D7] rounded-xl divide-y divide-[#EAE4D7] bg-white text-xs">
              {(() => {
                const safeWebsite = getSafeHttpUrl(company.website);
                if (!safeWebsite) return null;
                return (
                  <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-[#66625A] flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>Website</span>
                    </span>
                    <a
                      href={safeWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#B47200] hover:underline truncate"
                    >
                      {safeWebsite.replace(/^https?:\/\//i, '')}
                    </a>
                  </div>
                );
              })()}

              {company.email && (
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[#66625A] flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Email</span>
                  </span>
                  <a
                    href={`mailto:${company.email}`}
                    className="font-medium text-[#181A1F] hover:text-[#B47200] truncate"
                  >
                    {company.email}
                  </a>
                </div>
              )}

              {company.phone && (
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[#66625A] flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Phone</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#181A1F]">{company.phone}</span>
                </div>
              )}

              {company.address && (
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <span className="text-[#66625A] flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Headquarters</span>
                  </span>
                  <span className="text-[#181A1F] text-right">{company.address}</span>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-[#66625A] flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Account Owner</span>
                </span>
                <div className="flex items-center gap-2">
                  <Avatar name={owner?.name} src={owner?.avatar} size="xs" />
                  <span className="font-medium text-[#181A1F]">
                    {owner?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            <div>
              <h3 className="text-xs font-semibold text-[#181A1F] mb-2">
                Contacts ({companyContacts.length})
              </h3>
              {companyContacts.length === 0 ? (
                <p className="text-xs text-[#66625A] p-3.5 bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg">
                  No contacts linked to this account yet.
                </p>
              ) : (
                <div className="border border-[#EAE4D7] rounded-xl divide-y divide-[#EAE4D7] bg-white">
                  {companyContacts.map((cnt) => (
                    <div key={cnt.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={`${cnt.firstName} ${cnt.lastName}`} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-[#181A1F] truncate">
                            {cnt.firstName} {cnt.lastName}
                          </p>
                          <p className="text-[11px] text-[#66625A] truncate">
                            {cnt.jobTitle || 'Executive'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`mailto:${cnt.email}`}
                        className="text-[11px] text-[#B47200] hover:underline truncate max-w-[160px]"
                      >
                        {cnt.email}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-semibold text-[#181A1F] mb-2">Account Notes</h3>
              <div className="p-3.5 bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-xs text-[#181A1F] leading-relaxed min-h-[64px]">
                {company.notes || 'No strategic account notes recorded.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCompanyDeals(company.id);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#B47200] bg-[#FEF6E2] hover:bg-[#FDECC2] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Filter Pipeline Deals for {company.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-4 border-t border-[#EAE4D7] bg-[#FAF7F0] flex items-center justify-between gap-3">
            {canDeleteRecords ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleting}
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
                  onEdit(company);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete company?"
        description={`"${company.name}" will be permanently removed. Associated deals and contacts may be impacted.`}
        confirmLabel="Delete Company"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};
