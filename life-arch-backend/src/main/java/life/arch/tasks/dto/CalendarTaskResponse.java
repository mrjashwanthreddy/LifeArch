package life.arch.tasks.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CalendarTaskResponse(
        String occurrenceId,     // e.g., "taskId_2026-02-21" (Crucial for React keys)
        UUID originalTaskId,     // The actual UUID in the database
        String title,
        String priority,
        OffsetDateTime dueDatetime,
        boolean isCompleted,
        boolean isRecurring      // Helps the UI show a little "repeat" icon
) {}