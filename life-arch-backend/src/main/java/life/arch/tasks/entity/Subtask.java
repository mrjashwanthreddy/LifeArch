package life.arch.tasks.entity;

import jakarta.persistence.*;
import life.arch.common.utils.IdGenerator;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "subtasks")
public class Subtask {

    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false)
    private String title;

    @Column(name = "is_completed")
    private boolean isCompleted = false;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = IdGenerator.generateUlidAsUuid();
        }
    }

}