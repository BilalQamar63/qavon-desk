import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Activity, ActivityType, User, Deal, Lead, Company } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  activityToEdit?: Activity | null;
  users: User[];
  deals: Deal[];
  leads: Lead[];
  companies: Company[];
  initialDealId?: string;
  initialCompanyId?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  activityToEdit,
  users,
  deals,
  leads,
  initialDealId,
  initialCompanyId,
}) => {
  const [type, setType] = useState<ActivityType>('CALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dealId, setDealId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [companyId, setCompanyId] = useState('');
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
    if (activityToEdit) {
      setType(activityToEdit.type);
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setDueDate(activityToEdit.dueDate ? activityToEdit.dueDate.substring(0, 16) : '');
      setAssignedToId(activityToEdit.assignedToId);
      setDealId(activityToEdit.dealId || '');
      setLeadId(activityToEdit.leadId || '');
      setCompanyId(activityToEdit.companyId || '');
    } else {
      setType('FOLLOW_UP');
      setTitle('');
      setDescription('');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setDueDate(tomorrow.toISOString().substring(0, 16));
      setAssignedToId(users[0]?.id || '');
      setDealId(initialDealId || '');
      setLeadId('');
      setCompanyId(initialCompanyId || '');
    }
    setError('');
  }, [activityToEdit, users, initialDealId, initialCompanyId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setError('Activity title and due date are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        assignedToId,
        dealId: dealId || undefined,
        leadId: leadId || undefined,
        companyId: companyId || undefined,
      };
      if (activityToEdit) {
        await api.updateActivity(activityToEdit.id, payload);
        toast.success(`Updated activity "${title.trim()}"`);
      } else {
        await api.createActivity(payload);
        toast.success(`Scheduled "${title.trim()}"`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save activity');
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
            {activityToEdit ? 'Edit Activity' : 'Schedule Activity'}
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
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Activity Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="CALL">Phone Call</option>
                <option value="MEETING">Meeting</option>
                <option value="EMAIL">Email Outreach</option>
                <option value="TASK">Task</option>
                <option value="FOLLOW_UP">Follow-up</option>
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
              Title & Subject *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Discuss Q2 pricing revision with CFO"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Associated Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="">No Deal Associated</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Associated Lead
              </label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="">No Lead Associated</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Detailed Agenda / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key talking points, meeting agenda, expectations..."
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
              {loading ? 'Scheduling...' : activityToEdit ? 'Save Changes' : 'Schedule Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
