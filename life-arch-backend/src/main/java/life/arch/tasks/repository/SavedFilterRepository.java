package life.arch.tasks.repository;

import life.arch.tasks.entity.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedFilterRepository extends JpaRepository<SavedFilter, UUID> {
    List<SavedFilter> findByUserIdOrderByNameAsc(UUID userId);
}
