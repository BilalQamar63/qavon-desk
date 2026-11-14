import React, { useState } from 'react';
import {
  Search,
  Plus,
  Phone,
  Video,
  Mail,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Activity, ActivityType, User } from '../../types/crm.ts';
import { api } from '../../lib/api.ts';
import { ConfirmDialog } from '../shared/ConfirmDialog.tsx';

interface ActivitiesViewProps {
  activities: Array<Activity & { assignedToName?: string; entityLabel?: string }>;
  users: User[];
  onRefresh: () => void;
  onOpenNewActivityModal: () => void;
  onEditActivity: (activity: Activity) => void;
}

const TYPE_META: Record<ActivityType, { label: string; icon: React.ReactNode }> = {
  CALL: { label: 'Call', icon: <Phone className="w-3.5 h-3.5 text-blue-600" /> },
  MEETING: { label: 'Meeting', icon: <Video className="w-3.5 h-3.5 text-[#B47200]" /> },
  EMAIL: { label: 'Email', icon: <Mail className="w-3.5 h-3.5 text-amber-600" /> },
  TASK: { label: 'Task', icon: <CheckSquare className="w-3.5 h-3.5 text-[#66625A]" /> },
  FOLLOW_UP: { label: 'Follow-up', icon: <Clock className="w-3.5 h-3.5 text-emerald-600" /> },
};

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  activities,
  onRefresh,
  onOpenNewActivityModal,
  onEditActivity,
}) => {
  const [tab, setTab] = useState<'ALL' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activityPendingDelete, setActivityPendingDelete] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const now = Date.now();

  const filteredActivities = activities.filter((act) => {
    const isOverdue = !act.completed && new Date(act.dueDate).getTime() < now;

    if (tab === 'OVERDUE' && !isOverdue) return false;
    if (tab === 'UPCOMING' && (act.completed || isOverdue)) return false;
    if (tab === 'COMPLETED' && !act.completed) return false;

    if (typeFilter !== 'ALL' && act.type !== typeFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        act.title.toLowerCase().includes(q) ||
        (act.description && act.description.toLowerCase().includes(q)) ||
        (act.entityLabel && act.entityLabel.toLowerCase().includes(q)) ||
        (act.assignedToName && act.assignedToName.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const overdueTotal = activities.filter(
    (a) => !a.completed && new Date(a.dueDate).getTime() < now
  ).length;

  const handleToggle = async (activity: Activity) => {
    try {
      await api.toggleActivity(activity.id);
      toast.success(
        activity.completed
          ? `Reopened "${activity.title}"`
          : `Marked "${activity.title}" complete`
      );
      onRefresh();
    } catch {
      toast.error('Failed to update activity status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activityPendingDelete) return;
    try {
      setDeleting(true);
      await api.deleteActivity(activityPendingDelete.id);
      toast.success(`Deleted "${activityPendingDelete.title}"`);
      setActivityPendingDelete(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete activity');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F0] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-[#EAE4D7] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="flex items-center gap-0.5 p-0.5 bg-[#EFEAE0] border border-[#EAE4D7] rounded-lg text-xs font-medium">
            {[
              { id: 'ALL', label: `All (${activities.length})` },
              {
                id: 'OVERDUE',
                label: overdueTotal > 0 ? `Overdue (${overdueTotal})` : 'Overdue',
              },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as any)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? item.id === 'OVERDUE' && overdueTotal > 0
                        ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                        : 'bg-white text-[#181A1F] shadow-2xs font-semibold'
                      : 'text-[#66625A] hover:text-[#181A1F]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#66625A]" />
            <input
              type="text"
              placeholder="Search activities, deals, or reps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg focus:outline-hidden focus:border-[#F0A818] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by activity type"
            className="px-2.5 py-1.5 text-xs bg-[#FAF7F0] border border-[#EAE4D7] rounded-lg text-[#181A1F] focus:outline-hidden focus:border-[#F0A818]"
          >
            <option value="ALL">All Types</option>
            <option value="CALL">Calls</option>
            <option value="MEETING">Meetings</option>
            <option value="EMAIL">Emails</option>
            <option value="TASK">Tasks</option>
            <option value="FOLLOW_UP">Follow-ups</option>
          </select>

          <button
            type="button"
            onClick={onOpenNewActivityModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* 2. Activities List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-[#EAE4D7] divide-y divide-[#EAE4D7] overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <Calendar className="w-8 h-8 mx-auto text-[#D6CFC0] mb-2.5" />
              <p className="text-sm font-medium text-[#181A1F]">No activities match this view</p>
              <p className="text-xs text-[#66625A] mt-1">
                Schedule a follow-up call, meeting, or task to keep deals moving forward.
              </p>
              <button
                type="button"
                onClick={onOpenNewActivityModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#181A1F] bg-[#F0A818] hover:bg-[#D9930C] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Activity</span>
              </button>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const isOverdue = !activity.completed && new Date(activity.dueDate).getTime() < now;
              const typeInfo = TYPE_META[activity.type] || TYPE_META.TASK;
              return (
                <div
                  key={activity.id}
                  className={`px-5 py-3.5 flex items-start justify-between gap-4 transition-colors hover:bg-[#FAF7F0] ${
                    activity.completed ? 'bg-[#FAF7F0]/50 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(activity)}
                      aria-label={
                        activity.completed
                          ? `Mark ${activity.title} incomplete`
                          : `Mark ${activity.title} complete`
                      }
                      className="mt-0.5 text-[#D6CFC0] hover:text-emerald-600 transition-colors shrink-0"
                    >
                      {activity.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-[#66625A]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#66625A] shrink-0">
                          {typeInfo.icon}
                          <span>{typeInfo.label}</span>
                        </span>

                        <span className="text-[#D6CFC0]" aria-hidden="true">
                          ·
                        </span>

                        <h4
                          className={`text-xs font-semibold ${
                            activity.completed ? 'line-through text-[#66625A]' : 'text-[#181A1F]'
                          }`}
                        >
                          {activity.title}
                        </h4>

                        {isOverdue && (
                          <>
                            <span className="text-[#D6CFC0]" aria-hidden="true">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Overdue</span>
                            </span>
                          </>
                        )}
                      </div>

                      {activity.description && (
                        <p className="text-xs text-[#66625A] mt-1 line-clamp-2 leading-relaxed">
                          {activity.description}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#66625A] flex-wrap">
                        {activity.entityLabel && (
                          <>
                            <span className="font-medium text-[#B47200]">
                              {activity.entityLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>Assigned to {activity.assignedToName || 'Unassigned'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Due{' '}
                          {new Date(activity.dueDate).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditActivity(activity)}
                      aria-label={`Edit ${activity.title}`}
                      className="p-1.5 text-[#66625A] hover:text-[#B47200] hover:bg-[#EFEAE0] rounded-md transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityPendingDelete(activity)}
                      aria-label={`Delete ${activity.title}`}
                      className="p-1.5 text-[#66625A] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(activityPendingDelete)}
        title="Delete activity?"
        description={
          activityPendingDelete
            ? `"${activityPendingDelete.title}" will be permanently removed.`
            : ''
        }
        confirmLabel="Delete Activity"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setActivityPendingDelete(null)}
      />
    </div>
  );
};
