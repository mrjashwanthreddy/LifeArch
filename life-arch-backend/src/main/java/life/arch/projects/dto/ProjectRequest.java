package life.arch.projects.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectRequest(
    @NotBlank(message = "Project name cannot be empty")
    String name,
    String description,
    String colorHex
) {}