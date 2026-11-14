import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Company, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  companyToEdit?: Company | null;
  users: User[];
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  companyToEdit,
  users,
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState('10-50 employees');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerId, setOwnerId] = useState('');
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
    if (companyToEdit) {
      setName(companyToEdit.name);
      setIndustry(companyToEdit.industry);
      setWebsite(companyToEdit.website || '');
      setEmail(companyToEdit.email || '');
      setPhone(companyToEdit.phone || '');
      setSize(companyToEdit.size || '10-50 employees');
      setAddress(companyToEdit.address || '');
      setNotes(companyToEdit.notes || '');
      setOwnerId(companyToEdit.ownerId);
    } else {
      setName('');
      setIndustry('Enterprise Software');
      setWebsite('');
      setEmail('');
      setPhone('');
      setSize('50-100 employees');
      setAddress('');
      setNotes('');
      setOwnerId(users[0]?.id || '');
    }
    setError('');
  }, [companyToEdit, users, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !industry.trim()) {
      setError('Company name and industry are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        industry: industry.trim(),
        website: website.trim(),
        email: email.trim(),
        phone: phone.trim(),
        size,
        address: address.trim(),
        notes: notes.trim(),
        ownerId,
      };
      if (companyToEdit) {
        await api.updateCompany(companyToEdit.id, payload);
        toast.success(`Updated company "${name.trim()}"`);
      } else {
        await api.createCompany(payload);
        toast.success(`Added company "${name.trim()}"`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save company');
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
        className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-[#EAE4D7] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-semibold font-display text-[#181A1F]">
            {companyToEdit ? 'Edit Company' : 'Add New Company'}
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

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CloudScale Analytics"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Industry *</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Enterprise Software"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Company Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="1-10 employees">1-10 employees</option>
                <option value="10-50 employees">10-50 employees</option>
                <option value="50-100 employees">50-100 employees</option>
                <option value="100-250 employees">100-250 employees</option>
                <option value="250-500 employees">250-500 employees</option>
                <option value="500+ employees">500+ employees</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@company.com"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0199"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Account Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Headquarters Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="500 Howard St, San Francisco, CA"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Strategic initiatives, procurement notes..."
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
              {loading ? 'Saving...' : companyToEdit ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
