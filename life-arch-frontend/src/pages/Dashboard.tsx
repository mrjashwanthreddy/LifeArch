import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useTasks,
  useCreateTask,
  useToggleTaskCompletion, // <-- CHANGED THIS LINE
  useTaskDetails,
  useAddSubtask,
  useToggleSubtask,
  useAddComment,
} from "../hooks/useTasks";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
});
type TaskFormInputs = z.infer<typeof taskSchema>;

export default function Dashboard() {
  const { data: allTasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTaskCompletion(); // <-- CHANGED THIS LINE

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

  // Safely extract tasks and strictly filter for Inbox (no project attached)
  const taskList = Array.isArray(allTasks) ? allTasks : allTasks?.content || [];
  const inboxTasks = taskList.filter((task: any) => !task.projectId);

  const onSubmit = (data: TaskFormInputs) => {
    createTask.mutate(data, {
      onSuccess: () => {
        reset();
        setIsModalOpen(false);
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main List Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Inbox</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#7aa39c] hover:bg-[#688f88] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm"
              >
                + New Task
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500 animate-pulse">
                Loading tasks...
              </div>
            ) : inboxTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-2">Your inbox is clear!</p>
                <p className="text-sm text-slate-400">
                  Tasks created without a project will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboxTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md hover:border-[#85a3c2] transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => toggleTask.mutate(task)}
                        className="w-5 h-5 text-[#85a3c2] rounded border-slate-300 focus:ring-[#85a3c2] cursor-pointer flex-shrink-0"
                      />
                      <span
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`font-medium cursor-pointer hover:text-[#85a3c2] transition-colors ${task.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.priority && (
                        <span className="px-2.5 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase tracking-wide">
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Sliding Task Detail Drawer */}
        <div
          className={`absolute inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl border-l border-slate-200 z-40 transform transition-transform duration-300 ease-in-out ${selectedTaskId ? "translate-x-0" : "translate-x-full"}`}
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
              Add to Inbox
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register("title")}
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all"
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
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none text-slate-600 bg-white"
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

// Sub-Component: Task Detail Drawer Content
function TaskDetailContent({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useTaskDetails(taskId);
  const addSubtask = useAddSubtask(taskId);
  const toggleSubtask = useToggleSubtask(taskId);
  const addComment = useAddComment(taskId);

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  if (isLoading)
    return (
      <div className="text-sm text-slate-500 animate-pulse">
        Loading details...
      </div>
    );
  if (!task) return <div className="text-sm text-red-500">Task not found.</div>;

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
      <div>
        <h4
          className={`text-lg font-semibold ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
        >
          {task.title}
        </h4>
        {task.priority && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase">
            {task.priority}
          </span>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h5 className="text-sm font-semibold text-slate-700 mb-3">Subtasks</h5>
        <div className="space-y-3 mb-4">
          {task.subtasks.map((sub: any) => (
            <div key={sub.id} className="flex items-center gap-3 p-1">
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
            placeholder="Add subtask..."
            className="flex-1 p-2 pr-16 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none"
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
            className="absolute right-1 top-1 bottom-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">
          Comments
        </h5>
        <div className="space-y-4 mb-4">
          {task.comments.map((comment: any) => (
            <div
              key={comment.id}
              className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
            >
              <p className="text-sm text-slate-700">{comment.content}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleAddComment();
              }
            }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
              className="px-4 py-2 bg-[#85a3c2] text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
