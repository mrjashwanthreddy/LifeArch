package life.arch.projects.repository;

import life.arch.projects.entity.TaskGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskGroupRepository extends JpaRepository<TaskGroup, UUID> {
    
    // Fetch groups for a project, ordered for the Kanban board
    List<TaskGroup> findByProjectIdOrderBySortOrderAsc(UUID projectId);
    
    // Get the highest sort order to append new columns to the right
    Integer countByProjectId(UUID projectId);
}