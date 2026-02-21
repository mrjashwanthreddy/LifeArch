package life.arch.tasks.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentDto(
    UUID id,
    @NotBlank(message = "Comment content cannot be empty")
    String content,
    OffsetDateTime createdAt
) {}