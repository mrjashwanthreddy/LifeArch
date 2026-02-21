package life.arch.projects.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import life.arch.common.entity.BaseEntity;
import life.arch.common.utils.IdGenerator;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "projects")
public class Project {

    // --- Getters and Setters ---
    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    // 1. Strict ownership linking
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Defaulting to a calm sage green for new projects
    @Column(name = "color_hex")
    private String colorHex = "#7aa39c";

    @Column(name = "is_archived")
    private boolean isArchived = false;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = IdGenerator.generateUlidAsUuid();
        }
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

}