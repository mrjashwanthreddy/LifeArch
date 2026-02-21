package life.arch.tasks.repository;

import life.arch.tasks.entity.TaskOccurrence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface TaskOccurrenceRepository extends JpaRepository<TaskOccurrence, UUID> {

    // Fetches all occurrences for a list of tasks within the requested calendar month
    List<TaskOccurrence> findByTaskIdInAndOccurrenceDatetimeBetween(
            List<UUID> taskIds,
            OffsetDateTime start,
            OffsetDateTime end
    );
}