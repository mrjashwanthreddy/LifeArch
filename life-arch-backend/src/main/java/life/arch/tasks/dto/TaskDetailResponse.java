package life.arch.tasks.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TaskDetailResponse(
    UUID id,
    String title,
    String notes,
    String priority,
    OffsetDateTime dueDatetime,
    boolean isCompleted,
    boolean isStarred,
    List<SubtaskDto> subtasks,
    List<CommentDto> comments
) {}