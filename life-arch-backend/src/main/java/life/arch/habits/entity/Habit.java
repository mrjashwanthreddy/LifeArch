package life.arch.habits.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "habits")
public class Habit {

    // --- Getters and Setters ---
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Strict ownership
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // e.g., "DAILY", "WEEKLY"
    @Column(nullable = false)
    private String frequency = "DAILY";

    // How many points this habit is worth upon completion
    @Column(name = "points_reward", nullable = false)
    private int pointsReward = 10;

    @Column(name = "is_archived")
    private boolean isArchived = false;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

}