import React, { useState } from 'react';
import {
  Search,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Contact2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Contact, Company } from '../../types/crm.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { Avatar } from '../shared/Avatar.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

interface ContactsViewProps {
  contacts: Contact[];
  companies: Company[];
  onRefresh: () => void;
  onOpenNewContactModal: () => void;
  onEditContact: (contact: Contact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  companies,
  onRefresh,
  onOpenNewContactModal,
  onEditContact,
}) => {
  const { canDeleteRecords } = useAuth();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [contactPendingDelete, setContactPendingDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    if (companyFilter !== 'ALL' && c.companyId !== companyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const company = companies.find((comp) => comp.id === c.companyId);
      return (
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q)) ||
        (company && company.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!contactPendingDelete) return;
    const fullName = `${contactPendingDelete.firstName} ${contactPendingDelete.lastName}`;
    try {
      setDeleting(true);
      await api.deleteContact(contactPendingDelete.id);
      toast.success(`Deleted contact "${fullName}"`);
      setContactPendingDelete(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete contact');
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
              placeholder="Search contacts by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818] focus:bg-white"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            aria-label="Filter by company"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline text-xs text-[#66625A] font-mono tabular-nums">
            {filteredContacts.length} contacts
          </span>

          <button
            type="button"
            onClick={onOpenNewContactModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* 2. Contacts Table */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Contact</th>
                  <th className="py-2.5 px-4 font-medium">Job Title</th>
                  <th className="py-2.5 px-4 font-medium">Company</th>
                  <th className="py-2.5 px-4 font-medium">Email</th>
                  <th className="py-2.5 px-4 font-medium">Phone</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Contact2 className="w-7 h-7 mx-auto text-[#D6CFC0] mb-2" />
                      <p className="text-sm font-medium text-[#181A1F]">
                        No contacts match your filters
                      </p>
                      <p className="text-xs text-[#66625A] mt-1">
                        Reset your search or add a key decision maker to an account.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewContactModal}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Contact</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => {
                    const company = companies.find((c) => c.id === contact.companyId);
                    const fullName = `${contact.firstName} ${contact.lastName}`;
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => onEditContact(contact)}
                        className="hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={fullName} size="sm" />
                            <span className="font-semibold text-[#181A1F]">{fullName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#181A1F]">
                          {contact.jobTitle || 'Executive'}
                        </td>
                        <td className="py-2.5 px-4 text-[#B47200] font-medium">
                          {company?.name || 'Unlinked'}
                        </td>
                        <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[#66625A] hover:text-[#B47200] hover:underline inline-flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>{contact.email}</span>
                          </a>
                        </td>
                        <td
                          className="py-2.5 px-4 text-[#66625A] whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="hover:text-[#181A1F] inline-flex items-center gap-1.5 font-mono tabular-nums"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>{contact.phone}</span>
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td
                          className="py-2.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditContact(contact)}
                              aria-label={`Edit ${fullName}`}
                              className="p-1.5 text-[#66625A] hover:text-[#B47200] hover:bg-[#EFEAE0] rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {canDeleteRecords && (
                              <button
                                type="button"
                                onClick={() => setContactPendingDelete(contact)}
                                aria-label={`Delete ${fullName}`}
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

      <ConfirmDialog
        isOpen={Boolean(contactPendingDelete)}
        title="Delete contact?"
        description={
          contactPendingDelete
            ? `"${contactPendingDelete.firstName} ${contactPendingDelete.lastName}" will be permanently deleted.`
            : ''
        }
        confirmLabel="Delete Contact"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setContactPendingDelete(null)}
      />
    </div>
  );
};
