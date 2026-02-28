package life.arch.points.repository;

import life.arch.points.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, UUID> {

    // Get the user's ledger history
    List<PointTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Sum up all transactions to get the user's current total score!
    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PointTransaction pt WHERE pt.user.id = :userId")
    int getTotalPointsForUser(@Param("userId") UUID userId);

    // Fetch transactions within a recent timeframe for charts
    List<PointTransaction> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID userId,
            java.time.OffsetDateTime after);
}