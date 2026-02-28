import { useState } from "react";
import GitHubHeatmap from "../components/GitHubHeatmap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { useCreateSavedFilter } from "../hooks/useSavedFilters";
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
  useUploadAttachment,
  useDeleteAttachment,
} from "../hooks/useTasks";
import { downloadFile } from "../lib/api";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
  dueDatetime: z.string().optional(),
  tags: z.string().optional(),
  rrule: z.string().optional(),
});
type TaskFormInputs = z.infer<typeof taskSchema>;

// Priority badge styles
const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-100 text-red-600",
  P2: "bg-amber-100 text-amber-600",
  P3: "bg-blue-100 text-blue-500",
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  
  const createFilter = useCreateSavedFilter();

  const isCompletedUrl = searchParams.get("isCompleted");
  const priorityUrl = searchParams.get("priority") || undefined;
  const isStarredUrl = searchParams.get("isStarred") === "true" ? true : undefined;

  const resolvedIsCompleted = isCompletedUrl !== null 
    ? (isCompletedUrl === "true" ? true : false) 
    : (filter === "ALL" ? undefined : filter === "COMPLETED");

  const { data: taskPage, isLoading } = useTasks({ 
    isInbox: true, 
    page, 
    size: 20, 
    isCompleted: resolvedIsCompleted,
    priority: priorityUrl,
    isStarred: isStarredUrl
  });

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

  const inboxTasks = taskPage?.content || [];
  const totalPages = taskPage?.totalPages || 1;

  const onSubmit = (data: TaskFormInputs) => {
    createTask.mutate(
      {
        title: data.title,
        priority: data.priority || undefined,
        dueDatetime: data.dueDatetime ? new Date(data.dueDatetime).toISOString() : undefined,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        rrule: data.rrule || undefined,
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

  const hasCustomFilters = Array.from(searchParams.keys()).length > 0;

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main List Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Left Column: Tasks */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Inbox</h2>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {(["ALL", "ACTIVE", "COMPLETED"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(0); }}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          filter === f
                            ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasCustomFilters && (
                    <button
                      onClick={() => {
                          const name = prompt("Enter a name for this custom filter:");
                          if (name) {
                              createFilter.mutate({ 
                                  name, 
                                  queryString: searchParams.toString(),
                                  colorHex: "#b4a5c8"
                              });
                          }
                      }}
                      className="text-slate-500 hover:text-[#85a3c2] transition-colors font-medium text-sm flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      Save View
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#7aa39c] hover:bg-[#688f88] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm"
                  >
                    + New Task
                  </button>
                </div>
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
                          {task.tags && task.tags.map((tag: any) => (
                             <span key={tag.id} className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide text-white shadow-sm" style={{ backgroundColor: tag.colorHex }}>
                               {tag.name}
                             </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button 
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <aside className="lg:w-80 flex-shrink-0 space-y-6">
              <GitHubHeatmap />
              
              {/* Optional Quick Stats or Info could go here later */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Pro Tip</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                   Connect your GitHub to track your developer consistency alongside your LifeArch habits. 
                   Set a daily commit goal to stay motivated!
                 </p>
              </div>
            </aside>
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
              <div>
                <input
                  {...register("tags")}
                  type="text"
                  placeholder="Tags (comma separated, e.g. urgency, home)"
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
                />
                <select
                  {...register("rrule")}
                  className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all mt-3"
                >
                  <option value="">Does not repeat</option>
                  <option value="FREQ=DAILY">Daily</option>
                  <option value="FREQ=WEEKLY">Weekly</option>
                  <option value="FREQ=MONTHLY">Monthly</option>
                  <option value="FREQ=YEARLY">Yearly</option>
                </select>
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
  const uploadAttachment = useUploadAttachment(taskId);
  const deleteAttachment = useDeleteAttachment(taskId);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editRrule, setEditRrule] = useState("");
  const [editTags, setEditTags] = useState("");
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
    setEditRrule(task.rrule || "");
    setEditTags(task.tags?.map((t: any) => t.name).join(", ") || "");
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
          tags: editTags ? editTags.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
          rrule: editRrule || undefined,
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
            <div>
              <input
                 value={editTags}
                 onChange={(e) => setEditTags(e.target.value)}
                 className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
                 placeholder="Tags (comma separated)"
              />
              <select
                value={editRrule}
                onChange={(e) => setEditRrule(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none bg-white text-slate-600 mt-2"
              >
                <option value="">Does not repeat</option>
                <option value="FREQ=DAILY">Daily</option>
                <option value="FREQ=WEEKLY">Weekly</option>
                <option value="FREQ=MONTHLY">Monthly</option>
                <option value="FREQ=YEARLY">Yearly</option>
              </select>
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
              {task.rrule && (
                <span className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md" title={task.rrule}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recurring
                </span>
              )}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag: any) => (
                  <span key={tag.id} className="inline-block px-2 py-0.5 text-[10px] font-bold text-white rounded uppercase tracking-wide shadow-sm" style={{ backgroundColor: tag.colorHex }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dependencies */}
        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-4">
          <h5 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Dependencies</h5>
          
          {/* Blocked By */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-slate-500">Blocked By:</span>
            {task.blockedBy && task.blockedBy.length > 0 ? (
              <div className="space-y-1 mt-1 flex flex-col items-start gap-1">
                {task.blockedBy.map((dep: any) => (
                  <span key={dep.id} className={`text-xs px-2 py-1 flex items-center gap-1.5 rounded-md border ${dep.isCompleted ? 'bg-slate-50 text-slate-400 border-slate-200 line-through' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    {dep.title}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 ml-2">None</span>
            )}
          </div>

          {/* Blocking */}
          <div>
            <span className="text-xs font-semibold text-slate-500">Blocking:</span>
            {task.blocking && task.blocking.length > 0 ? (
              <div className="space-y-1 mt-1 flex flex-col items-start gap-1">
                {task.blocking.map((dep: any) => (
                  <span key={dep.id} className={`text-xs px-2 py-1 flex items-center gap-1.5 rounded-md border ${dep.isCompleted ? 'bg-slate-50 text-slate-400 border-slate-200 line-through' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    {dep.title}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 ml-2">None</span>
            )}
          </div>
          
          <div className="mt-3">
            <input 
              type="text" 
              placeholder="Paste Task ID to block this task (Enter to save)" 
              className="w-full p-2 text-xs border border-orange-200 rounded bg-white outline-none focus:ring-1 focus:ring-orange-300 transition-shadow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    const currentIds = task.blockedBy?.map((b: any) => b.id) || [];
                    if (!currentIds.includes(val)) {
                      updateTask.mutate({ taskId, updates: { blockedByIds: [...currentIds, val] } });
                      e.currentTarget.value = "";
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attachments</h5>
          <div className="space-y-2 mb-3">
            {task.attachments && task.attachments.length > 0 ? (
              task.attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg">📄</span>
                    <div className="flex flex-col min-w-0">
                      <button
                        onClick={() => downloadFile(`/attachments/${file.id}`, file.fileName)}
                        className="text-left text-xs font-medium text-slate-700 hover:text-[#85a3c2] truncate outline-none"
                        title="Download"
                      >
                        {file.fileName}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteAttachment.mutate(file.id)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No attachments yet.</p>
            )}
          </div>
          <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#85a3c2] hover:bg-slate-100/50 cursor-pointer transition-all group">
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAttachment.mutate(file);
              }}
            />
            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#85a3c2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span className="text-xs font-medium text-slate-500 group-hover:text-[#85a3c2]">
              {uploadAttachment.isPending ? "Uploading..." : "Add Attachment"}
            </span>
          </label>
        </div>

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
