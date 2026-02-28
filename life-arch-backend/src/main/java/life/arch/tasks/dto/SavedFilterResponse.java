package life.arch.tasks.dto;

import java.util.UUID;

public record SavedFilterResponse(
        UUID id,
        String name,
        String colorHex,
        String queryString) {
}
