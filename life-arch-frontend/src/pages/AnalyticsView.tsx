import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePointHistory } from "../hooks/useHabits";
import { useHabits } from "../hooks/useHabits";

// ─── Helper: derive daily points from the ledger history ─────────────────────
function buildDailyPoints(
  history: Array<{ amount: number; createdAt: string }>,
  days: number
) {
  // Bucket transactions into each date key
  const buckets: Record<string, number> = {};
  history.forEach((tx) => {
    const key = new Date(tx.createdAt).toLocaleDateString("en-CA"); // YYYY-MM-DD
    buckets[key] = (buckets[key] ?? 0) + tx.amount;
  });

  // Build the last `days` days with running cumulative total
  const result: { date: string; daily: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    const shortLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const daily = buckets[key] ?? 0;
    cumulative += daily;
    result.push({ date: shortLabel, daily, cumulative });
  }
  return result;
}

// ─── Helper: build 30-day completion heatmap for a habit ─────────────────────
function buildHabitHeatmap(
  history: Array<{ amount: number; description: string; createdAt: string }>,
  habitName: string
) {
  const loggedDates = new Set<string>();
  history.forEach((tx) => {
    if (tx.amount > 0 && tx.description?.includes(habitName)) {
      const key = new Date(tx.createdAt).toLocaleDateString("en-CA");
      loggedDates.add(key);
    }
  });

  const cells: { key: string; label: string; done: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    cells.push({ key, label, done: loggedDates.has(key) });
  }
  return cells;
}

// ─── Custom Tooltip for the chart ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-amber-600">+{payload[0]?.value ?? 0} pts today</p>
        <p className="text-slate-500">Total: {payload[1]?.value ?? 0} pts</p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsView() {
  const { data: history = [] } = usePointHistory();
  const { data: habits = [] } = useHabits();

  const dailyData = buildDailyPoints(history, 30);
  const totalEarned = history.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const activeDays = new Set(history.map((tx) => new Date(tx.createdAt).toLocaleDateString("en-CA"))).size;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your progress, visualised over the last 30 days.</p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Pts Earned" value={`+${totalEarned}`} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
            <StatCard label="Active Days" value={activeDays} color="text-[#85a3c2]" bg="bg-blue-50" border="border-blue-100" />
            <StatCard label="Habits Tracked" value={habits.length} color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
          </div>

          {/* Points Over Time — Area Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Points Over Time</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Daily earnings and running total for the last 30 days</p>

            {dailyData.every((d) => d.daily === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No point activity yet — check in some habits to see your chart!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#85a3c2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#85a3c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="daily"
                    name="Daily"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#dailyGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#85a3c2"
                    strokeWidth={2}
                    fill="url(#cumulGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-6 mt-3 justify-end">
              <LegendItem color="bg-amber-400" label="Daily pts" />
              <LegendItem color="bg-[#85a3c2]" label="Cumulative" />
            </div>
          </div>

          {/* Habit Heatmaps */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Habit Completion — Last 30 Days</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Each cell = one day. Green = completed, grey = missed.</p>

            {habits.length === 0 ? (
              <p className="text-slate-400 text-sm">No habits yet. Create some in the Habits & Points page!</p>
            ) : (
              <div className="space-y-6">
                {habits.map((habit) => {
                  const cells = buildHabitHeatmap(history, habit.name);
                  const doneCount = cells.filter((c) => c.done).length;
                  const pct = Math.round((doneCount / 30) * 100);
                  return (
                    <div key={habit.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{habit.name}</span>
                          {habit.currentStreak >= 3 && (
                            <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-md">
                              🔥 {habit.currentStreak}d
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{doneCount}/30 days ({pct}%)</span>
                      </div>
                      {/* Heatmap grid — 5 rows of 6 */}
                      <div className="flex flex-wrap gap-1.5">
                        {cells.map((cell) => (
                          <div
                            key={cell.key}
                            title={cell.label}
                            className={`w-6 h-6 rounded-md transition-colors cursor-default ${
                              cell.done
                                ? "bg-emerald-400 shadow-inner"
                                : "bg-slate-100 dark:bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      {/* Compact progress bar */}
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-1 bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-5 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
