package life.arch.goals.dto;

import java.time.LocalDate;

public record GoalRequest(
        String title,
        String description,
        LocalDate targetDate) {
}
