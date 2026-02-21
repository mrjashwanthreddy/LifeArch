package life.arch.tasks.repository;

import life.arch.tasks.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // 1. Enforce user ownership on standard fetch
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);

    // 2. Fetch all tasks for a user with optional filters (completed status, project)
    @Query("""
                SELECT t FROM Task t
                WHERE t.user.id = :userId
                AND (:isCompleted IS NULL OR t.isCompleted = :isCompleted)
                AND (:projectId IS NULL OR t.project.id = :projectId)
            """)
    Page<Task> findTasksWithFilters(
            @Param("userId") UUID userId,
            @Param("isCompleted") Boolean isCompleted,
            @Param("projectId") UUID projectId,
            Pageable pageable
    );

    // 3. Optimized delete (prevents fetching the entity just to delete it)
    void deleteByIdAndUserId(UUID id, UUID userId);
}