package life.arch.tasks.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskResponse(
                UUID id,
                String title,
                String notes,
                String priority,
                OffsetDateTime dueDatetime,
                boolean isCompleted,
                boolean isStarred,
                UUID projectId,
                UUID groupId,
                java.util.List<TagResponse> tags,
                OffsetDateTime createdAt) {
}