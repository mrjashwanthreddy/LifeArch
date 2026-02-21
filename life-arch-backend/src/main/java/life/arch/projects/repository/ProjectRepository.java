package life.arch.projects.repository;

import life.arch.projects.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    // Security check for a single project
    Optional<Project> findByIdAndUserId(UUID id, UUID userId);
    
    // Fetch all active projects for the user's sidebar
    List<Project> findAllByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(UUID userId);
}