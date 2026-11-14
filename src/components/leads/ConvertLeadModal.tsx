import React, { useState, useEffect } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import { Lead, DealStage, DealPriority, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConverted: () => void;
  lead: Lead | null;
  users: User[];
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  onConverted,
  lead,
  users,
}) => {
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(25000);
  const [stage, setStage] = useState<DealStage>('QUALIFIED');
  const [probability, setProbability] = useState(40);
  const [ownerId, setOwnerId] = useState('');
  const [priority] = useState<DealPriority>('MEDIUM');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
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
    if (lead) {
      setDealTitle(`${lead.company} - Platform License`);
      setDealValue(lead.estimatedValue || 35000);
      setStage('QUALIFIED');
      setProbability(40);
      setOwnerId(lead.assignedToId || users[0]?.id || '');
      const closeDate = new Date();
      closeDate.setDate(closeDate.getDate() + 30);
      setExpectedCloseDate(closeDate.toISOString().split('T')[0]);
    }
    setError('');
  }, [lead, users, isOpen]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setLoading(true);
      await api.convertLeadToDeal(lead.id, {
        title: dealTitle.trim(),
        value: Number(dealValue),
        stage,
        probability: Number(probability),
        expectedCloseDate,
        ownerId,
        priority,
        description: `Converted from lead ${lead.fullName}. Email: ${lead.email}, Phone: ${lead.phone || 'N/A'}. Notes: ${lead.notes || 'None'}`,
      });
      onConverted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to convert lead into deal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/45 backdrop-blur-[1px]"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-[#EAE4D7] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold font-display text-[#181A1F]">
              Convert Lead to Opportunity
            </h2>
            <p className="text-xs text-[#66625A] mt-0.5">
              Creates a linked company, contact, and active pipeline opportunity
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#66625A] hover:text-[#181A1F] hover:bg-[#EFEAE0] rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lead Summary */}
          <div className="p-3.5 bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-[#66625A]">Lead Contact</span>
              <span className="font-semibold text-[#181A1F]">{lead.fullName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#66625A]">Company</span>
              <span className="font-semibold text-[#181A1F]">{lead.company}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#66625A]">Email</span>
              <span className="text-[#181A1F]">{lead.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Opportunity Title *
            </label>
            <input
              type="text"
              required
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Deal Value (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Target Close Date *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Starting Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
              >
                <option value="NEW_OPPORTUNITY">New Opportunity</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#181A1F] mb-1">
                Assigned Owner
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{loading ? 'Converting...' : 'Convert to Opportunity'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
