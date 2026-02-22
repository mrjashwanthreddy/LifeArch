import { useState } from "react";
import {
  useGoals,
  useCreateGoal,
  useCompleteGoal,
  useDeleteGoal,
} from "../hooks/useGoals";

export default function GoalsView() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const completeGoal = useCompleteGoal();
  const deleteGoal = useDeleteGoal();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createGoal.mutate(
      { title, description: description || undefined, targetDate: targetDate || undefined },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setTargetDate("");
          setIsAdding(false);
        },
      }
    );
  };

  const activeGoals = goals?.filter((g) => !g.isCompleted) ?? [];
  const doneGoals = goals?.filter((g) => g.isCompleted) ?? [];

  // Urgency helpers
  const getDaysLabel = (daysLeft: number, noDate: boolean) => {
    if (noDate) return null;
    if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, style: "bg-red-100 text-red-600" };
    if (daysLeft === 0) return { label: "Due today!", style: "bg-red-100 text-red-600" };
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, style: "bg-amber-100 text-amber-700" };
    return { label: `${daysLeft}d left`, style: "bg-slate-100 text-slate-500" };
  };

  if (isLoading)
    return <div className="p-8 text-slate-500 animate-pulse">Loading goals...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Goals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your long-term ambitions and milestones.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {isAdding ? "Cancel" : "New Goal"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Create Form */}
          {isAdding && (
            <form
              onSubmit={handleCreate}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#85a3c2]/40 dark:border-[#85a3c2]/20 shadow-sm"
            >
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">New Goal</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to achieve? (e.g., Run a 5K)"
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
                  autoFocus
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why does this matter to you? (optional)"
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none resize-none"
                  rows={2}
                />
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">Target Date:</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="p-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!title.trim() || createGoal.isPending}
                    className="px-5 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {createGoal.isPending ? "Saving..." : "Save Goal"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Active Goals */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Active — {activeGoals.length}
            </h3>

            {activeGoals.length === 0 && !isAdding && (
              <div className="text-center p-12 bg-white border border-dashed border-slate-300 rounded-xl">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-slate-500 font-medium">No active goals yet.</p>
                <p className="text-sm text-slate-400 mt-1">Set your first long-term goal to get started.</p>
              </div>
            )}

            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const badge = getDaysLabel(goal.daysLeft, !goal.targetDate);
                const urgency = badge?.style.includes("red") ? "border-red-200 bg-red-50/30" : "";

                return (
                  <div
                    key={goal.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all ${urgency}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{goal.title}</h4>
                          {badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${badge.style}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{goal.description}</p>
                        )}
                        {goal.targetDate && (
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(goal.targetDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => completeGoal.mutate(goal.id)}
                          disabled={completeGoal.isPending}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Mark complete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {deletingId === goal.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { deleteGoal.mutate(goal.id); setDeletingId(null); }}
                              className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg"
                            >
                              Delete
                            </button>
                            <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 hover:text-slate-600">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(goal.id)}
                            className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Goals */}
          {doneGoals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Completed — {doneGoals.length}
              </h3>
              <div className="space-y-3">
                {doneGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 flex items-center gap-4"
                  >
                    <span className="text-2xl flex-shrink-0">✅</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-emerald-800 line-through decoration-emerald-400">
                        {goal.title}
                      </h4>
                      {goal.completedAt && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Achieved on {new Date(goal.completedAt + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteGoal.mutate(goal.id)}
                      className="p-2 text-emerald-300 hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
