package life.arch.projects.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import life.arch.common.utils.IdGenerator;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "task_groups")
public class TaskGroup {

    // --- Getters and Setters ---
    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Belongs to a specific project
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // ADD THIS NEW MAPPING
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    // Allows the user to drag and drop columns/folders into a custom order
    @Column(name = "sort_order")
    private int sortOrder = 0;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = IdGenerator.generateUlidAsUuid();
        }
    }

}