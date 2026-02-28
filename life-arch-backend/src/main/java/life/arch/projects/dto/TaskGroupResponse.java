package life.arch.projects.dto;

import java.util.UUID;

public record TaskGroupResponse(
        UUID id,
        UUID projectId,
        String name,
        int sortOrder,
        Integer wipLimit) {
}