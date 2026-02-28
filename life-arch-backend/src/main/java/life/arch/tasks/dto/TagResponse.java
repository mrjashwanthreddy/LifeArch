package life.arch.tasks.dto;

import java.util.UUID;

public record TagResponse(
        UUID id,
        String name,
        String colorHex) {
}
