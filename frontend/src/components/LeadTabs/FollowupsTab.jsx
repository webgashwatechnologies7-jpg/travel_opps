import React, { memo } from 'react';
import { Plus, Calendar, Clock, CheckCircle, Pencil, Trash2 } from 'lucide-react';

const FollowupsTab = memo(({
    followups,
    setEditingFollowupId,
    setFollowupFormData,
    setShowFollowupModal,
    handleDeleteFollowup,
    convertTo12Hour,
    followupsAPI,
    fetchLeadDetails,
    showToastNotification,
}) => {
    const handleAddTask = () => {
        setEditingFollowupId(null);
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setFollowupFormData({
            type: 'Task',
            description: '',
            reminder_date: `${dd}-${mm}-${yyyy}`,
            reminder_time: '1:00 PM',
            set_reminder: 'Yes',
        });
        setShowFollowupModal(true);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Followup's / Task</h3>
                <button
                    onClick={handleAddTask}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    + Add Task
                </button>
            </div>

            {/* List */}
            {followups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No Task</div>
            ) : (
                <div className="space-y-4">
                    {followups
                        .sort((a, b) => {
                            const dateA = new Date(`${a.reminder_date} ${a.reminder_time || '00:00:00'}`);
                            const dateB = new Date(`${b.reminder_date} ${b.reminder_time || '00:00:00'}`);
                            return dateA - dateB;
                        })
                        .map((followup) => {
                            const reminderDate = new Date(
                                `${followup.reminder_date} ${followup.reminder_time || '00:00:00'}`
                            );
                            const isOverdue = reminderDate < new Date() && !followup.is_completed;
                            const isToday =
                                reminderDate.toDateString() === new Date().toDateString() &&
                                !followup.is_completed;

                            return (
                                <div
                                    key={followup.id}
                                    className={`border rounded-lg p-4 ${followup.is_completed
                                            ? 'bg-gray-50 border-gray-200'
                                            : isOverdue
                                                ? 'bg-red-50 border-red-200'
                                                : isToday
                                                    ? 'bg-yellow-50 border-yellow-200'
                                                    : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar
                                                    className={`h-5 w-5 ${followup.is_completed
                                                            ? 'text-gray-400'
                                                            : isOverdue
                                                                ? 'text-red-500'
                                                                : isToday
                                                                    ? 'text-yellow-600'
                                                                    : 'text-blue-500'
                                                        }`}
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-800">
                                                            {new Date(followup.reminder_date).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                        {followup.reminder_time && (
                                                            <>
                                                                <span className="text-gray-400">•</span>
                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>{convertTo12Hour(followup.reminder_time)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {(followup.remark || followup.description) && (
                                                        <p className="text-gray-700 mt-2">
                                                            {followup.remark || followup.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                        <span>Created by: {followup.user?.name || 'Unknown'}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(followup.created_at).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {isOverdue && !followup.is_completed && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                                    Overdue
                                                </span>
                                            )}
                                            {isToday && !followup.is_completed && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                                    Today
                                                </span>
                                            )}
                                            {!followup.is_completed && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const rawDate = followup.reminder_date
                                                                ? String(followup.reminder_date).slice(0, 10)
                                                                : '';
                                                            const parts = rawDate.split('-');
                                                            const ddmmyyyy =
                                                                parts.length === 3
                                                                    ? `${parts[2]}-${parts[1]}-${parts[0]}`
                                                                    : '';
                                                            setEditingFollowupId(followup.id);
                                                            setFollowupFormData({
                                                                type: 'Task',
                                                                description: followup.remark || '',
                                                                reminder_date: ddmmyyyy,
                                                                reminder_time: followup.reminder_time
                                                                    ? convertTo12Hour(followup.reminder_time)
                                                                    : '1:00 PM',
                                                                set_reminder: 'Yes',
                                                            });
                                                            setShowFollowupModal(true);
                                                        }}
                                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFollowup(followup.id)}
                                                        className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded hover:bg-red-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            {followup.is_completed ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Completed
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await followupsAPI.complete(followup.id);
                                                            await fetchLeadDetails();
                                                        } catch (err) {
                                                            console.error('Failed to complete followup:', err);
                                                            showToastNotification(
                                                                'error',
                                                                'Error',
                                                                err.response?.data?.message || 'Failed to mark as completed'
                                                            );
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
});

FollowupsTab.displayName = 'FollowupsTab';
export default FollowupsTab;
