import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../store/authStore";
import {
  useTasks,
  useCreateTask,
  useToggleTaskCompletion,
  useTaskDetails,
  useAddSubtask,
  useToggleSubtask,
  useAddComment,
} from "../hooks/useTasks";

// --- Form Validation Schema for New Tasks ---
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
});
type TaskFormInputs = z.infer<typeof taskSchema>;

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { email, logout } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // React Query Hooks for Main List
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
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

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full relative">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-800">
              Your Tasks
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#7aa39c] hover:bg-[#688f88] text-white text-sm font-medium rounded-md shadow-sm transition-colors"
            >
              + New Task
            </button>
          </div>

          {/* Task List */}
          {isLoading && (
            <p className="text-slate-500 animate-pulse">Loading tasks...</p>
          )}
          {isError && (
            <p className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
              Error loading tasks. Please try refreshing.
            </p>
          )}

          <div className="space-y-3">
            {taskData?.content.map((task) => (
              <div
                key={task.id}
                className={`p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between transition-all ${task.isCompleted ? "opacity-60 bg-slate-100" : "hover:border-[#85a3c2]"}`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask.mutate(task)}
                    className="w-5 h-5 text-[#85a3c2] rounded border-slate-300 focus:ring-[#85a3c2] cursor-pointer"
                  />
                  <span
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`text-lg cursor-pointer transition-colors hover:text-[#85a3c2] ${task.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
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
              <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-xl">
                <p className="text-slate-400">
                  No tasks yet. Create one to get started!
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Sliding Task Detail Drawer */}
        <div
          className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out ${selectedTaskId ? "translate-x-0" : "translate-x-full"}`}
          style={{ top: "65px" }} // Offset by navbar height roughly
        >
          {selectedTaskId && (
            <div className="h-full flex flex-col overflow-y-auto p-6 pb-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Task Details
                </h3>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="text-slate-400 hover:text-slate-700 text-2xl font-bold rounded-full p-1 hover:bg-slate-100 transition-colors w-8 h-8 flex items-center justify-center"
                >
                  &times;
                </button>
              </div>

              <TaskDetailContent taskId={selectedTaskId} />
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-100 transform transition-all">
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              Create New Task
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
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
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600 bg-white"
                >
                  <option value="">No Priority</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Medium</option>
                  <option value="P3">P3 - Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-5 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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

// --- Sub-Component: Task Detail Drawer Content ---
function TaskDetailContent({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useTaskDetails(taskId);
  const addSubtask = useAddSubtask(taskId);
  const toggleSubtask = useToggleSubtask(taskId);
  const addComment = useAddComment(taskId);

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  if (isLoading)
    return (
      <div className="text-slate-500 animate-pulse">Loading details...</div>
    );
  if (!task)
    return (
      <div className="text-red-500 bg-red-50 p-3 rounded border border-red-200">
        Task not found.
      </div>
    );

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask.mutate(newSubtask);
      setNewSubtask("");
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment.mutate(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="space-y-8 h-full">
      {/* Title & Priority */}
      <div>
        <h4
          className={`text-xl font-semibold ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
        >
          {task.title}
        </h4>
        {task.priority && (
          <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded">
            {task.priority}
          </span>
        )}
      </div>

      {/* Subtasks Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            ></path>
          </svg>
          Subtasks
        </h5>

        <div className="space-y-3 mb-4">
          {task.subtasks.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-3 p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={sub.isCompleted}
                onChange={() => toggleSubtask.mutate(sub.id)}
                className="w-4 h-4 text-[#85a3c2] rounded border-slate-300 focus:ring-[#85a3c2] cursor-pointer"
              />
              <span
                className={`text-sm flex-1 ${sub.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
              >
                {sub.title}
              </span>
            </div>
          ))}
          {task.subtasks.length === 0 && (
            <p className="text-xs text-slate-400 italic">No subtasks yet.</p>
          )}
        </div>

        <div className="flex gap-2 relative">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add a new subtask..."
            className="flex-1 p-2 pr-16 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
          />
          <button
            onClick={handleAddSubtask}
            disabled={!newSubtask.trim() || addSubtask.isPending}
            className="absolute right-1 top-1 bottom-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 border-b pb-2">
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
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            ></path>
          </svg>
          Activity & Comments
        </h5>

        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
          {task.comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative"
            >
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {comment.content}
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block uppercase tracking-wider">
                {new Date(comment.createdAt).toLocaleDateString()} •{" "}
                {new Date(comment.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {task.comments.length === 0 && (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs text-slate-400">No activity yet.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none resize-none transition-all"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleAddComment();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">
              Press Cmd/Ctrl + Enter to post
            </span>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
              className="px-4 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
