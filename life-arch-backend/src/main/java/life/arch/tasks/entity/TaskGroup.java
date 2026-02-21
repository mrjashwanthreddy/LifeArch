package life.arch.tasks.entity;

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

    // Getters and Setters...
    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 7)
    private String color;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = IdGenerator.generateUlidAsUuid();
        }
    }

}