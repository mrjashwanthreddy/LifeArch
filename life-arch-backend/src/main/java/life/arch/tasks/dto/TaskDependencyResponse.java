package life.arch.tasks.dto;

import java.util.UUID;

public record TaskDependencyResponse(
        UUID id,
        String title,
        boolean isCompleted) {
}
