package life.arch.projects.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskGroupRequest(
        @NotBlank(message = "Group name cannot be empty") String name,
        Integer wipLimit) {
}