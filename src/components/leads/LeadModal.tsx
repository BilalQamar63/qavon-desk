import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus, LeadSource, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  leadToEdit?: Lead | null;
  users: User[];
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  leadToEdit,
  users,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [source, setSource] = useState<LeadSource>('Website');
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [estimatedValue, setEstimatedValue] = useState(25000);
  const [assignedToId, setAssignedToId] = useState('');
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
    if (leadToEdit) {
      setFullName(leadToEdit.fullName);
      setEmail(leadToEdit.email);
      setPhone(leadToEdit.phone || '');
      setCompany(leadToEdit.company);
      setJobTitle(leadToEdit.jobTitle || '');
      setSource(leadToEdit.source);
      setStatus(leadToEdit.status);
      setEstimatedValue(leadToEdit.estimatedValue || 25000);
      setAssignedToId(leadToEdit.assignedToId);
      setNotes(leadToEdit.notes || '');
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setJobTitle('');
      setSource('Website');
      setStatus('NEW');
      setEstimatedValue(35000);
      setAssignedToId(users[0]?.id || '');
      setNotes('');
    }
    setError('');
  }, [leadToEdit, users, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !company.trim()) {
      setError('Full name, email, and company are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        source,
        status,
        estimatedValue: Number(estimatedValue),
        assignedToId,
        notes: notes.trim(),
      };
      if (leadToEdit) {
        await api.updateLead(leadToEdit.id, payload);
        toast.success(`Updated lead "${fullName.trim()}"`);
      } else {
        await api.createLead(payload);
        toast.success(`Added lead "${fullName.trim()}"`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save lead');
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
            {leadToEdit ? 'Edit Lead' : 'Add Inbound Lead'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 0192"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="VP of Operations"
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Est. Deal Value (USD)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="UNQUALIFIED">Unqualified</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="Website">Website</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Outbound">Outbound</option>
                <option value="Event">Event</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Assigned Rep</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
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
              Notes & Requirements
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Background notes, integration needs, timeline..."
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
              {loading ? 'Saving...' : leadToEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
