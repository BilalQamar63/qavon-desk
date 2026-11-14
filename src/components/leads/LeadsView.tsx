import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  ArrowUpDown,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus, User } from '../../types/crm.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { Avatar } from '../shared/Avatar.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';
import { LeadDetailDrawer } from './LeadDetailDrawer.tsx';

interface LeadsViewProps {
  leads: Lead[];
  users: User[];
  onRefresh: () => void;
  onOpenNewLeadModal: () => void;
  onEditLead: (lead: Lead) => void;
  onConvertLead: (lead: Lead) => void;
}

const STATUS_DISPLAY: Record<LeadStatus, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'text-[#B47200] font-medium' },
  CONTACTED: { label: 'Contacted', className: 'text-blue-700 font-medium' },
  QUALIFIED: { label: 'Qualified', className: 'text-emerald-700 font-semibold' },
  UNQUALIFIED: { label: 'Unqualified', className: 'text-[#66625A]' },
};

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  users,
  onRefresh,
  onOpenNewLeadModal,
  onEditLead,
  onConvertLead,
}) => {
  const { canDeleteRecords } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_desc'>('newest');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPendingDelete, setLeadPendingDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
      if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          lead.fullName.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          (lead.jobTitle && lead.jobTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'value_desc') return (b.estimatedValue || 0) - (a.estimatedValue || 0);
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
    });
  }, [leads, search, statusFilter, sourceFilter, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!leadPendingDelete) return;
    try {
      setDeleting(true);
      await api.deleteLead(leadPendingDelete.id);
      toast.success(`Deleted lead "${leadPendingDelete.fullName}"`);
      setLeadPendingDelete(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const totalEstimatedValue = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F0] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-[#EAE4D7] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
            <input
              type="text"
              placeholder="Search leads, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818] focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by source"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Referral">Referral</option>
            <option value="Outbound">Outbound</option>
            <option value="Event">Event</option>
            <option value="Partner">Partner</option>
          </select>

          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#66625A]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort leads"
              className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
            >
              <option value="newest">Created: Newest</option>
              <option value="oldest">Created: Oldest</option>
              <option value="value_desc">Est. Value: Highest</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#66625A]">
            <span>{filteredLeads.length} leads</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold font-mono tabular-nums text-[#181A1F]">
              ${totalEstimatedValue.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Leads Data Table */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Lead Contact</th>
                  <th className="py-2.5 px-4 font-medium">Company</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Source</th>
                  <th className="py-2.5 px-4 font-medium">Assigned Rep</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                  <th className="py-2.5 px-4 font-medium text-right">Est. Value</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Users className="w-7 h-7 mx-auto text-[#D6CFC0] mb-2" />
                      <p className="text-sm font-medium text-[#181A1F]">No leads match your filters</p>
                      <p className="text-xs text-[#66625A] mt-1">
                        Reset your filters or add a new inbound lead to begin qualification.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewLeadModal}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lead</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const assignedUser = users.find((u) => u.id === lead.assignedToId);
                    const statusMeta = STATUS_DISPLAY[lead.status] || STATUS_DISPLAY.NEW;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#181A1F]">{lead.fullName}</p>
                          <p className="text-[11px] text-[#66625A] truncate max-w-[190px]">
                            {lead.email}
                          </p>
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-[#181A1F]">{lead.company}</p>
                          <p className="text-[11px] text-[#66625A]">
                            {lead.jobTitle || 'Executive'}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={statusMeta.className}>{statusMeta.label}</span>
                        </td>
                        <td className="py-2.5 px-4 text-[#66625A] whitespace-nowrap">
                          {lead.source}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Avatar name={assignedUser?.name} src={assignedUser?.avatar} size="xs" />
                            <span className="text-[#181A1F]">
                              {assignedUser?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-[#66625A] whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold font-mono tabular-nums text-[#181A1F] whitespace-nowrap">
                          ${(lead.estimatedValue || 0).toLocaleString()}
                        </td>
                        <td
                          className="py-2.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onConvertLead(lead)}
                              title="Convert to Deal"
                              className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 border border-[#EAE4D7] hover:border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditLead(lead)}
                              title="Edit Lead"
                              aria-label={`Edit ${lead.fullName}`}
                              className="p-1.5 text-[#66625A] hover:text-[#B47200] hover:bg-[#EFEAE0] rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {canDeleteRecords && (
                              <button
                                type="button"
                                onClick={() => setLeadPendingDelete(lead)}
                                title="Delete Lead"
                                aria-label={`Delete ${lead.fullName}`}
                                className="p-1.5 text-[#66625A] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LeadDetailDrawer
        isOpen={Boolean(selectedLead)}
        lead={
          selectedLead ? leads.find((l) => l.id === selectedLead.id) || selectedLead : null
        }
        users={users}
        onClose={() => setSelectedLead(null)}
        onEdit={onEditLead}
        onConvert={onConvertLead}
        onUpdated={onRefresh}
      />

      <ConfirmDialog
        isOpen={Boolean(leadPendingDelete)}
        title="Delete lead?"
        description={
          leadPendingDelete
            ? `"${leadPendingDelete.fullName}" from ${leadPendingDelete.company} will be permanently removed.`
            : ''
        }
        confirmLabel="Delete Lead"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setLeadPendingDelete(null)}
      />
    </div>
  );
};
