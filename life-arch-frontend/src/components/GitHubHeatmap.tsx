import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface GitHubStats {
  [date: string]: number;
}

export default function GitHubHeatmap() {
  const { data: stats, isLoading } = useQuery<GitHubStats>({
    queryKey: ["githubStats"],
    queryFn: async () => {
      const { data } = await api.get("/users/github-stats");
      return data;
    },
    // Refresh every 10 minutes
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-pulse h-32 flex items-center justify-center">
        <span className="text-slate-400 text-sm font-medium">Crunching commit data...</span>
      </div>
    );
  }

  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  // Generate last 90 days
  const dates = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-100 dark:bg-slate-800";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900/40";
    if (count <= 4) return "bg-emerald-400 dark:bg-emerald-700/60";
    if (count <= 8) return "bg-emerald-500 dark:bg-emerald-500/80";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  const totalCommits = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">GitHub Activity</h4>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium tracking-tight">
            Last 90 Days
          </span>
        </div>
        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          {totalCommits} Contributions
        </div>
      </div>

      <div className="flex gap-[3px] flex-wrap">
        {dates.map((date) => {
          const count = stats[date] || 0;
          return (
            <div
              key={date}
              className={`w-[11px] h-[11px] rounded-[2px] ${getColor(count)} transition-all duration-300 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 cursor-help relative group`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-slate-700">
                  <span className="font-bold">{count} commits</span> on {new Date(date).toLocaleDateString("en-US", { month: 'short', day: 'numeric'})}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
         <span className="text-[10px] text-slate-400 font-medium">Less</span>
         <div className="flex gap-[3px]">
            <div className="w-[8px] h-[8px] rounded-[1px] bg-slate-100 dark:bg-slate-800"></div>
            <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-200 dark:bg-emerald-900/40"></div>
            <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-400 dark:bg-emerald-700/60"></div>
            <div className="w-[8px] h-[8px] rounded-[1px] bg-emerald-600 dark:bg-emerald-400"></div>
         </div>
         <span className="text-[10px] text-slate-400 font-medium">More</span>
      </div>
    </div>
  );
}
