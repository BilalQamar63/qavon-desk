import React, { useState } from 'react';
import {
  Search,
  Plus,
  Building2,
  ExternalLink,
  Mail,
  Edit,
  Trash2,
  MapPin,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import { Company, Contact, Deal, User } from '../../types/crm.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';
import { CompanyDetailDrawer } from './CompanyDetailDrawer.tsx';

function getSafeHttpUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

interface CompaniesViewProps {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  users: User[];
  onRefresh: () => void;
  onOpenNewCompanyModal: () => void;
  onEditCompany: (company: Company) => void;
  onSelectCompanyDeals: (companyId: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  deals,
  contacts,
  users,
  onRefresh,
  onOpenNewCompanyModal,
  onEditCompany,
  onSelectCompanyDeals,
}) => {
  const { canDeleteRecords } = useAuth();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyPendingDelete, setCompanyPendingDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const industries = Array.from(new Set(companies.map((c) => c.industry))).filter(Boolean);

  const filteredCompanies = companies.filter((c) => {
    if (industryFilter !== 'ALL' && c.industry !== industryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!companyPendingDelete) return;
    try {
      setDeleting(true);
      await api.deleteCompany(companyPendingDelete.id);
      toast.success(`Deleted "${companyPendingDelete.name}"`);
      setCompanyPendingDelete(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete company');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F0] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-[#EAE4D7] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
            <input
              type="text"
              placeholder="Search companies by name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818] focus:bg-white"
            />
          </div>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            aria-label="Filter by industry"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden md:inline text-xs text-[#66625A] font-mono tabular-nums">
            {filteredCompanies.length} accounts
          </span>

          <div className="flex items-center p-0.5 bg-[#EFEAE0] rounded-lg border border-[#EAE4D7] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewCompanyModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* 2. Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] py-14 px-6 text-center">
            <Building2 className="w-8 h-8 mx-auto text-[#D6CFC0] mb-2.5" />
            <p className="text-sm font-medium text-[#181A1F]">No companies match your search</p>
            <p className="text-xs text-[#66625A] mt-1">
              Clear your filters or add a new B2B organization to track deals and contacts.
            </p>
            <button
              type="button"
              onClick={onOpenNewCompanyModal}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Company</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => {
              const companyDeals = deals.filter((d) => d.companyId === company.id);
              const totalDealValue = companyDeals.reduce((sum, d) => sum + d.value, 0);
              const owner = users.find((u) => u.id === company.ownerId);

              return (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className="bg-white rounded-xl border border-[#EAE4D7] p-4 hover:border-[#F0A818]/70 transition-colors flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold font-display text-[#181A1F] truncate">
                          {company.name}
                        </h3>
                        <p className="text-xs text-[#66625A] truncate mt-0.5">
                          {company.industry}
                          {company.size ? ` · ${company.size}` : ''}
                        </p>
                      </div>

                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onEditCompany(company)}
                          aria-label={`Edit ${company.name}`}
                          className="p-1.5 text-[#66625A] hover:text-[#B47200] hover:bg-[#EFEAE0] rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteRecords && (
                          <button
                            type="button"
                            onClick={() => setCompanyPendingDelete(company)}
                            aria-label={`Delete ${company.name}`}
                            className="p-1.5 text-[#66625A] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-[#66625A]">
                      {(() => {
                        const safeWebsite = getSafeHttpUrl(company.website);
                        if (!safeWebsite) return null;
                        return (
                          <div
                            className="flex items-center gap-2 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <a
                              href={safeWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#B47200] hover:underline truncate"
                            >
                              {safeWebsite.replace(/^https?:\/\//i, '')}
                            </a>
                          </div>
                        );
                      })()}
                      {company.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{company.email}</span>
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-center gap-2 truncate text-[11px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE4D7] flex items-center justify-between text-xs">
                    <div onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-[#66625A] block">Pipeline</span>
                      <button
                        type="button"
                        onClick={() => onSelectCompanyDeals(company.id)}
                        className="font-semibold font-mono tabular-nums text-[#181A1F] hover:text-[#B47200] hover:underline"
                      >
                        {companyDeals.length} deals · ${totalDealValue.toLocaleString()}
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#66625A] block">Owner</span>
                      <span className="font-medium text-[#181A1F] truncate max-w-[120px] block">
                        {owner?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Company</th>
                    <th className="py-2.5 px-4 font-medium">Industry</th>
                    <th className="py-2.5 px-4 font-medium">Size</th>
                    <th className="py-2.5 px-4 font-medium">Owner</th>
                    <th className="py-2.5 px-4 font-medium text-right">Deals</th>
                    <th className="py-2.5 px-4 font-medium text-right">Pipeline Value</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {filteredCompanies.map((company) => {
                    const companyDeals = deals.filter((d) => d.companyId === company.id);
                    const totalDealValue = companyDeals.reduce((sum, d) => sum + d.value, 0);
                    const owner = users.find((u) => u.id === company.ownerId);
                    return (
                      <tr
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                        className="hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#181A1F]">{company.name}</p>
                          <p className="text-[11px] text-[#66625A]">
                            {company.website?.replace(/^https?:\/\//, '') || company.email}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-[#181A1F]">{company.industry}</td>
                        <td className="py-2.5 px-4 text-[#66625A]">{company.size || '—'}</td>
                        <td className="py-2.5 px-4 text-[#181A1F]">
                          {owner?.name || 'Unassigned'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#181A1F]">
                          {companyDeals.length}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold font-mono tabular-nums text-[#181A1F]">
                          ${totalDealValue.toLocaleString()}
                        </td>
                        <td
                          className="py-2.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditCompany(company)}
                              aria-label={`Edit ${company.name}`}
                              className="p-1.5 text-[#66625A] hover:text-[#B47200] hover:bg-[#EFEAE0] rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {canDeleteRecords && (
                              <button
                                type="button"
                                onClick={() => setCompanyPendingDelete(company)}
                                aria-label={`Delete ${company.name}`}
                                className="p-1.5 text-[#66625A] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CompanyDetailDrawer
        isOpen={Boolean(selectedCompany)}
        company={
          selectedCompany
            ? companies.find((c) => c.id === selectedCompany.id) || selectedCompany
            : null
        }
        deals={deals}
        contacts={contacts}
        users={users}
        onClose={() => setSelectedCompany(null)}
        onEdit={onEditCompany}
        onDeleted={onRefresh}
        onSelectCompanyDeals={onSelectCompanyDeals}
      />

      <ConfirmDialog
        isOpen={Boolean(companyPendingDelete)}
        title="Delete company?"
        description={
          companyPendingDelete
            ? `"${companyPendingDelete.name}" will be permanently removed. Associated deals and contacts may be impacted.`
            : ''
        }
        confirmLabel="Delete Company"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCompanyPendingDelete(null)}
      />
    </div>
  );
};
