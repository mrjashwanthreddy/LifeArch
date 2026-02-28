import { useState } from "react";
import {
  useHabits,
  useCreateHabit,
  useLogHabit,
  useUnlogHabit,
  usePointHistory,
  useArchiveHabit,
} from "../hooks/useHabits";

export default function HabitsView() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: history } = usePointHistory();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const unlogHabit = useUnlogHabit();
  const archiveHabit = useArchiveHabit();

  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [newHabitPoints, setNewHabitPoints] = useState(10);
  const [isAdding, setIsAdding] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    createHabit.mutate(
      { name: newHabitName, description: newHabitDesc, frequency: "DAILY", pointsReward: newHabitPoints },
      {
        onSuccess: () => {
          setNewHabitName("");
          setNewHabitDesc("");
          setNewHabitPoints(10);
          setIsAdding(false);
        },
      }
    );
  };

  // Sort habits: active streaks first, then by name
  const sortedHabits = [...(habits ?? [])].sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
    return a.name.localeCompare(b.name);
  });

  if (habitsLoading)
    return <div className="p-8 text-slate-500 animate-pulse">Loading habits...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex justify-between items-center z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Daily Habits</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Check off your routines and earn LifeArch points.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {isAdding ? "Cancel" : "New Habit"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Habits Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Form */}
            {isAdding && (
              <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm mb-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Habit Name (e.g., Read 10 Pages)"
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newHabitDesc}
                    onChange={(e) => setNewHabitDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-600">Points Reward:</label>
                    <input
                      type="number"
                      min="1"
                      value={newHabitPoints}
                      onChange={(e) => setNewHabitPoints(Number(e.target.value))}
                      className="w-24 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!newHabitName.trim() || createHabit.isPending}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      Save Habit
                    </button>
                  </div>
                </div>
              </form>
            )}

            {habits?.length === 0 && !isAdding && (
              <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl border-dashed">
                <p className="text-slate-500 dark:text-slate-400">You haven't set up any habits yet.</p>
              </div>
            )}

            {/* Habit Cards — sorted by streak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedHabits.map((habit) => {
                const isCompletedToday = habit.isCompletedToday;
                const hasStreak = habit.currentStreak > 0;
                const isOnFire = habit.currentStreak >= 3;

                return (
                  <div
                    key={habit.id}
                    className={`p-5 rounded-xl border transition-all ${
                      isCompletedToday
                        ? "bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200 hover:shadow-md"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${isCompletedToday ? "text-orange-800 dark:text-orange-300 line-through decoration-orange-300" : "text-slate-800 dark:text-slate-100"}`}>
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{habit.description}</p>
                        )}
                      </div>
                      {/* Points badge & Archive */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {habit.pointsReward}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm("Archive this habit? It will no longer appear here.")) {
                              archiveHabit.mutate(habit.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Archive Habit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Streak row */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* Current streak */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                        isOnFire
                          ? "bg-orange-100 text-orange-600 border border-orange-200"
                          : hasStreak
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-50 text-slate-400"
                      }`}>
                        <span>{isOnFire ? "🔥" : "🗓️"}</span>
                        <span>{habit.currentStreak} day streak</span>
                      </div>
                      {/* Personal best */}
                      {habit.longestStreak > 1 && (
                        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          Best: {habit.longestStreak}d
                        </div>
                      )}
                      
                      {/* Weekly frequency display */}
                      <div className="flex items-center gap-1 ml-auto" title="Last 7 days (Right side is Today)">
                        {habit.last7Days?.map((done, i) => (
                           <div key={i} className={`w-3.5 h-3.5 rounded-sm ${done ? 'bg-orange-400 dark:bg-orange-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                        ))}
                      </div>
                    </div>

                    {/* Check-in button */}
                    {isCompletedToday ? (
                      <button
                        onClick={() => unlogHabit.mutate({ habitId: habit.id, date: today })}
                        className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </button>
                    ) : (
                      <button
                        onClick={() => logHabit.mutate({ habitId: habit.id, date: today })}
                        className="w-full py-2 bg-slate-100 text-slate-600 hover:bg-orange-500 hover:text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ledger History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">Point Ledger</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-4">No points earned yet.</p>
                ) : (
                  history?.map((tx) => (
                    <div key={tx.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ml-3 ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
