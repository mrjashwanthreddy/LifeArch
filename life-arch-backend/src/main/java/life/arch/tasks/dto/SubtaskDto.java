package life.arch.tasks.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SubtaskDto(
    UUID id,
    @NotBlank(message = "Subtask title cannot be empty")
    String title,
    boolean isCompleted
) {}