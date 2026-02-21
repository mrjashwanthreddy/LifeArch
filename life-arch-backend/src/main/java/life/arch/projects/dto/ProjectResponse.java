package life.arch.projects.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    String name,
    String description,
    String colorHex,
    boolean isArchived,
    OffsetDateTime createdAt
) {}