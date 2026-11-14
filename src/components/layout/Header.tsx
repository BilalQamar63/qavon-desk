import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, RotateCcw, Download, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { NavTab } from './Sidebar.tsx';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';
import { Workspace } from '../../types/crm.ts';

interface HeaderProps {
  currentTab: NavTab;
  workspace?: Workspace | null;
  onOpenMobileSidebar: () => void;
  onOpenNewDealModal: () => void;
  onOpenNewLeadModal: () => void;
  onDataRefresh: () => void;
}

const TAB_LABELS: Record<NavTab, string> = {
  dashboard: 'Overview',
  deals: 'Deals & Pipeline',
  leads: 'Leads',
  companies: 'Companies',
  contacts: 'Contacts',
  activities: 'Activities',
  reports: 'Reports & Analytics',
  team: 'Team & Roles',
  settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  workspace,
  onOpenMobileSidebar,
  onOpenNewDealModal,
  onOpenNewLeadModal,
  onDataRefresh,
}) => {
  const { canManageUsers, demoMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setMenuOpen(false);
      await api.exportWorkspaceData();
      toast.success('Downloading workspace JSON export');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export workspace data');
    } finally {
      setExporting(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemoData();
      toast.success('Workspace restored to default demo dataset.');
      onDataRefresh();
      setConfirmResetOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <header className="h-14 border-b border-[#EAE4D7] bg-white px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
        {/* Left zone: Mobile drawer trigger & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden p-1.5 text-[#66625A] hover:text-[#181A1F] hover:bg-[#FAF7F0] rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="hidden sm:inline text-[#66625A] font-medium truncate">
              {workspace?.name || 'Acme Cloud Dynamics'}
            </span>
            <span className="hidden sm:inline text-[#D6CFC0]">/</span>
            <h2 className="text-sm font-semibold font-display text-[#181A1F] truncate">
              {TAB_LABELS[currentTab]}
            </h2>
          </div>
        </div>

        {/* Right zone: Focused Primary Actions & Overflow Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenNewLeadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#181A1F] bg-white hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#66625A]" />
            <span>Add Lead</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewDealModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deal</span>
          </button>

          {canManageUsers && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Workspace actions"
                aria-expanded={menuOpen}
                className="p-1.5 text-[#66625A] hover:text-[#181A1F] hover:bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg transition-colors shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#EAE4D7] rounded-lg shadow-lg py-1 z-40 text-xs">
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={handleExport}
                    className="w-full px-3 py-2 text-left text-[#181A1F] hover:bg-[#FAF7F0] flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-[#66625A]" />
                    <span>{exporting ? 'Exporting...' : 'Export JSON Backup'}</span>
                  </button>
                  {demoMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmResetOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Data</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset workspace to demo data?"
        description="This restores the default 18 deals, 14 leads, 8 companies, and 14 activities. Any custom edits made during this session will be replaced."
        confirmLabel="Reset Demo Data"
        variant="danger"
        loading={resetting}
        onConfirm={handleResetDemo}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
};
