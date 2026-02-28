package life.arch.tasks.repository;

import life.arch.tasks.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
    List<Tag> findByUserIdOrderByNameAsc(UUID userId);

    Optional<Tag> findByNameAndUserId(String name, UUID userId);
}
