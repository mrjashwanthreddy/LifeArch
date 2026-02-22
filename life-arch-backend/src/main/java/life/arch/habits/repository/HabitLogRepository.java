package life.arch.habits.repository;

import life.arch.habits.entity.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, UUID> {
    // Check if a habit was already completed on a specific day (prevents double-logging)
    boolean existsByHabitIdAndCompletedDate(UUID habitId, LocalDate completedDate);
    
    // Find a specific log to allow "undoing" a habit check-in
    Optional<HabitLog> findByHabitIdAndCompletedDate(UUID habitId, LocalDate completedDate);
}