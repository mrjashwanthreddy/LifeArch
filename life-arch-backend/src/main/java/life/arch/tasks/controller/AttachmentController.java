package life.arch.tasks.controller;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.tasks.dto.AttachmentResponse;
import life.arch.tasks.entity.Attachment;
import life.arch.tasks.entity.Task;
import life.arch.tasks.repository.AttachmentRepository;
import life.arch.tasks.repository.TaskRepository;
import life.arch.tasks.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final StorageService storageService;

    @PostMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file) throws IOException {

        User currentUser = SecurityUtils.getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        String storedPath = storageService.store(file);

        Attachment attachment = new Attachment();
        attachment.setTask(task);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setFilePath(storedPath);

        Attachment saved = attachmentRepository.save(attachment);

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID attachmentId) throws IOException {
        User currentUser = SecurityUtils.getCurrentUser();
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        // Security Check: Task must belong to user
        if (!attachment.getTask().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        Path path = storageService.load(attachment.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        attachment.getFileType() != null ? attachment.getFileType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID attachmentId) throws IOException {
        User currentUser = SecurityUtils.getCurrentUser();
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        if (!attachment.getTask().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        storageService.delete(attachment.getFilePath());
        attachmentRepository.delete(attachment);

        return ResponseEntity.noContent().build();
    }

    private AttachmentResponse mapToResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize(),
                "/api/v1/attachments/" + attachment.getId());
    }
}
