package life.arch.habits.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record HabitResponse(
        UUID id,
        String name,
        String description,
        String frequency,
        int pointsReward,
        boolean isArchived,
        OffsetDateTime createdAt,
        boolean isCompletedToday) {
}