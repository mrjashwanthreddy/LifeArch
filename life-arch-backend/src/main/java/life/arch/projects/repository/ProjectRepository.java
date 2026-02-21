package life.arch.projects.repository;

import life.arch.projects.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    // Crucial for multi-tenant security: always check both Project ID and User ID
    Optional<Project> findByIdAndUserId(UUID id, UUID userId);
    
}