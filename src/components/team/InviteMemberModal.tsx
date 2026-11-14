import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvited,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('SALES_REP');
  const [title, setTitle] = useState('Account Executive');
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
    if (isOpen) {
      setName('');
      setEmail('');
      setRole('SALES_REP');
      setTitle('Account Executive');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    try {
      setLoading(true);
      await api.inviteTeamMember({
        name: name.trim(),
        email: email.trim(),
        role,
        title: title.trim() || 'Account Executive',
      });
      toast.success(`Invited ${name.trim()} to workspace`);
      onInvited();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to invite team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A1F]/45 backdrop-blur-[1px]"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#EAE4D7] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-semibold font-display text-[#181A1F]">
            Invite Team Member
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Work Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acme.io"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Account Executive"
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#181A1F] mb-1">
              Role & Permissions *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818]"
            >
              <option value="SALES_REP">Sales Representative (Deals, Leads, Activities)</option>
              <option value="ADMIN">Admin (Full CRM Data, Member Management, Reports)</option>
              {user?.role === 'OWNER' && (
                <option value="OWNER">Owner (Complete Workspace Control)</option>
              )}
            </select>
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
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
