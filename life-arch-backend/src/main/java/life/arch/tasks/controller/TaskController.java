package life.arch.tasks.controller;

import jakarta.validation.Valid;
import life.arch.tasks.dto.*;
import life.arch.tasks.service.CalendarExpansionService;
import life.arch.tasks.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CalendarExpansionService calendarExpansionService;

    // Add this GET mapping
    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarTaskResponse>> getCalendarTasks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {

        List<CalendarTaskResponse> tasks = calendarExpansionService.getExpandedCalendarTasks(from, to);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}/group/{groupId}")
    public ResponseEntity<TaskResponse> moveTask(
            @PathVariable UUID id,
            @PathVariable UUID groupId) {
        return ResponseEntity.ok(taskService.moveTask(id, groupId));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<TaskResponse>> getTasks(
            @RequestParam(required = false) Boolean isCompleted,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Boolean isInbox,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean isStarred,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<TaskResponse> tasks = taskService.getTasks(isCompleted, projectId, isInbox, priority, isStarred, pageable);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request) {

        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDetailResponse> getTaskDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getTaskDetails(id));
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<SubtaskDto> addSubtask(
            @PathVariable UUID id,
            @Valid @RequestBody SubtaskDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addSubtask(id, request));
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<SubtaskDto> toggleSubtask(
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId) {
        return ResponseEntity.ok(taskService.toggleSubtask(taskId, subtaskId));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addComment(id, request));
    }
}
