package life.arch.projects.controller;

import jakarta.validation.Valid;
import life.arch.projects.dto.ProjectRequest;
import life.arch.projects.dto.ProjectResponse;
import life.arch.projects.dto.TaskGroupRequest;
import life.arch.projects.dto.TaskGroupResponse;
import life.arch.projects.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // --- Projects ---

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects() {
        return ResponseEntity.ok(projectService.getActiveProjects());
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable UUID projectId,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok().build();
    }

    // --- Task Groups (Nested Routes) ---

    @PostMapping("/{projectId}/groups")
    public ResponseEntity<TaskGroupResponse> createTaskGroup(
            @PathVariable UUID projectId,
            @Valid @RequestBody TaskGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createTaskGroup(projectId, request));
    }

    @GetMapping("/{projectId}/groups")
    public ResponseEntity<List<TaskGroupResponse>> getProjectGroups(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getProjectGroups(projectId));
    }

    @PutMapping("/{projectId}/groups/{groupId}")
    public ResponseEntity<TaskGroupResponse> updateTaskGroup(
            @PathVariable UUID projectId,
            @PathVariable UUID groupId,
            @Valid @RequestBody TaskGroupRequest request) {
        return ResponseEntity.ok(projectService.updateTaskGroup(projectId, groupId, request));
    }

    @DeleteMapping("/{projectId}/groups/{groupId}")
    public ResponseEntity<Void> deleteTaskGroup(
            @PathVariable UUID projectId,
            @PathVariable UUID groupId) {
        projectService.deleteTaskGroup(projectId, groupId);
        return ResponseEntity.ok().build();
    }
}