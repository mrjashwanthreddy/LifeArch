import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useProjects, useCreateProject } from "../hooks/useProjects";
import { useRank } from "../hooks/useHabits";
import { useThemeStore } from "../store/themeStore";

const PROJECT_COLORS = ["#7aa39c", "#85a3c2", "#eba49c", "#d9c5b2", "#b4a5c8"];

// Nav link class builder — includes dark mode + active styles
const navCls =
  (active: string) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? active
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

export default function AppLayout() {
  const { email, logout } = useAuthStore();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProject = useCreateProject();
  const { data: rank } = useRank();
  const { isDark, toggle } = useThemeStore();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  // Rank-up toast
  const [rankUpToast, setRankUpToast] = useState<string | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!rank) return;
    if (prevLevelRef.current !== null && rank.level > prevLevelRef.current) {
      setRankUpToast(`${rank.emoji} You ranked up to ${rank.title}!`);
      setTimeout(() => setRankUpToast(null), 4000);
    }
    prevLevelRef.current = rank.level;
  }, [rank?.level]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createProject.mutate(
      { name: newProjectName, colorHex: selectedColor },
      {
        onSuccess: () => {
          setNewProjectName("");
          setIsModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">

      {/* Rank-Up Toast */}
      {rankUpToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-amber-400 text-amber-900 font-bold text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2">
            <span className="text-base">{rankUpToast.split(" ")[0]}</span>
            <span>{rankUpToast.split(" ").slice(1).join(" ")}</span>
          </div>
        </div>
      )}

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + controls */}
        <div className="p-5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-700 dark:text-slate-100 tracking-tight">
            LifeArch
          </h1>
          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Close button — mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-4">
          {/* Main nav */}
          <div className="space-y-1">
            <NavLink to="/app" end className={navCls("bg-slate-100 dark:bg-slate-800 text-[#85a3c2]")}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              To Do
            </NavLink>
            <NavLink to="/app/calendar" className={navCls("bg-slate-100 dark:bg-slate-800 text-[#85a3c2]")}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </NavLink>
            <NavLink to="/app/habits" className={navCls("bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400")}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Habits & Points
            </NavLink>
            <NavLink to="/app/goals" className={navCls("bg-blue-50 dark:bg-blue-900/30 text-[#85a3c2]")}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Goals
            </NavLink>
            <NavLink to="/app/analytics" className={navCls("bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400")}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </NavLink>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Projects
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-slate-400 hover:text-[#85a3c2] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {projectsLoading ? (
                <div className="px-3 text-sm text-slate-400 animate-pulse">Loading...</div>
              ) : projects?.length === 0 ? (
                <div className="px-3 text-xs text-slate-400 italic">No projects yet.</div>
              ) : (
                projects?.map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/app/projects/${project.id}`}
                    className={navCls("bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200")}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: project.colorHex }}
                    />
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Rank card + user footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 flex-shrink-0">
          {rank ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{rank.emoji}</span>
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{rank.title}</span>
                  <span className="text-[10px] text-amber-400 font-medium">Lv.{rank.level}</span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rank.currentPoints} pts</span>
              </div>
              {rank.level < 6 && (
                <div>
                  <div className="w-full bg-amber-100 dark:bg-amber-900/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-orange-400 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${rank.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1 text-right">
                    {rank.nextMilestone - rank.currentPoints} pts to next rank
                  </p>
                </div>
              )}
              {rank.level === 6 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center">
                  ✨ Max Rank Achieved!
                </p>
              )}
            </div>
          ) : (
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          )}
          <div className="flex items-center justify-between px-1">
            <NavLink
              to="/app/profile"
              className={({ isActive }) => `text-xs font-medium truncate pr-2 transition-colors ${isActive ? 'text-[#85a3c2]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              title="View Profile"
            >
              {email}
            </NavLink>
            <button
              onClick={logout}
              className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-slate-700 dark:text-slate-100 text-base">LifeArch</span>
        </div>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
          <Outlet />
        </main>
      </div>

      {/* ── Create Project Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
                autoFocus
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Color Label
                </label>
                <div className="flex gap-3">
                  {PROJECT_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(hex)}
                      className={`w-6 h-6 rounded-full shadow-sm transition-transform ${
                        selectedColor === hex
                          ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending || !newProjectName.trim()}
                  className="px-4 py-2 text-sm bg-[#85a3c2] hover:bg-[#7291b0] text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {createProject.isPending ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
