package life.arch.habits.repository;

import life.arch.habits.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {
    // Fetch all active habits for the logged-in user
    List<Habit> findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(UUID userId);
}