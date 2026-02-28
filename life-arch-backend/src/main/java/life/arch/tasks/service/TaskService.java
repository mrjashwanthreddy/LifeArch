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
import life.arch.tasks.repository.TagRepository;
import life.arch.tasks.repository.TaskCommentRepository;
import life.arch.tasks.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import net.fortuna.ical4j.model.DateTime;
import net.fortuna.ical4j.model.Recur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
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
    private final TagRepository tagRepository;

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

        // Process Tags
        updateTasksTags(currentUser, task, request.tags());

        // Process Dependencies
        updateTaskDependencies(currentUser, task, request.blockedByIds());

        Task savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getTasks(Boolean isCompleted, UUID projectId, Boolean isInbox, String priority,
            Boolean isStarred, Pageable pageable) {
        User currentUser = SecurityUtils.getCurrentUser();
        Page<Task> tasks = taskRepository.findTasksWithFilters(
                currentUser.getId(), isCompleted, projectId, isInbox, priority, isStarred, pageable);
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
        task.setRrule(request.rrule());

        // --- Handle Task Completion & Recurrence ---
        boolean wasCompleted = task.isCompleted();
        boolean isCompletingNow = request.isCompleted() != null && request.isCompleted() && !wasCompleted;

        if (isCompletingNow && task.getRrule() != null && !task.getRrule().isBlank() && task.getDueDatetime() != null) {
            OffsetDateTime nextDue = calculateNextOccurrence(task.getRrule(), task.getDueDatetime());
            if (nextDue != null) {
                task.setDueDatetime(nextDue);
                // We intentionally do NOT set isCompleted to true, as it's rolled forward.
            } else {
                task.setCompleted(true); // Final occurrence reached
            }
        } else {
            if (request.dueDatetime() != null) {
                task.setDueDatetime(request.dueDatetime());
            }
            if (request.isCompleted() != null) {
                task.setCompleted(request.isCompleted());
            }
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

        // Process Tags
        updateTasksTags(currentUser, task, request.tags());

        // Process Dependencies
        updateTaskDependencies(currentUser, task, request.blockedByIds());

        Task updatedTask = taskRepository.save(task);
        return mapToResponse(updatedTask);
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        // Check if exists first to throw proper 404/error if needed, or just attempt
        // delete
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
                task.getTags().stream().map(tag -> new TagResponse(tag.getId(), tag.getName(), tag.getColorHex()))
                        .toList(),
                task.getCreatedAt());
    }

    private void updateTasksTags(User user, Task task, List<String> tagNames) {
        if (tagNames == null)
            return;
        java.util.Set<life.arch.tasks.entity.Tag> taskTags = new java.util.HashSet<>();
        for (String tagName : tagNames) {
            String sanitizedName = tagName.trim();
            if (sanitizedName.isEmpty())
                continue;
            life.arch.tasks.entity.Tag tag = tagRepository.findByNameAndUserId(sanitizedName, user.getId())
                    .orElseGet(() -> {
                        life.arch.tasks.entity.Tag newTag = new life.arch.tasks.entity.Tag();
                        newTag.setName(sanitizedName);
                        newTag.setUser(user);
                        return tagRepository.save(newTag);
                    });
            taskTags.add(tag);
        }
        task.setTags(taskTags);
    }

    private void updateTaskDependencies(User user, Task task, List<UUID> blockedByIds) {
        if (blockedByIds == null)
            return;

        java.util.Set<Task> blockedBy = new java.util.HashSet<>();
        if (!blockedByIds.isEmpty()) {
            List<Task> relatedTasks = taskRepository.findByIdInAndUserId(blockedByIds, user.getId());
            for (Task t : relatedTasks) {
                if (task.getId() == null || !t.getId().equals(task.getId())) {
                    blockedBy.add(t);
                }
            }
        }
        task.setBlockedBy(blockedBy);
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
                subtasks, comments,
                task.getTags().stream().map(tag -> new TagResponse(tag.getId(), tag.getName(), tag.getColorHex()))
                        .toList(),
                task.getBlockedBy().stream()
                        .map(t -> new TaskDependencyResponse(t.getId(), t.getTitle(), t.isCompleted())).toList(),
                task.getBlocking().stream()
                        .map(t -> new TaskDependencyResponse(t.getId(), t.getTitle(), t.isCompleted())).toList(),
                task.getAttachments().stream()
                        .map(a -> new AttachmentResponse(a.getId(), a.getFileName(), a.getFileType(), a.getFileSize(),
                                "/api/v1/attachments/" + a.getId()))
                        .toList());
    }

    private OffsetDateTime calculateNextOccurrence(String rruleStr, OffsetDateTime currentDue) {
        try {
            Recur recur = new Recur(rruleStr);
            java.util.Date start = java.util.Date.from(currentDue.toInstant());
            DateTime seed = new DateTime(start);
            // Search starting 1 minute after current due date
            java.util.Date searchStart = new java.util.Date(start.getTime() + 60000);
            // Search up to 5 years into the future to find the next valid date
            java.util.Date searchEnd = new java.util.Date(start.getTime() + 5L * 365 * 24 * 3600 * 1000);

            java.util.List<net.fortuna.ical4j.model.Date> nextDates = recur.getDates(
                    seed,
                    new DateTime(searchStart),
                    new DateTime(searchEnd),
                    net.fortuna.ical4j.model.parameter.Value.DATE_TIME);

            if (!nextDates.isEmpty()) {
                java.util.Date next = new java.util.Date(nextDates.get(0).getTime());
                return next.toInstant().atOffset(java.time.ZoneOffset.UTC);
            }
        } catch (Exception e) {
            System.err.println("Failed to calculate next occurrence for RRULE " + rruleStr + ": " + e.getMessage());
        }
        return null;
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
        if (!taskRepository.existsById(taskId)
                || taskRepository.findByIdAndUserId(taskId, currentUser.getId()).isEmpty()) {
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