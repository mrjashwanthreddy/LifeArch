import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useTasks,
  useCreateTask,
  useToggleTaskCompletion,
  useTaskDetails,
  useAddSubtask,
  useToggleSubtask,
  useAddComment,
  useDeleteTask,
  useUpdateTask,
} from "../hooks/useTasks";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
  dueDatetime: z.string().optional(),
});
type TaskFormInputs = z.infer<typeof taskSchema>;

// Priority badge styles
const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-100 text-red-600",
  P2: "bg-amber-100 text-amber-600",
  P3: "bg-blue-100 text-blue-500",
};

export default function Dashboard() {
  const { data: allTasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTaskCompletion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
  });

  const taskList = Array.isArray(allTasks) ? allTasks : allTasks?.content || [];
  const inboxTasks = taskList.filter((task: any) => !task.projectId);

  const onSubmit = (data: TaskFormInputs) => {
    createTask.mutate(
      {
        title: data.title,
        priority: data.priority || undefined,
        dueDatetime: data.dueDatetime ? new Date(data.dueDatetime).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setIsModalOpen(false);
        },
      }
    );
  };

  const formatDueDate = (dueDatetime?: string) => {
    if (!dueDatetime) return null;
    const date = new Date(dueDatetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isPast = date < today && !isToday;
    const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return { label, isPast };
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main List Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">To Do</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#7aa39c] hover:bg-[#688f88] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm"
              >
                + New Task
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500 animate-pulse">Loading tasks...</div>
            ) : inboxTasks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 mb-2">Your inbox is clear!</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Tasks created without a project will show up here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inboxTasks.map((task: any) => {
                  const due = formatDueDate(task.dueDatetime);
                  return (
                    <div
                      key={task.id}
                      className={`bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border flex items-center gap-3 hover:shadow-md transition-all group ${
                        selectedTaskId === task.id ? "border-[#85a3c2] shadow-sm" : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => toggleTask.mutate(task)}
                        className="w-4 h-4 text-[#85a3c2] rounded border-slate-300 focus:ring-[#85a3c2] cursor-pointer flex-shrink-0"
                      />
                      <span
                        onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                        className={`flex-1 text-sm font-medium cursor-pointer hover:text-[#85a3c2] transition-colors ${
                          task.isCompleted ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {due && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${due.isPast ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {due.label}
                          </span>
                        )}
                        {task.priority && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${PRIORITY_STYLES[task.priority] || "bg-slate-100 text-slate-500"}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Sliding Task Detail Drawer */}
        <div
          className={`absolute inset-y-0 right-0 w-full md:w-[420px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ease-in-out ${
            selectedTaskId ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedTaskId && (
            <TaskDetailContent
              taskId={selectedTaskId}
              onClose={() => setSelectedTaskId(null)}
              onDeleted={() => setSelectedTaskId(null)}
            />
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Add to Inbox</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
                  autoFocus
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  {...register("priority")}
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                >
                  <option value="">No Priority</option>
                  <option value="P1">P1 — High</option>
                  <option value="P2">P2 — Medium</option>
                  <option value="P3">P3 — Low</option>
                </select>
                <input
                  {...register("dueDatetime")}
                  type="date"
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-5 py-2 text-sm bg-[#7aa39c] hover:bg-[#688f88] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
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

// ─── Task Detail Drawer ───────────────────────────────────────────────────────
function TaskDetailContent({
  taskId,
  onClose,
  onDeleted,
}: {
  taskId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { data: task, isLoading } = useTaskDetails(taskId);
  const addSubtask = useAddSubtask(taskId);
  const toggleSubtask = useToggleSubtask(taskId);
  const addComment = useAddComment(taskId);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDue, setEditDue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-slate-400 animate-pulse">Loading...</div>
      </div>
    );
  if (!task)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-red-400">Task not found.</div>
      </div>
    );

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditPriority(task.priority || "");
    setEditDue(task.dueDatetime ? new Date(task.dueDatetime).toISOString().slice(0, 10) : "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateTask.mutate(
      {
        taskId,
        updates: {
          title: editTitle,
          priority: editPriority || undefined,
          isCompleted: task.isCompleted,
          isStarred: task.isStarred,
          dueDatetime: editDue ? new Date(editDue).toISOString() : undefined,
        },
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(taskId, { onSuccess: onDeleted });
  };

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

  const PRIORITY_STYLES: Record<string, string> = {
    P1: "bg-red-100 text-red-600",
    P2: "bg-amber-100 text-amber-600",
    P3: "bg-blue-100 text-blue-500",
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Task Details</span>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="p-1.5 text-slate-400 hover:text-[#85a3c2] hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Delete Confirm Banner */}
        {showDeleteConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700 font-medium">Delete this task permanently?</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50"
              >
                {deleteTask.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}

        {/* Title & Metadata */}
        {isEditing ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-3 text-base font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
              placeholder="Task title"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none bg-white text-slate-600"
              >
                <option value="">No Priority</option>
                <option value="P1">P1 — High</option>
                <option value="P2">P2 — Medium</option>
                <option value="P3">P3 — Low</option>
              </select>
              <input
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                className="p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={updateTask.isPending || !editTitle.trim()}
                className="flex-1 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {updateTask.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4
              className={`text-lg font-semibold leading-snug ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
            >
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              {task.priority && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${PRIORITY_STYLES[task.priority] || "bg-slate-100 text-slate-500"}`}>
                  {task.priority}
                </span>
              )}
              {task.dueDatetime && (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.dueDatetime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Subtasks */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Subtasks</h5>
          <div className="space-y-2 mb-3">
            {task.subtasks.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={sub.isCompleted}
                  onChange={() => toggleSubtask.mutate(sub.id)}
                  className="w-4 h-4 text-[#85a3c2] rounded border-slate-300 cursor-pointer"
                />
                <span className={`text-sm flex-1 ${sub.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}>
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
              placeholder="Add subtask..."
              className="flex-1 p-2 pr-16 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim() || addSubtask.isPending}
              className="absolute right-1 top-1 bottom-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Comments</h5>
          <div className="space-y-3 mb-3">
            {task.comments.map((comment: any) => (
              <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{comment.content}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(comment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
            {task.comments.length === 0 && (
              <p className="text-xs text-slate-400 italic">No comments yet.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (Ctrl+Enter to post)"
              className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none resize-none"
              rows={3}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment(); }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
                className="px-4 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
