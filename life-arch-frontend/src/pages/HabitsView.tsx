import { useState } from "react";
import {
  useHabits,
  useCreateHabit,
  useLogHabit,
  useUnlogHabit,
  usePointHistory,
} from "../hooks/useHabits";

export default function HabitsView() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: history } = usePointHistory();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const unlogHabit = useUnlogHabit();

  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [newHabitPoints, setNewHabitPoints] = useState(10);
  const [isAdding, setIsAdding] = useState(false);

  // Get today's date in YYYY-MM-DD format based on local timezone
  const today = new Date().toLocaleDateString("en-CA");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    createHabit.mutate(
      {
        name: newHabitName,
        description: newHabitDesc,
        frequency: "DAILY",
        pointsReward: newHabitPoints,
      },
      {
        onSuccess: () => {
          setNewHabitName("");
          setNewHabitDesc("");
          setNewHabitPoints(10);
          setIsAdding(false);
        },
      },
    );
  };

  if (habitsLoading)
    return (
      <div className="p-8 text-slate-500 animate-pulse">Loading habits...</div>
    );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex-shrink-0 flex justify-between items-center z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Daily Habits
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Check off your routines and earn LifeArch points.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isAdding ? "Cancel" : "New Habit"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Habits Column */}
          <div className="lg:col-span-2 space-y-4">
            {isAdding && (
              <form
                onSubmit={handleCreate}
                className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm mb-6"
              >
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Habit Name (e.g., Read 10 Pages)"
                      className="w-full p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200"
                      autoFocus
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newHabitDesc}
                      onChange={(e) => setNewHabitDesc(e.target.value)}
                      placeholder="Short description (optional)"
                      className="w-full p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-600">
                      Points Reward:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newHabitPoints}
                      onChange={(e) =>
                        setNewHabitPoints(Number(e.target.value))
                      }
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
              <div className="text-center p-12 bg-white border border-slate-200 rounded-xl border-dashed">
                <p className="text-slate-500">
                  You haven't set up any habits yet.
                </p>
              </div>
            )}

            {/* Habit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {habits?.map((habit) => {
                // Use the authoritative isCompletedToday field from the backend
                const isCompletedToday = habit.isCompletedToday;

                return (
                  <div
                    key={habit.id}
                    className={`p-5 rounded-xl border transition-all ${isCompletedToday ? "bg-orange-50/50 border-orange-200 shadow-sm" : "bg-white border-slate-200 hover:border-orange-200 hover:shadow-md"}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3
                          className={`font-semibold ${isCompletedToday ? "text-orange-800 line-through decoration-orange-300" : "text-slate-800"}`}
                        >
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {habit.description}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {habit.pointsReward}
                      </span>
                    </div>

                    {isCompletedToday ? (
                      <button
                        onClick={() =>
                          unlogHabit.mutate({ habitId: habit.id, date: today })
                        }
                        className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Completed
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          logHabit.mutate({ habitId: habit.id, date: today })
                        }
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">
                  Point Ledger
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-4">
                    No points earned yet.
                  </p>
                ) : (
                  history?.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
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
