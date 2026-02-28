import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function ProfileView() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["userMe"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data;
    },
  });

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Your Profile
        </h2>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Timezone
              </label>
              <div className="text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                {user?.timezone}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Member Since
              </label>
              <div className="text-slate-600 dark:text-slate-400 text-sm">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Account Preferences
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Password and timezone updates are coming soon in Phase 3.
          </p>
          <button
            disabled
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium rounded-lg cursor-not-allowed border border-slate-200 dark:border-slate-700"
          >
            Update Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
