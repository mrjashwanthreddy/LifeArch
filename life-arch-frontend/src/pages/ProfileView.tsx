import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function ProfileView() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["userMe"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      const { data } = await api.put("/users/me", updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userMe"] });
      alert("Profile updated successfully!");
    },
    onError: () => {
      alert("Failed to update profile.");
    }
  });

  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [githubUsername, setGithubUsername] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setTimezone(user.timezone || "UTC");
      setGithubUsername(user.githubUsername || "");
    }
  }, [user]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ fullName, timezone, githubUsername });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500 animate-pulse">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Account Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your profile details and external integrations.
          </p>
        </header>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Identity Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Identity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-100 dark:border-slate-700 cursor-not-allowed">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Kolkata">IST (India Standard Time)</option>
                  <option value="America/New_York">EST (Eastern Standard Time)</option>
                  <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                  <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                </select>
              </div>
            </div>
          </div>

          {/* GitHub Integration Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  GitHub Integration
                </h3>
                {user?.githubConnected && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase">
                    Connected
                  </span>
                )}
              </div>
              
              {user?.githubConnected && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to disconnect your GitHub account?")) {
                      await api.delete("/github/disconnect");
                      queryClient.invalidateQueries({ queryKey: ["userMe"] });
                    }
                  }}
                  className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {user?.githubConnected 
                ? `Successfully linked to GitHub as ${user.githubUsername}. Your dashboard heatmap now includes your contribution data.`
                : "Connect your GitHub account to enable productivity heatmaps and commit streaks on your dashboard."
              }
            </p>

            {user?.githubConnected ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xl">
                  🐙
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.githubUsername}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Synced via OAuth</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const { data } = await api.get("/github/authorize");
                  if (data.url) window.location.href = data.url;
                }}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Connect with GitHub
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-6 py-2.5 bg-[#85a3c2] hover:bg-[#7291b0] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {updateProfile.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">
            Member Since {user?.createdAt? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
