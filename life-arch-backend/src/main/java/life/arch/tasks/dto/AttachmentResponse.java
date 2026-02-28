package life.arch.tasks.dto;

import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String fileName,
        String fileType,
        Long fileSize,
        String downloadUrl) {
}
