package life.arch.tasks.repository;

import life.arch.tasks.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {
    List<Subtask> findByTaskIdOrderByTitleAsc(UUID taskId);
}