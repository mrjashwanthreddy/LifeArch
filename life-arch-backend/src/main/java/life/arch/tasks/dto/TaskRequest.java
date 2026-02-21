package life.arch.tasks.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskRequest(
        @NotBlank(message = "Task title cannot be empty")
        String title,
        String notes,
        String priority,
        OffsetDateTime dueDatetime,
        Boolean isCompleted, // <-- Add this
        Boolean isStarred,   // <-- Add this
        UUID projectId,
        UUID groupId
) {}