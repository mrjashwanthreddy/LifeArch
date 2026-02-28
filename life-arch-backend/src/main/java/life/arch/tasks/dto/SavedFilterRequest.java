package life.arch.tasks.dto;

import jakarta.validation.constraints.NotBlank;

public record SavedFilterRequest(
        @NotBlank(message = "Name cannot be empty") String name,
        String colorHex,
        @NotBlank(message = "Query string cannot be empty") String queryString) {
}
