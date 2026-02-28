package life.arch.github.repository;

import life.arch.auth.entity.User;
import life.arch.github.entity.GitHubAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GitHubAccountRepository extends JpaRepository<GitHubAccount, UUID> {
    Optional<GitHubAccount> findByUser(User user);

    Optional<GitHubAccount> findByUserId(UUID userId);
}
