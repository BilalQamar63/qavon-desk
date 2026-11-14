import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Building2,
  Contact2,
  CalendarCheck2,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../shared/Avatar.tsx';
import { Workspace } from '../../types/crm.ts';

export type NavTab =
  | 'dashboard'
  | 'deals'
  | 'leads'
  | 'companies'
  | 'contacts'
  | 'activities'
  | 'reports'
  | 'team'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  workspace?: Workspace | null;
  overdueCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  SALES_REP: 'Sales Rep',
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  workspace,
  overdueCount = 0,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout, switchRole, demoMode } = useAuth();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'deals', label: 'Deals & Pipeline', icon: <Kanban className="w-4 h-4" /> },
    { id: 'leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <Contact2 className="w-4 h-4" /> },
    {
      id: 'activities',
      label: 'Activities',
      icon: <CalendarCheck2 className="w-4 h-4" />,
      count: overdueCount > 0 ? overdueCount : undefined,
    },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'team', label: 'Team & Roles', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleRoleSwitch = async (userId: string, label: string) => {
    try {
      await switchRole(userId);
      toast.success(`Switched active view to ${label}`);
    } catch {
      toast.error('Failed to switch workspace persona');
    }
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#181A1F]/45 backdrop-blur-[1px] z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#181A1F] border-r border-[#2A2D36] flex flex-col transition-transform duration-200 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand identity & workspace */}
        <div className="h-14 px-4 border-b border-[#2A2D36] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#F0A818] text-[#181A1F] flex items-center justify-center font-bold font-display text-sm shrink-0">
              Q
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold font-display text-white tracking-tight truncate leading-tight">
                Qavon Desk
              </h1>
              <p className="text-[11px] text-[#A39E93] truncate leading-tight">
                {workspace?.name || 'Acme Cloud Dynamics'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 text-[#A39E93] hover:text-white hover:bg-[#23262E] rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Primary navigation">
          <div className="px-2.5 pb-1.5 text-[11px] font-medium text-[#A39E93]">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F0A818]/15 text-[#F0A818] font-semibold'
                    : 'text-[#E7E2D8] font-medium hover:bg-[#23262E] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-[#F0A818]' : 'text-[#A39E93]'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className="text-[11px] font-mono tabular-nums font-semibold text-rose-400 pl-2 shrink-0"
                    title={`${item.count} overdue`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Hairline Role Switcher for quick RBAC preview */}
        {demoMode && (
          <div className="px-3 py-3 border-t border-[#2A2D36]">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-medium text-[#A39E93]">Role View</span>
              <span className="text-[11px] font-medium text-[#F0A818]">
                {user ? ROLE_LABELS[user.role] || user.role : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#111317] rounded-lg border border-[#2A2D36]">
              {[
                { id: 'usr-1', email: 'sarah.jenkins@acme.io', label: 'Owner', title: 'Sarah Jenkins (Owner)' },
                { id: 'usr-2', email: 'david.vance@acme.io', label: 'Admin', title: 'David Vance (Admin)' },
                { id: 'usr-3', email: 'elena.rostova@acme.io', label: 'Rep', title: 'Elena Rostova (Sales Rep)' },
              ].map((persona) => {
                const active = user?.id === persona.id || user?.email === persona.email;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handleRoleSwitch(persona.id, persona.title)}
                    title={persona.title}
                    className={`py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#F0A818] text-[#181A1F] font-semibold'
                        : 'text-[#A39E93] hover:text-white'
                    }`}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current user profile */}
        <div className="p-3 border-t border-[#2A2D36] bg-[#181A1F]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user?.name} src={user?.avatar} size="md" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-[11px] text-[#A39E93] truncate mt-0.5 leading-tight">
                  {ROLE_LABELS[user?.role || ''] || 'Member'} · {user?.title || 'Sales'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-[#A39E93] hover:text-rose-400 hover:bg-[#23262E] rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
