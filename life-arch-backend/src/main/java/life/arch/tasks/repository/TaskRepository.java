package life.arch.tasks.repository;

import life.arch.tasks.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // 1. Enforce user ownership on standard fetch
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);

    // 2. Fetch all tasks for a user with optional filters (completed status,
    // project, inbox)
    @Query("""
                SELECT t FROM Task t
                WHERE t.user.id = :userId
                AND (:isCompleted IS NULL OR t.isCompleted = :isCompleted)
                AND (:isInbox IS NULL OR (:isInbox = true AND t.project IS NULL))
                AND (:projectId IS NULL OR t.project.id = :projectId)
            """)
    Page<Task> findTasksWithFilters(
            @Param("userId") UUID userId,
            @Param("isCompleted") Boolean isCompleted,
            @Param("projectId") UUID projectId,
            @Param("isInbox") Boolean isInbox,
            Pageable pageable);

    // 3. Optimized delete (prevents fetching the entity just to delete it)
    void deleteByIdAndUserId(UUID id, UUID userId);

    // Fetch all tasks for a user that overlap with a specific calendar window
    @Query("""
                SELECT t FROM Task t
                WHERE t.user.id = :userId
                AND (
                    (t.rrule IS NULL AND t.dueDatetime >= :start AND t.dueDatetime <= :end)
                    OR
                    (t.rrule IS NOT NULL AND t.dueDatetime <= :end)
                )
            """)
    List<Task> findTasksForCalendarWindow(
            @Param("userId") UUID userId,
            @Param("start") java.time.OffsetDateTime start,
            @Param("end") java.time.OffsetDateTime end);
}