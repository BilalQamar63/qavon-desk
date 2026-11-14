import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Contact, Company } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  contactToEdit?: Contact | null;
  companies: Company[];
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  contactToEdit,
  companies,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, loading, onClose]);

  useEffect(() => {
    if (contactToEdit) {
      setFirstName(contactToEdit.firstName);
      setLastName(contactToEdit.lastName);
      setEmail(contactToEdit.email);
      setPhone(contactToEdit.phone || '');
      setCompanyId(contactToEdit.companyId);
      setJobTitle(contactToEdit.jobTitle || '');
      setNotes(contactToEdit.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompanyId(companies[0]?.id || '');
      setJobTitle('');
      setNotes('');
    }
    setError('');
  }, [contactToEdit, companies, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !companyId) {
      setError('First name, last name, email, and company are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyId,
        jobTitle: jobTitle.trim(),
        notes: notes.trim(),
      };
      if (contactToEdit) {
        await api.updateContact(contactToEdit.id, payload);
        toast.success(`Updated contact "${firstName.trim()} ${lastName.trim()}"`);
      } else {
        await api.createContact(payload);
        toast.success(`Added contact "${firstName.trim()} ${lastName.trim()}"`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/45 backdrop-blur-[1px]"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#EAE4D7] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-semibold font-display text-[#181A1F]">
            {contactToEdit ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#66625A] hover:text-[#181A1F] hover:bg-[#EFEAE0] rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marcus"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Chen"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Company *</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@company.com"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0199"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Chief Technology Officer"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Background information, decision authority..."
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#181A1F] bg-white hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Saving...' : contactToEdit ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
