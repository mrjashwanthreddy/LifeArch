package life.arch.goals.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String title,
        String description,
        LocalDate targetDate,
        boolean isCompleted,
        LocalDate completedAt,
        OffsetDateTime createdAt,
        long daysLeft // negative = past due
) {
}
