package life.arch.tasks.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.projects.entity.Project;
import life.arch.projects.repository.ProjectRepository;
import life.arch.tasks.dto.TaskRequest;
import life.arch.tasks.dto.TaskResponse;
import life.arch.tasks.entity.Task;
import life.arch.tasks.repository.TaskRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Task task = new Task();

        task.setUser(currentUser);
        task.setTitle(request.title());
        task.setNotes(request.notes());
        task.setPriority(request.priority());
        task.setDueDatetime(request.dueDatetime());

        // Attach project if provided
        if (request.projectId() != null) {
            Project project = projectRepository.findByIdAndUserId(request.projectId(), currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Project not found or doesn't belong to user"));
            task.setProject(project);
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
                null, // Group ID mapped here later
                task.getCreatedAt()
        );
    }
}