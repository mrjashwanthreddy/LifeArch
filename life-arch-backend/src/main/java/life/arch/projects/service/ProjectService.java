package life.arch.projects.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.projects.dto.ProjectRequest;
import life.arch.projects.dto.ProjectResponse;
import life.arch.projects.dto.TaskGroupRequest;
import life.arch.projects.dto.TaskGroupResponse;
import life.arch.projects.entity.Project;
import life.arch.projects.entity.TaskGroup;
import life.arch.projects.repository.ProjectRepository;
import life.arch.projects.repository.TaskGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskGroupRepository taskGroupRepository;

    public ProjectService(ProjectRepository projectRepository, TaskGroupRepository taskGroupRepository) {
        this.projectRepository = projectRepository;
        this.taskGroupRepository = taskGroupRepository;
    }

    // --- Project Methods ---

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Project project = new Project();
        project.setUser(currentUser);
        project.setName(request.name());
        project.setDescription(request.description());

        if (request.colorHex() != null && !request.colorHex().isBlank()) {
            project.setColorHex(request.colorHex());
        }

        Project saved = projectRepository.save(project);

        // Auto-create a default group for the new project
        createTaskGroup(saved.getId(), new TaskGroupRequest("To Do", null));

        return mapToProjectResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getActiveProjects() {
        User currentUser = SecurityUtils.getCurrentUser();
        return projectRepository.findAllByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::mapToProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, ProjectRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Project project = projectRepository.findByIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        project.setName(request.name());
        project.setDescription(request.description());
        if (request.colorHex() != null && !request.colorHex().isBlank()) {
            project.setColorHex(request.colorHex());
        }

        return mapToProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Project project = projectRepository.findByIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        projectRepository.delete(project);
    }

    // --- Task Group Methods ---

    @Transactional
    public TaskGroupResponse createTaskGroup(UUID projectId, TaskGroupRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        // 1. Verify user owns the project
        Project project = projectRepository.findByIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found or access denied"));

        // 2. Determine sort order (append to the end)
        int nextOrder = taskGroupRepository.countByProjectId(projectId);

        TaskGroup group = new TaskGroup();
        group.setProject(project);
        group.setUser(currentUser); // <-- ADD THIS LINE
        group.setName(request.name());
        group.setSortOrder(nextOrder);
        group.setWipLimit(request.wipLimit());

        TaskGroup saved = taskGroupRepository.save(group);
        return mapToGroupResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskGroupResponse> getProjectGroups(UUID projectId) {
        User currentUser = SecurityUtils.getCurrentUser();

        // Verify ownership before returning data
        if (projectRepository.findByIdAndUserId(projectId, currentUser.getId()).isEmpty()) {
            throw new IllegalArgumentException("Project not found or access denied");
        }

        return taskGroupRepository.findByProjectIdOrderBySortOrderAsc(projectId)
                .stream()
                .map(this::mapToGroupResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskGroupResponse updateTaskGroup(UUID projectId, UUID groupId, TaskGroupRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        TaskGroup group = taskGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getProject().getId().equals(projectId)
                || !group.getProject().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        group.setName(request.name());
        group.setWipLimit(request.wipLimit());
        return mapToGroupResponse(taskGroupRepository.save(group));
    }

    @Transactional
    public void deleteTaskGroup(UUID projectId, UUID groupId) {
        User currentUser = SecurityUtils.getCurrentUser();
        TaskGroup group = taskGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (!group.getProject().getId().equals(projectId)
                || !group.getProject().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        taskGroupRepository.delete(group);
    }

    // --- Mappers ---

    private ProjectResponse mapToProjectResponse(Project project) {
        return new ProjectResponse(
                project.getId(), project.getName(), project.getDescription(),
                project.getColorHex(), project.isArchived(), project.getCreatedAt());
    }

    private TaskGroupResponse mapToGroupResponse(TaskGroup group) {
        return new TaskGroupResponse(
                group.getId(), group.getProject().getId(), group.getName(), group.getSortOrder(), group.getWipLimit());
    }
}