package life.arch.habits.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

public record HabitRequest(
        @NotBlank(message = "Habit name cannot be empty")
        String name,

        String description,

        String frequency,

        @Min(value = 1, message = "Points must be at least 1")
        Integer pointsReward
) {
}