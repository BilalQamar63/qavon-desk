import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Search,
  Plus,
  Building,
  MoreHorizontal,
  Kanban,
  List,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Deal, DealStage, Company, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { Avatar } from '../shared/Avatar.tsx';

interface DealsKanbanViewProps {
  deals: Array<
    Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string }
  >;
  companies: Company[];
  users: User[];
  selectedCompanyId?: string;
  onRefresh: () => void;
  onOpenNewDealModal: () => void;
  onSelectDeal: (deal: any) => void;
}

interface ColumnDef {
  id: DealStage;
  title: string;
  topAccent: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'NEW_OPPORTUNITY', title: 'New Opportunity', topAccent: '#9E9689' },
  { id: 'QUALIFIED', title: 'Qualified', topAccent: '#3B82F6' },
  { id: 'PROPOSAL_SENT', title: 'Proposal Sent', topAccent: '#F0A818' },
  { id: 'NEGOTIATION', title: 'Negotiation', topAccent: '#D97706' },
  { id: 'WON', title: 'Won', topAccent: '#16A34A' },
  { id: 'LOST', title: 'Lost', topAccent: '#DC2626' },
];

const PRIORITY_TEXT: Record<string, { label: string; className: string }> = {
  HIGH: { label: 'High priority', className: 'text-rose-700 font-medium' },
  MEDIUM: { label: 'Medium', className: 'text-amber-700 font-medium' },
  LOW: { label: 'Low', className: 'text-[#66625A]' },
};

export const DealsKanbanView: React.FC<DealsKanbanViewProps> = ({
  deals,
  companies,
  users,
  selectedCompanyId,
  onRefresh,
  onOpenNewDealModal,
  onSelectDeal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>(selectedCompanyId || 'ALL');
  const [sortBy, setSortBy] = useState<'default' | 'value_desc' | 'close_asc'>('default');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [optimisticStages, setOptimisticStages] = useState<Record<string, DealStage>>({});

  useEffect(() => {
    if (selectedCompanyId) {
      setSelectedCompany(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Apply optimistic stages seamlessly over server deals
  const resolvedDeals = useMemo(() => {
    return deals.map((d) =>
      optimisticStages[d.id] ? { ...d, stage: optimisticStages[d.id] } : d
    );
  }, [deals, optimisticStages]);

  const filteredDeals = useMemo(() => {
    const filtered = resolvedDeals.filter((deal) => {
      if (selectedOwner !== 'ALL' && deal.ownerId !== selectedOwner) return false;
      if (selectedPriority !== 'ALL' && deal.priority !== selectedPriority) return false;
      if (selectedCompany !== 'ALL' && deal.companyId !== selectedCompany) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = deal.title.toLowerCase().includes(q);
        const matchesCompany = (deal.companyName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany) return false;
      }
      return true;
    });

    if (sortBy === 'value_desc') {
      return [...filtered].sort((a, b) => b.value - a.value);
    }
    if (sortBy === 'close_asc') {
      return [...filtered].sort(
        (a, b) =>
          new Date(a.expectedCloseDate || '2099-01-01').getTime() -
          new Date(b.expectedCloseDate || '2099-01-01').getTime()
      );
    }
    return filtered;
  }, [resolvedDeals, search, selectedOwner, selectedPriority, selectedCompany, sortBy]);

  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, typeof resolvedDeals> = {
      NEW_OPPORTUNITY: [],
      QUALIFIED: [],
      PROPOSAL_SENT: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };
    filteredDeals.forEach((d) => {
      if (map[d.stage]) {
        map[d.stage].push(d);
      }
    });
    return map;
  }, [filteredDeals]);

  const metrics = useMemo(() => {
    const active = resolvedDeals.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST');
    const totalPipeline = active.reduce((sum, d) => sum + d.value, 0);
    const won = resolvedDeals.filter((d) => d.stage === 'WON');
    const wonRevenue = won.reduce((sum, d) => sum + d.value, 0);
    const lost = resolvedDeals.filter((d) => d.stage === 'LOST');
    const closedCount = won.length + lost.length;
    const winRate = closedCount > 0 ? Math.round((won.length / closedCount) * 100) : 0;

    return {
      totalPipeline,
      activeCount: active.length,
      wonRevenue,
      winRate,
    };
  }, [resolvedDeals]);

  const activeDeal = useMemo(
    () => resolvedDeals.find((d) => d.id === activeDealId) || null,
    [resolvedDeals, activeDealId]
  );

  const moveDealToStage = async (dealId: string, targetStage: DealStage) => {
    const currentDeal = resolvedDeals.find((d) => d.id === dealId);
    if (!currentDeal || currentDeal.stage === targetStage) return;

    const targetLabel = COLUMNS.find((c) => c.id === targetStage)?.title || targetStage;
    setOptimisticStages((prev) => ({ ...prev, [dealId]: targetStage }));

    try {
      await api.updateDealStage(dealId, targetStage);
      toast.success(`Moved "${currentDeal.title}" to ${targetLabel}`);
      onRefresh();
    } catch {
      toast.error('Failed to update deal stage');
    } finally {
      setOptimisticStages((prev) => {
        const next = { ...prev };
        delete next[dealId];
        return next;
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);

    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);

    let targetStage: DealStage | null = null;
    if (COLUMNS.some((col) => col.id === overId)) {
      targetStage = overId as DealStage;
    } else {
      const overDeal = resolvedDeals.find((d) => d.id === overId);
      if (overDeal) targetStage = overDeal.stage;
    }

    if (targetStage) {
      await moveDealToStage(dealId, targetStage);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    selectedOwner !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedCompany !== 'ALL';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F0] overflow-hidden">
      {/* 1. Clean Hairline-Divided Pipeline Strip */}
      <div className="bg-white border-b border-[#EAE4D7] px-4 lg:px-6 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-[#EAE4D7]">
          <div className="sm:pr-5">
            <span className="text-[11px] font-medium text-[#66625A]">Active Pipeline</span>
            <p className="text-base lg:text-lg font-bold font-mono tabular-nums text-[#181A1F] mt-0.5">
              ${metrics.totalPipeline.toLocaleString()}
            </p>
          </div>
          <div className="sm:px-5">
            <span className="text-[11px] font-medium text-[#66625A]">Open Opportunities</span>
            <p className="text-base lg:text-lg font-bold font-mono tabular-nums text-[#181A1F] mt-0.5">
              {metrics.activeCount}
            </p>
          </div>
          <div className="sm:px-5">
            <span className="text-[11px] font-medium text-[#66625A]">Won Revenue</span>
            <p className="text-base lg:text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              ${metrics.wonRevenue.toLocaleString()}
            </p>
          </div>
          <div className="sm:pl-5">
            <span className="text-[11px] font-medium text-[#66625A]">Win Conversion</span>
            <p className="text-base lg:text-lg font-bold font-mono tabular-nums text-[#181A1F] mt-0.5">
              {metrics.winRate}%
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter & View Toolbar */}
      <div className="px-4 lg:px-6 py-3 bg-white border-b border-[#EAE4D7] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
            <input
              type="text"
              placeholder="Search deals or companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818] focus:bg-white"
            />
          </div>

          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            aria-label="Filter by owner"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filter by priority"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            aria-label="Filter by company"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#66625A]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort opportunities"
              className="px-2 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
            >
              <option value="default">Sort: Pipeline Order</option>
              <option value="value_desc">Sort: Highest Value</option>
              <option value="close_asc">Sort: Closing Soonest</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedOwner('ALL');
                setSelectedPriority('ALL');
                setSelectedCompany('ALL');
              }}
              className="text-xs text-[#B47200] font-medium hover:underline px-1.5 whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Board / List Segmented Toggle */}
          <div className="flex items-center p-0.5 bg-[#EFEAE0] rounded-lg border border-[#EAE4D7] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors whitespace-nowrap ${
                viewMode === 'board'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                  : 'text-[#66625A] hover:text-[#181A1F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewDealModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* 3. Board or Table View */}
      {viewMode === 'board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full min-w-[1440px]">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  deals={dealsByStage[column.id] || []}
                  onSelectDeal={onSelectDeal}
                  onMoveStage={moveDealToStage}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDeal ? (
                <div className="w-[264px] rotate-1 opacity-95 pointer-events-none">
                  <DealCardContent deal={activeDeal} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="bg-white rounded-xl border border-[#EAE4D7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#EAE4D7] text-[#66625A]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Opportunity</th>
                    <th className="py-2.5 px-4 font-medium">Company</th>
                    <th className="py-2.5 px-4 font-medium">Stage</th>
                    <th className="py-2.5 px-4 font-medium">Priority</th>
                    <th className="py-2.5 px-4 font-medium">Owner</th>
                    <th className="py-2.5 px-4 font-medium">Target Close</th>
                    <th className="py-2.5 px-4 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <p className="text-sm font-medium text-[#181A1F]">
                          No opportunities match your filters
                        </p>
                        <p className="text-xs text-[#66625A] mt-1">
                          Adjust filters or create a new opportunity to populate your pipeline.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenNewDealModal}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Opportunity</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => {
                      const col = COLUMNS.find((c) => c.id === deal.stage);
                      const priorityMeta = PRIORITY_TEXT[deal.priority] || PRIORITY_TEXT.MEDIUM;
                      return (
                        <tr
                          key={deal.id}
                          onClick={() => onSelectDeal(deal)}
                          className="hover:bg-[#FAF7F0] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4 font-medium text-[#181A1F]">{deal.title}</td>
                          <td className="py-2.5 px-4 text-[#66625A]">
                            {deal.companyName || 'Unknown'}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#181A1F]">
                            {col?.title || deal.stage}
                          </td>
                          <td className={`py-2.5 px-4 ${priorityMeta.className}`}>
                            {priorityMeta.label}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={deal.ownerName} src={deal.ownerAvatar} size="xs" />
                              <span className="text-[#181A1F]">{deal.ownerName || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-[#66625A]">
                            {deal.expectedCloseDate
                              ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold font-mono tabular-nums text-[#181A1F]">
                            ${deal.value.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  column: ColumnDef;
  deals: Array<
    Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string }
  >;
  onSelectDeal: (deal: any) => void;
  onMoveStage: (dealId: string, stage: DealStage) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  deals,
  onSelectDeal,
  onMoveStage,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const columnSum = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`w-[272px] shrink-0 rounded-xl border flex flex-col h-full transition-colors overflow-hidden ${
        isOver
          ? 'bg-[#FEF6E2]/70 border-[#F0A818]'
          : 'bg-white border-[#EAE4D7]'
      }`}
      style={{ borderTopWidth: '2px', borderTopColor: column.topAccent }}
    >
      {/* Column Header */}
      <div className="px-3.5 py-2.5 border-b border-[#EAE4D7] flex items-center justify-between gap-2 bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-xs font-semibold font-display text-[#181A1F] truncate">
            {column.title}
          </h3>
          <span className="text-[11px] font-mono tabular-nums text-[#66625A]">
            ({deals.length})
          </span>
        </div>
        <span className="text-xs font-semibold font-mono tabular-nums text-[#181A1F] shrink-0">
          ${columnSum.toLocaleString()}
        </span>
      </div>

      {/* Column Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-[#FAF7F0]/70">
        {deals.length === 0 ? (
          <div className="h-28 border border-dashed border-[#EAE4D7] rounded-lg flex flex-col items-center justify-center text-[#66625A] text-xs text-center p-3">
            <p className="font-medium">No opportunities</p>
            <p className="text-[11px] mt-0.5">Drop an opportunity here</p>
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onSelectDeal(deal)}
              onMobileStageChange={(stage) => onMoveStage(deal.id, stage)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface DraggableDealCardProps {
  deal: Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string };
  onClick: () => void;
  onMobileStageChange: (stage: DealStage) => void;
}

const DraggableDealCard: React.FC<DraggableDealCardProps> = ({
  deal,
  onClick,
  onMobileStageChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCardContent
        deal={deal}
        onClick={onClick}
        onMobileStageChange={onMobileStageChange}
      />
    </div>
  );
};

interface DealCardContentProps {
  deal: Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string };
  onClick?: () => void;
  onMobileStageChange?: (stage: DealStage) => void;
  isOverlay?: boolean;
}

const DealCardContent: React.FC<DealCardContentProps> = ({
  deal,
  onClick,
  onMobileStageChange,
  isOverlay = false,
}) => {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStageMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStageMenu(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowStageMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [showStageMenu]);

  const priorityMeta = PRIORITY_TEXT[deal.priority] || PRIORITY_TEXT.MEDIUM;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white p-3.5 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
        isOverlay
          ? 'border-[#F0A818] shadow-lg'
          : 'border-[#EAE4D7] hover:border-[#F0A818]/75'
      }`}
    >
      <div className="cursor-pointer">
        <h4 className="text-xs font-semibold text-[#181A1F] line-clamp-2 leading-snug group-hover:text-[#B47200] transition-colors">
          {deal.title}
        </h4>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#66625A]">
          <Building className="w-3 h-3 shrink-0" />
          <span className="truncate">{deal.companyName || 'Unknown Company'}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#EAE4D7] flex items-center justify-between gap-2">
        <span className="text-sm font-bold font-mono tabular-nums text-[#181A1F]">
          ${deal.value.toLocaleString()}
        </span>
        <span className={`text-[11px] ${priorityMeta.className}`}>{priorityMeta.label}</span>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#66625A]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={deal.ownerName} src={deal.ownerAvatar} size="xs" />
          <span className="truncate max-w-[96px]">{deal.ownerName || 'Unassigned'}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono tabular-nums">
            {deal.expectedCloseDate
              ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No date'}
          </span>

          {onMobileStageChange && (
            <div className="relative" ref={menuRef} onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStageMenu((prev) => !prev);
                }}
                title="Move stage"
                aria-label="Move stage"
                className="p-1 text-[#66625A] hover:text-[#181A1F] hover:bg-[#FAF7F0] rounded transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showStageMenu && (
                <div
                  className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-[#EAE4D7] shadow-lg rounded-lg py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1 text-[11px] font-medium text-[#66625A] border-b border-[#EAE4D7]">
                    Move to stage
                  </div>
                  {COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        onMobileStageChange(col.id);
                        setShowStageMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 hover:bg-[#FAF7F0] transition-colors ${
                        deal.stage === col.id
                          ? 'font-semibold text-[#B47200]'
                          : 'text-[#181A1F]'
                      }`}
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
