import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../store/authStore";
import {
  useTasks,
  useCreateTask,
  useToggleTaskCompletion,
} from "../hooks/useTasks";

// Form validation schema
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
});

type TaskFormInputs = z.infer<typeof taskSchema>;

export default function Dashboard() {
  const { email, logout } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // React Query Hooks
  const { data: taskData, isLoading, isError } = useTasks(0, 20);
  const createTask = useCreateTask();
  const toggleTask = useToggleTaskCompletion();

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
  });

  const onSubmit = (data: TaskFormInputs) => {
    createTask.mutate(data, {
      onSuccess: () => {
        reset();
        setIsModalOpen(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-700">LifeArch Planner</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{email}</span>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-800">Your Tasks</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#7aa39c] hover:bg-[#688f88] text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            + New Task
          </button>
        </div>

        {/* Task List */}
        {isLoading && <p className="text-slate-500">Loading tasks...</p>}
        {isError && <p className="text-red-500">Error loading tasks.</p>}

        <div className="space-y-3">
          {taskData?.content.map((task) => (
            <div
              key={task.id}
              className={`p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between transition-all ${task.isCompleted ? "opacity-60 bg-slate-100" : ""}`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTask.mutate(task)}
                  className="w-5 h-5 text-[#85a3c2] rounded border-slate-300 focus:ring-[#85a3c2] cursor-pointer"
                />
                <span
                  className={`text-lg ${task.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
                >
                  {task.title}
                </span>
              </div>
              {task.priority && (
                <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md">
                  {task.priority}
                </span>
              )}
            </div>
          ))}
          {taskData?.content.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No tasks yet. Create one to get started!
            </p>
          )}
        </div>
      </main>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              Create New Task
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
                  autoFocus
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <select
                  {...register("priority")}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600"
                >
                  <option value="">No Priority</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Medium</option>
                  <option value="P3">P3 - Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-4 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {createTask.isPending ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
