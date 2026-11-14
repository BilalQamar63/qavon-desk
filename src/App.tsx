import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthView } from './components/auth/AuthView.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { DealsKanbanView } from './components/deals/DealsKanbanView.tsx';
import { DealModal } from './components/deals/DealModal.tsx';
import { DealDetailDrawer } from './components/deals/DealDetailDrawer.tsx';
import { LeadsView } from './components/leads/LeadsView.tsx';
import { LeadModal } from './components/leads/LeadModal.tsx';
import { ConvertLeadModal } from './components/leads/ConvertLeadModal.tsx';
import { CompaniesView } from './components/companies/CompaniesView.tsx';
import { CompanyModal } from './components/companies/CompanyModal.tsx';
import { ContactsView } from './components/contacts/ContactsView.tsx';
import { ContactModal } from './components/contacts/ContactModal.tsx';
import { ActivitiesView } from './components/activities/ActivitiesView.tsx';
import { ActivityModal } from './components/activities/ActivityModal.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { TeamView } from './components/team/TeamView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { api } from './lib/api.ts';
import {
  Deal,
  Lead,
  Company,
  Contact,
  Activity,
  User,
  Workspace,
} from './types/crm.ts';

function CRMApplication() {
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data States
  const [deals, setDeals] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal States
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);
  const [selectedDealForDrawer, setSelectedDealForDrawer] = useState<any | null>(null);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [isConvertLeadModalOpen, setIsConvertLeadModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [initialDealForActivity, setInitialDealForActivity] = useState<string | undefined>();
  const [initialCompanyForActivity, setInitialCompanyForActivity] = useState<string | undefined>();
  const [selectedCompanyForDeals, setSelectedCompanyForDeals] = useState<string | undefined>();

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [dealsData, leadsData, companiesData, contactsData, activitiesData, teamData] =
        await Promise.all([
          api.getDeals(),
          api.getLeads(),
          api.getCompanies(),
          api.getContacts(),
          api.getActivities(),
          api.getTeam(),
        ]);

      setDeals(dealsData);
      setLeads(leadsData);
      setCompanies(companiesData);
      setContacts(contactsData);
      setActivities(activitiesData);
      setUsers(teamData.users);
      setWorkspace(teamData.workspace);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to synchronize workspace data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      loadAllData();
    } else if (!authLoading) {
      setDataLoading(false);
    }
  }, [user, authLoading, loadAllData]);

  const now = Date.now();
  const overdueCount = activities.filter(
    (a) => !a.completed && new Date(a.dueDate).getTime() < now
  ).length;

  const handleOpenNewDeal = () => {
    setDealToEdit(null);
    setIsDealModalOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setDealToEdit(deal);
    setIsDealModalOpen(true);
  };

  const handleOpenNewLead = () => {
    setLeadToEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleConvertLead = (lead: Lead) => {
    setLeadToConvert(lead);
    setIsConvertLeadModalOpen(true);
  };

  const handleScheduleActivityForDeal = (dealId: string, companyId: string) => {
    setActivityToEdit(null);
    setInitialDealForActivity(dealId);
    setInitialCompanyForActivity(companyId);
    setIsActivityModalOpen(true);
  };

  const handleCompanyDealsSelect = (companyId: string) => {
    setSelectedCompanyForDeals(companyId);
    setCurrentTab('deals');
  };

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F0A818] text-[#181A1F] flex items-center justify-center font-bold font-display text-base border border-[#D9930C]/30">
            Q
          </div>
          <p className="text-xs font-medium text-[#66625A]">Loading Qavon Desk workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const activeDrawerDeal = selectedDealForDrawer
    ? deals.find((d) => d.id === selectedDealForDrawer.id) || selectedDealForDrawer
    : null;

  return (
    <div className="min-h-screen flex bg-[#FAF7F0] text-[#181A1F] overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        workspace={workspace}
        overdueCount={overdueCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentTab={currentTab}
          workspace={workspace}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewDealModal={handleOpenNewDeal}
          onOpenNewLeadModal={handleOpenNewLead}
          onDataRefresh={loadAllData}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setCurrentTab}
              onOpenNewDealModal={handleOpenNewDeal}
              onOpenNewLeadModal={handleOpenNewLead}
              onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
            />
          )}

          {currentTab === 'deals' && (
            <DealsKanbanView
              deals={deals}
              companies={companies}
              users={users}
              selectedCompanyId={selectedCompanyForDeals}
              onRefresh={loadAllData}
              onOpenNewDealModal={handleOpenNewDeal}
              onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsView
              leads={leads}
              users={users}
              onRefresh={loadAllData}
              onOpenNewLeadModal={handleOpenNewLead}
              onEditLead={handleEditLead}
              onConvertLead={handleConvertLead}
            />
          )}

          {currentTab === 'companies' && (
            <CompaniesView
              companies={companies}
              deals={deals}
              contacts={contacts}
              users={users}
              onRefresh={loadAllData}
              onOpenNewCompanyModal={() => {
                setCompanyToEdit(null);
                setIsCompanyModalOpen(true);
              }}
              onEditCompany={(comp) => {
                setCompanyToEdit(comp);
                setIsCompanyModalOpen(true);
              }}
              onSelectCompanyDeals={handleCompanyDealsSelect}
            />
          )}

          {currentTab === 'contacts' && (
            <ContactsView
              contacts={contacts}
              companies={companies}
              onRefresh={loadAllData}
              onOpenNewContactModal={() => {
                setContactToEdit(null);
                setIsContactModalOpen(true);
              }}
              onEditContact={(cnt) => {
                setContactToEdit(cnt);
                setIsContactModalOpen(true);
              }}
            />
          )}

          {currentTab === 'activities' && (
            <ActivitiesView
              activities={activities}
              users={users}
              onRefresh={loadAllData}
              onOpenNewActivityModal={() => {
                setActivityToEdit(null);
                setInitialDealForActivity(undefined);
                setInitialCompanyForActivity(undefined);
                setIsActivityModalOpen(true);
              }}
              onEditActivity={(act) => {
                setActivityToEdit(act);
                setIsActivityModalOpen(true);
              }}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'team' && (
            <TeamView users={users} workspace={workspace} onRefresh={loadAllData} />
          )}

          {currentTab === 'settings' && (
            <SettingsView workspace={workspace} onRefresh={loadAllData} />
          )}
        </main>
      </div>

      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onSaved={loadAllData}
        dealToEdit={dealToEdit}
        companies={companies}
        users={users}
      />

      <DealDetailDrawer
        isOpen={Boolean(activeDrawerDeal)}
        deal={activeDrawerDeal}
        onClose={() => setSelectedDealForDrawer(null)}
        onEdit={(deal) => {
          setSelectedDealForDrawer(null);
          handleEditDeal(deal);
        }}
        onDeleted={loadAllData}
        onStageChanged={loadAllData}
        onScheduleActivity={(dealId, companyId) => {
          setSelectedDealForDrawer(null);
          handleScheduleActivityForDeal(dealId, companyId);
        }}
      />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSaved={loadAllData}
        leadToEdit={leadToEdit}
        users={users}
      />

      <ConvertLeadModal
        isOpen={isConvertLeadModalOpen}
        onClose={() => setIsConvertLeadModalOpen(false)}
        onConverted={() => {
          loadAllData();
          toast.success('Lead converted to pipeline opportunity.');
        }}
        lead={leadToConvert}
        users={users}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSaved={loadAllData}
        companyToEdit={companyToEdit}
        users={users}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSaved={loadAllData}
        contactToEdit={contactToEdit}
        companies={companies}
      />

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSaved={loadAllData}
        activityToEdit={activityToEdit}
        users={users}
        deals={deals}
        leads={leads}
        companies={companies}
        initialDealId={initialDealForActivity}
        initialCompanyId={initialCompanyForActivity}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CRMApplication />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
}
