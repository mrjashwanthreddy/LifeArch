import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
  useProjects,
  useProjectGroups,
  useCreateTaskGroup,
  useUpdateProject,
  useDeleteProject,
  useUpdateTaskGroup,
  useDeleteTaskGroup,
} from "../hooks/useProjects";
import { useTasks, useCreateTask, useMoveTask } from "../hooks/useTasks";
import type { Task } from "../hooks/useTasks";
import { useNavigate } from "react-router-dom";

// Helper to assign pastel colors based on column name
const getColumnTheme = (name: string) => {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("progress") ||
    lowerName.includes("doing") ||
    lowerName.includes("current")
  ) {
    return {
      border: "border-orange-200",
      topBar: "border-t-orange-300",
      bg: "bg-orange-50/30",
      headerBg: "bg-orange-100/50",
      text: "text-orange-900",
      badgeBg: "bg-orange-200/60",
      badgeText: "text-orange-800",
    };
  }

  if (
    lowerName.includes("complete") ||
    lowerName.includes("done") ||
    lowerName.includes("finish")
  ) {
    return {
      border: "border-emerald-200",
      topBar: "border-t-emerald-300", // A nice soft green
      bg: "bg-emerald-50/30",
      headerBg: "bg-emerald-100/50",
      text: "text-emerald-900",
      badgeBg: "bg-emerald-200/60",
      badgeText: "text-emerald-800",
    };
  }

  // Default (To Do, Backlog, etc) - using your dusty blue aesthetic
  return {
    border: "border-slate-200",
    topBar: "border-t-[#85a3c2]",
    bg: "bg-slate-50/50",
    headerBg: "bg-slate-100",
    text: "text-slate-700",
    badgeBg: "bg-white",
    badgeText: "text-slate-500",
  };
};

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Fetch Data
  const { data: projects } = useProjects();
  const { data: groups, isLoading: groupsLoading } = useProjectGroups(
    projectId || "",
  );
  const { data: taskPage, isLoading: tasksLoading } = useTasks({ projectId, size: 500 });

  // Mutations
  const createGroup = useCreateTaskGroup(projectId || "");
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateGroup = useUpdateTaskGroup(projectId || "");
  const deleteGroup = useDeleteTaskGroup(projectId || "");
  const createTask = useCreateTask();
  const moveTask = useMoveTask();

  // Component State
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  const [editingWipGroupId, setEditingWipGroupId] = useState<string | null>(null);
  const [editingWipLimit, setEditingWipLimit] = useState<number | "">("");

  // Local state for optimistic drag-and-drop updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Find the current project
  const project = Array.isArray(projects)
    ? projects.find((p) => p.id === projectId)
    : undefined;

  // Sync server tasks with local state whenever they load
  useEffect(() => {
    const taskList = taskPage?.content || [];
    setLocalTasks(taskList);
  }, [taskPage, projectId]);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroup.mutate(
        { name: newGroupName }, 
        {
          onSuccess: () => {
            setNewGroupName("");
            setIsAddingGroup(false);
          },
        }
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTask.mutate(
      { title: newTaskTitle, projectId: projectId, groupId: groupId },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setActiveGroupId(null);
        },
      },
    );
  };

  // --- Drag and Drop Logic ---
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const updatedTasks = Array.from(localTasks);
    const taskIndex = updatedTasks.findIndex((t) => t.id === draggableId);

    if (taskIndex > -1) {
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        groupId: destination.droppableId,
      };
      setLocalTasks(updatedTasks);
    }

    moveTask.mutate({ taskId: draggableId, groupId: destination.droppableId });
  };

  if (groupsLoading || tasksLoading)
    return (
      <div className="p-8 text-slate-500 animate-pulse">Loading board...</div>
    );
  if (!project)
    return <div className="p-8 text-slate-500">Project not found.</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Project Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between z-10 group/header">
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: project.colorHex }}
          ></span>
          
          {editingProjectId === project.id ? (
            <input
              autoFocus
              className="text-2xl font-bold text-slate-800 tracking-tight border-b-2 border-slate-400 outline-none w-64 bg-transparent"
              value={editingProjectName}
              onChange={(e) => setEditingProjectName(e.target.value)}
              onBlur={() => {
                if (editingProjectName.trim() && editingProjectName !== project.name) {
                  updateProject.mutate({ projectId: project.id, updates: { name: editingProjectName } });
                }
                setEditingProjectId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingProjectId(null);
              }}
            />
          ) : (
            <h2 
              className="text-2xl font-bold text-slate-800 tracking-tight cursor-pointer hover:bg-slate-50 px-2 py-1 -ml-2 rounded"
              onClick={() => {
                setEditingProjectName(project.name);
                setEditingProjectId(project.id);
              }}
            >
              {project.name}
            </h2>
          )}
        </div>
        
        {/* Delete Project Button */}
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
              deleteProject.mutate(project.id, {
                onSuccess: () => navigate("/")
              });
            }
          }}
          className="opacity-0 group-hover/header:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Project"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-slate-50/50">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex items-start gap-6 h-full pb-4">
            {/* Render Columns (Task Groups) */}
            {groups?.map((group) => {
              const groupTasks = localTasks.filter(
                (task) => task.groupId === group.id,
              );
              const theme = getColumnTheme(group.name); // <-- Get colors dynamically!

              return (
                <div
                  key={group.id}
                  className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl border-x border-b border-t-4 shadow-sm ${theme.border} ${theme.topBar} ${theme.bg}`}
                >
                  <div
                    className={`p-3 border-b flex justify-between items-center rounded-t-lg cursor-grab active:cursor-grabbing group/col ${theme.headerBg} ${theme.border}`}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                       {editingGroupId === group.id ? (
                        <input
                          autoFocus
                          className={`font-semibold text-sm tracking-wide bg-white border border-slate-300 rounded px-1 min-w-0 w-28 outline-none focus:border-slate-400 ${theme.text}`}
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onBlur={() => {
                            if (editingGroupName.trim() && editingGroupName !== group.name) {
                              updateGroup.mutate({ groupId: group.id, name: editingGroupName, wipLimit: group.wipLimit });
                            }
                            setEditingGroupId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") setEditingGroupId(null);
                          }}
                        />
                      ) : (
                        <h3
                          className={`font-semibold text-sm tracking-wide truncate cursor-pointer hover:underline ${theme.text}`}
                          onClick={() => {
                            setEditingGroupName(group.name);
                            setEditingGroupId(group.id);
                          }}
                          title="Click to rename"
                        >
                          {group.name}
                        </h3>
                      )}
                      
                      {/* Delete Column button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete section "${group.name}"? Tasks inside will become unassigned.`)) {
                            deleteGroup.mutate(group.id);
                          }
                        }}
                        className={`opacity-0 group-hover/col:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity flex-shrink-0 ${theme.text}`}
                        title="Delete Section"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                      </button>
                    </div>

                    {editingWipGroupId === group.id ? (
                      <input
                        autoFocus
                        type="number"
                        min="1"
                        placeholder="∞"
                        className={`w-12 text-xs font-bold px-1 py-0.5 rounded outline-none shadow-inner border border-slate-300 text-slate-800 ml-2`}
                        value={editingWipLimit}
                        onChange={(e) => setEditingWipLimit(e.target.value === "" ? "" : parseInt(e.target.value))}
                        onBlur={() => {
                          let val = editingWipLimit === "" ? null : Number(editingWipLimit);
                          if (val !== group.wipLimit) {
                            updateGroup.mutate({ groupId: group.id, name: group.name, wipLimit: val });
                          }
                          setEditingWipGroupId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditingWipGroupId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center ml-2 relative group/wip cursor-pointer" onClick={() => {
                        setEditingWipLimit(group.wipLimit || "");
                        setEditingWipGroupId(group.id);
                      }}>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
                            group.wipLimit && groupTasks.length > group.wipLimit
                              ? "bg-red-100 text-red-700 ring-2 ring-red-400 animate-pulse"
                              : `${theme.badgeBg} ${theme.badgeText}`
                          }`}
                          title={group.wipLimit ? `Limit: ${group.wipLimit}` : "Set WIP Limit"}
                        >
                          {groupTasks.length} {group.wipLimit ? `/ ${group.wipLimit}` : ""}
                        </span>
                        {/* Tooltip hint on hover */}
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/wip:opacity-100 pointer-events-none transition-opacity z-20">
                          {group.wipLimit ? "Edit limit" : "Set WIP limit"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Droppable Task Container */}
                  <Droppable droppableId={group.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-3 transition-colors ${snapshot.isDraggingOver ? "bg-black/5 rounded-b-xl" : ""}`}
                      >
                        <div className="space-y-3">
                          {groupTasks.map((task, index: number) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 rounded-lg border transition-all group select-none
                                    ${
                                      snapshot.isDragging
                                        ? "shadow-xl border-[#85a3c2] scale-105 rotate-2 z-50"
                                        : `shadow-sm hover:shadow-md hover:border-[#85a3c2] ${theme.border}`
                                    }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <p
                                      className={`text-sm font-medium ${task.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
                                    >
                                      {task.title}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.priority && (
                                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-wide">
                                        {task.priority}
                                      </span>
                                    )}
                                    {task.tags && task.tags.map((tag: any) => (
                                      <span key={tag.id} className="inline-block px-2 py-0.5 text-[10px] font-bold text-white rounded uppercase tracking-wide shadow-sm" style={{ backgroundColor: tag.colorHex }}>
                                        {tag.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>

                        {/* Inline Task Creation Form / Button */}
                        {activeGroupId === group.id ? (
                          <form
                            onSubmit={(e) => handleCreateTask(e, group.id)}
                            className="mt-3"
                          >
                            <textarea
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="What needs to be done?"
                              className="w-full p-3 text-sm border border-[#85a3c2] rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none shadow-sm resize-none"
                              rows={2}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCreateTask(e, group.id);
                                }
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveGroupId(null);
                                  setNewTaskTitle("");
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${theme.text} hover:bg-black/5`}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={
                                  !newTaskTitle.trim() || createTask.isPending
                                }
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#85a3c2] hover:bg-[#7291b0] rounded-md transition-colors disabled:opacity-50"
                              >
                                Add Task
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setActiveGroupId(group.id)}
                            className={`w-full py-2.5 mt-3 flex items-center justify-center gap-2 text-sm rounded-lg transition-all border border-dashed border-transparent hover:shadow-sm font-medium ${theme.text} hover:bg-white/60 hover:${theme.border}`}
                          >
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
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Add Task
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Add New Group Column */}
            <div className="w-80 flex-shrink-0">
              {isAddingGroup ? (
                <form
                  onSubmit={handleCreateGroup}
                  className="bg-white p-3 rounded-xl shadow-sm border border-slate-200"
                >
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Column name..."
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#85a3c2] outline-none mb-3"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createGroup.isPending || !newGroupName.trim()}
                      className="px-3 py-1.5 text-xs bg-[#85a3c2] hover:bg-[#7291b0] text-white font-medium rounded-lg"
                    >
                      Add List
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingGroup(true)}
                  className="w-full flex items-center gap-2 p-3 text-slate-500 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-200/50 rounded-xl border border-dashed border-slate-300 transition-colors font-medium text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add another list
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
