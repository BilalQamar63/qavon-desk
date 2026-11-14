import React, { useState } from 'react';
import { Plus, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { User, Workspace } from '../../types/crm.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { InviteMemberModal } from './InviteMemberModal.tsx';
import { Avatar } from '../shared/Avatar.tsx';

interface TeamViewProps {
  users: User[];
  workspace: Workspace | null;
  onRefresh: () => void;
}

const ROLE_TEXT: Record<string, { label: string; className: string }> = {
  OWNER: { label: 'Owner', className: 'text-[#B47200] font-semibold' },
  ADMIN: { label: 'Admin', className: 'text-blue-700 font-semibold' },
  SALES_REP: { label: 'Sales Rep', className: 'text-[#66625A] font-medium' },
};

const MATRIX_ROWS = [
  { capability: 'Create and manage deals and leads', owner: true, admin: true, rep: true },
  { capability: 'Drag-and-drop Kanban pipeline updates', owner: true, admin: true, rep: true },
  { capability: 'Access revenue analytics and reports', owner: true, admin: true, rep: true },
  { capability: 'Delete deals, companies, or contacts', owner: true, admin: true, rep: false },
  { capability: 'Invite team members and assign roles', owner: true, admin: true, rep: false },
  { capability: 'Workspace deletion and billing settings', owner: true, admin: false, rep: false },
];

export const TeamView: React.FC<TeamViewProps> = ({ users, workspace, onRefresh }) => {
  const { user: currentUser, switchRole, canManageUsers, demoMode } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handlePersonaSwitch = async (userId: string, name: string) => {
    try {
      await switchRole(userId);
      toast.success(`Switched active session to ${name}`);
    } catch {
      toast.error('Failed to switch user role');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[#FAF7F0]">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EAE4D7] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[#181A1F]">
            Team Members & Permissions
          </h2>
          <p className="text-xs text-[#66625A] mt-0.5">
            Role-based access control across {workspace?.name || 'your sales workspace'}.
          </p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* 2. Role Preview Switcher */}
      {demoMode && (
        <div className="bg-white rounded-xl border border-[#EAE4D7] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold font-display text-[#181A1F]">
                Interactive Role Preview
              </h3>
              <p className="text-xs text-[#66625A] mt-0.5">
                Select a team member below to verify server-enforced permission boundaries in real time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {users.slice(0, 3).map((u) => {
              const isCurrent = currentUser?.id === u.id;
              const roleMeta = ROLE_TEXT[u.role] || ROLE_TEXT.SALES_REP;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handlePersonaSwitch(u.id, u.name)}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'border-[#F0A818] bg-[#FEF6E2]/60'
                      : 'border-[#EAE4D7] bg-white hover:bg-[#FAF7F0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u.name} src={u.avatar} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#181A1F] truncate">{u.name}</p>
                      <p className={`text-[11px] truncate ${roleMeta.className}`}>{roleMeta.label}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-[#B47200] shrink-0">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Team Member Directory */}
      <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h3 className="text-sm font-semibold font-display text-[#181A1F]">
            Workspace Members{' '}
            <span className="text-xs font-mono tabular-nums font-normal text-[#66625A]">
              ({users.length})
            </span>
          </h3>
        </div>

        <div className="divide-y divide-[#EAE4D7]">
          {users.map((member) => {
            const roleMeta = ROLE_TEXT[member.role] || ROLE_TEXT.SALES_REP;
            return (
              <div
                key={member.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF7F0]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.name} src={member.avatar} size="lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-[#181A1F] truncate">
                        {member.name}
                      </h4>
                      <span className="text-[#D6CFC0]" aria-hidden="true">
                        ·
                      </span>
                      <span className={`text-xs ${roleMeta.className}`}>{roleMeta.label}</span>
                    </div>
                    <p className="text-[11px] text-[#66625A] mt-0.5 truncate">
                      {member.title} · {member.email}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-[#66625A] font-mono tabular-nums hidden sm:block shrink-0">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Permissions Matrix */}
      <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE4D7]">
          <h3 className="text-sm font-semibold font-display text-[#181A1F]">
            Role Permissions Matrix
          </h3>
          <p className="text-xs text-[#66625A] mt-0.5">
            Enforced in both client controls and API route authorization boundaries.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
              <tr>
                <th className="py-2.5 px-5 font-medium">Capability</th>
                <th className="py-2.5 px-5 font-medium text-center">Owner</th>
                <th className="py-2.5 px-5 font-medium text-center">Admin</th>
                <th className="py-2.5 px-5 font-medium text-center">Sales Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]">
              {MATRIX_ROWS.map((row) => (
                <tr key={row.capability}>
                  <td className="py-2.5 px-5 text-[#181A1F] font-medium">{row.capability}</td>
                  {[row.owner, row.admin, row.rep].map((allowed, idx) => (
                    <td key={idx} className="py-2.5 px-5 text-center">
                      {allowed ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" aria-label="Allowed" />
                      ) : (
                        <Minus
                          className="w-4 h-4 text-[#D6CFC0] mx-auto"
                          aria-label="Not permitted"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvited={onRefresh}
      />
    </div>
  );
};
