import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCalendarTasks,
  useCreateTask,
  useTaskDetails,
  useAddSubtask,
  useToggleSubtask,
  useAddComment,
} from "../hooks/useTasks";

// --- Form Validation Schema ---
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.string().optional(),
});
type TaskFormInputs = z.infer<typeof taskSchema>;

export default function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);

  // View States
  const [dateRange, setDateRange] = useState({
    from: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString(),
    to: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString(),
  });

  // Modal & Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Queries & Mutations
  const { data: tasks, isLoading } = useCalendarTasks(
    dateRange.from,
    dateRange.to,
  );
  const createTask = useCreateTask();

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
  });

  // Map backend DTO to FullCalendar Event
  const events =
    tasks?.map((task) => ({
      id: task.occurrenceId,
      title: task.title,
      start: task.dueDatetime,
      allDay: false,
      backgroundColor: task.isCompleted ? "#cbd5e1" : "#85a3c2",
      borderColor: task.isCompleted ? "#cbd5e1" : "#85a3c2",
      extendedProps: {
        originalTaskId: task.originalTaskId,
        isCompleted: task.isCompleted,
        isRecurring: task.isRecurring,
        priority: task.priority,
      },
    })) || [];

  // --- Handlers ---
  const handleDatesSet = (dateInfo: any) => {
    setDateRange({ from: dateInfo.startStr, to: dateInfo.endStr });
  };

  const handleDateClick = (arg: any) => {
    // Treat the clicked date as midnight UTC for the form
    const clickedDate = new Date(arg.dateStr);
    setSelectedDate(clickedDate.toISOString());
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    // Open drawer using the master task ID
    setSelectedTaskId(arg.event.extendedProps.originalTaskId);
  };

  const onSubmit = (data: TaskFormInputs) => {
    // Merge the form data with the explicitly clicked date
    createTask.mutate(
      {
        ...data,
        dueDatetime: selectedDate || new Date().toISOString(),
      },
      {
        onSuccess: () => {
          reset();
          setIsModalOpen(false);
          setSelectedDate(null);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Calendar Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full min-h-[600px]">
            {isLoading && (
              <div className="mb-4 text-slate-500 animate-pulse">
                Syncing calendar...
              </div>
            )}

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              datesSet={handleDatesSet}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="100%"
              eventContent={renderEventContent}
              eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
            />
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
            <h3 className="text-lg font-bold mb-1 text-slate-800">
              Create New Task
            </h3>
            {selectedDate && (
              <p className="text-sm text-[#85a3c2] mb-4 font-medium">
                For: {new Date(selectedDate).toLocaleDateString()}
              </p>
            )}

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
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedDate(null);
                  }}
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

// Custom renderer for FullCalendar items
function renderEventContent(eventInfo: any) {
  const { isCompleted, isRecurring } = eventInfo.event.extendedProps;

  return (
    <div
      className={`px-2 py-1.5 rounded-md shadow-sm overflow-hidden flex items-center gap-1.5 w-full transition-all duration-200
        ${
          isCompleted
            ? "bg-slate-100 text-slate-500 line-through opacity-70 border border-slate-200"
            : "bg-[#85a3c2] text-white border border-[#7291b0] hover:shadow-md hover:-translate-y-[1px]"
        }`}
    >
      {isRecurring && (
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}
      <span className="text-xs truncate font-medium tracking-wide">
        {eventInfo.event.title}
      </span>
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

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
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
        <h5 className="font-semibold text-slate-700 mb-3 border-b pb-2">
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
            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none resize-none"
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
              className="px-4 py-2 bg-[#85a3c2] hover:bg-[#7291b0] text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
