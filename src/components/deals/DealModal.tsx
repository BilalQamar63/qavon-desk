import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Deal, DealStage, DealPriority, Company, Contact, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  dealToEdit?: Deal | null;
  companies: Company[];
  users: User[];
}

export const DealModal: React.FC<DealModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  dealToEdit,
  companies,
  users,
}) => {
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [value, setValue] = useState(25000);
  const [stage, setStage] = useState<DealStage>('NEW_OPPORTUNITY');
  const [probability, setProbability] = useState(20);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [priority, setPriority] = useState<DealPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
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
    if (dealToEdit) {
      setTitle(dealToEdit.title);
      setCompanyId(dealToEdit.companyId);
      setContactId(dealToEdit.contactId || '');
      setValue(dealToEdit.value);
      setStage(dealToEdit.stage);
      setProbability(dealToEdit.probability);
      setExpectedCloseDate(
        dealToEdit.expectedCloseDate ? dealToEdit.expectedCloseDate.split('T')[0] : ''
      );
      setOwnerId(dealToEdit.ownerId);
      setPriority(dealToEdit.priority);
      setDescription(dealToEdit.description || '');
    } else {
      setTitle('');
      setCompanyId(companies[0]?.id || '');
      setContactId('');
      setValue(35000);
      setStage('NEW_OPPORTUNITY');
      setProbability(20);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setExpectedCloseDate(defaultDate.toISOString().split('T')[0]);
      setOwnerId(users[0]?.id || '');
      setPriority('MEDIUM');
      setDescription('');
    }
    setError('');
  }, [dealToEdit, companies, users, isOpen]);

  useEffect(() => {
    if (companyId) {
      api
        .getContacts({ companyId })
        .then((data) => {
          setContacts(data);
          setContactId((prev) => {
            if (prev && data.some((c) => c.id === prev)) return prev;
            return !dealToEdit && data.length > 0 ? data[0].id : '';
          });
        })
        .catch(console.error);
    } else {
      setContacts([]);
      setContactId('');
    }
  }, [companyId, dealToEdit]);

  const handleStageChange = (newStage: DealStage) => {
    setStage(newStage);
    const probMap: Record<DealStage, number> = {
      NEW_OPPORTUNITY: 20,
      QUALIFIED: 40,
      PROPOSAL_SENT: 65,
      NEGOTIATION: 85,
      WON: 100,
      LOST: 0,
    };
    setProbability(probMap[newStage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Deal title is required.');
      return;
    }
    if (!companyId) {
      setError('Please select a company.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        companyId,
        contactId: contactId || undefined,
        value: Number(value),
        stage,
        probability: Number(probability),
        expectedCloseDate,
        ownerId,
        priority,
        description: description.trim(),
      };
      if (dealToEdit) {
        await api.updateDeal(dealToEdit.id, payload);
        toast.success(`Updated "${title.trim()}"`);
      } else {
        await api.createDeal(payload);
        toast.success(`Created opportunity "${title.trim()}"`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save deal');
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
        className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-[#EAE4D7] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold font-display text-[#181A1F]">
              {dealToEdit ? 'Edit Opportunity' : 'Create Opportunity'}
            </h2>
            <p className="text-xs text-[#66625A] mt-0.5">
              {dealToEdit
                ? 'Update stage, value, or close projection'
                : 'Add a new opportunity to your sales pipeline'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#66625A] hover:text-[#181A1F] rounded-md hover:bg-[#FAF7F0]"
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
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Enterprise Platform License Renewal"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Associated Company *
              </label>
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

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Primary Contact
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="">No Contact Assigned</option>
                {contacts.map((cnt) => (
                  <option key={cnt.id} value={cnt.id}>
                    {cnt.firstName} {cnt.lastName} ({cnt.jobTitle || 'Executive'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Deal Value (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#66625A] font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Expected Close Date *
              </label>
              <input
                type="date"
                required
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value as DealStage)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="NEW_OPPORTUNITY">New Opportunity</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won (Closed)</option>
                <option value="LOST">Lost (Closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DealPriority)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Assigned Sales Owner
            </label>
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

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Description & Deal Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key business pain points, competitor context, and next steps..."
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
              {loading ? 'Saving...' : dealToEdit ? 'Save Changes' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
