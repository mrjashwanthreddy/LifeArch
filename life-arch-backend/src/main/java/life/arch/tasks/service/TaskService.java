package life.arch.tasks.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.projects.entity.Project;
import life.arch.projects.entity.TaskGroup;
import life.arch.projects.repository.ProjectRepository;
import life.arch.projects.repository.TaskGroupRepository;
import life.arch.tasks.dto.*;
import life.arch.tasks.entity.Subtask;
import life.arch.tasks.entity.Task;
import life.arch.tasks.entity.TaskComment;
import life.arch.tasks.repository.SubtaskRepository;
import life.arch.tasks.repository.TaskCommentRepository;
import life.arch.tasks.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final ProjectRepository projectRepository;
    private final SubtaskRepository subtaskRepository;
    private final TaskCommentRepository taskCommentRepository;

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Task task = new Task();

        task.setUser(currentUser);
        task.setTitle(request.title());
        task.setNotes(request.notes());
        task.setPriority(request.priority());
        task.setDueDatetime(request.dueDatetime());

        task.setPriority(request.priority());
        task.setDueDatetime(request.dueDatetime());
        task.setRrule(request.rrule()); // <-- ADD THIS LINE

        // Attach project if provided
        if (request.projectId() != null) {
            Project project = projectRepository.findByIdAndUserId(request.projectId(), currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Project not found or doesn't belong to user"));
            task.setProject(project);
        }

        // Attach Folder/Group if provided
        if (request.groupId() != null) {
            TaskGroup group = taskGroupRepository.findById(request.groupId())
                    .orElseThrow(() -> new IllegalArgumentException("Group not found"));
            // Verify the group actually belongs to a project the user owns
            if (!group.getProject().getUser().getId().equals(currentUser.getId())) {
                throw new IllegalArgumentException("Access denied to this group");
            }
            task.setTaskGroup(group);
        }

        Task savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasks(Boolean isCompleted, UUID projectId, Pageable pageable) {
        User currentUser = SecurityUtils.getCurrentUser();
        Page<Task> tasks = taskRepository.findTasksWithFilters(currentUser.getId(), isCompleted, projectId, pageable);
        return tasks.map(this::mapToResponse);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        task.setTitle(request.title());
        task.setNotes(request.notes());
        task.setPriority(request.priority());
        task.setDueDatetime(request.dueDatetime());

        task.setPriority(request.priority());
        task.setDueDatetime(request.dueDatetime());
        task.setRrule(request.rrule()); // <-- ADD THIS LINE

        // --- Add these lines to handle the toggles ---
        if (request.isCompleted() != null) {
            task.setCompleted(request.isCompleted());
        }
        if (request.isStarred() != null) {
            task.setStarred(request.isStarred());
        }
        // ---------------------------------------------

        if (request.projectId() != null) {
            Project project = projectRepository.findByIdAndUserId(request.projectId(), currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            task.setProject(project);
        } else {
            task.setProject(null);
        }

        Task updatedTask = taskRepository.save(task);
        return mapToResponse(updatedTask);
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        // Check if exists first to throw proper 404/error if needed, or just attempt delete
        if (!taskRepository.existsById(taskId)) {
            throw new IllegalArgumentException("Task not found");
        }
        taskRepository.deleteByIdAndUserId(taskId, currentUser.getId());
    }

    // Manual mapping for MVP. Can be swapped with MapStruct later if desired.
    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getNotes(),
                task.getPriority(),
                task.getDueDatetime(),
                task.isCompleted(),
                task.isStarred(),
                task.getProject() != null ? task.getProject().getId() : null,
                task.getTaskGroup() != null ? task.getTaskGroup().getId() : null, // Group ID mapped here later
                task.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public TaskDetailResponse getTaskDetails(UUID taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        List<SubtaskDto> subtasks = subtaskRepository.findByTaskIdOrderByTitleAsc(taskId)
                .stream()
                .map(st -> new SubtaskDto(st.getId(), st.getTitle(), st.isCompleted()))
                .toList();

        List<CommentDto> comments = taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(c -> new CommentDto(c.getId(), c.getContent(), c.getCreatedAt()))
                .toList();

        return new TaskDetailResponse(
                task.getId(), task.getTitle(), task.getNotes(), task.getPriority(),
                task.getDueDatetime(), task.isCompleted(), task.isStarred(),
                subtasks, comments
        );
    }

    @Transactional
    public SubtaskDto addSubtask(UUID taskId, SubtaskDto request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        Subtask subtask = new Subtask();
        subtask.setTask(task);
        subtask.setTitle(request.title());

        Subtask saved = subtaskRepository.save(subtask);
        return new SubtaskDto(saved.getId(), saved.getTitle(), saved.isCompleted());
    }

    @Transactional
    public SubtaskDto toggleSubtask(UUID taskId, UUID subtaskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        // Verify task ownership first to prevent IDOR attacks
        if (!taskRepository.existsById(taskId) || taskRepository.findByIdAndUserId(taskId, currentUser.getId()).isEmpty()) {
            throw new IllegalArgumentException("Task not found");
        }

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new IllegalArgumentException("Subtask not found"));

        subtask.setCompleted(!subtask.isCompleted());
        Subtask saved = subtaskRepository.save(subtask);
        return new SubtaskDto(saved.getId(), saved.getTitle(), saved.isCompleted());
    }

    @Transactional
    public CommentDto addComment(UUID taskId, CommentDto request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setUser(currentUser);
        comment.setContent(request.content());

        TaskComment saved = taskCommentRepository.save(comment);
        return new CommentDto(saved.getId(), saved.getContent(), saved.getCreatedAt());
    }

    @Transactional
    public TaskResponse moveTask(UUID taskId, UUID newGroupId) {
        User currentUser = SecurityUtils.getCurrentUser();

        // 1. Find the task
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied"));

        // 2. Find the new group
        TaskGroup group = taskGroupRepository.findById(newGroupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // 3. Verify the user owns the new group's project
        if (!group.getProject().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied to this group");
        }

        // 4. Update and save
        task.setTaskGroup(group);
        return mapToResponse(taskRepository.save(task));
    }
}