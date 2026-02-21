package life.arch.tasks.entity;

import jakarta.persistence.*;
import life.arch.common.utils.IdGenerator;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "task_occurrences")
public class TaskOccurrence {

    // Getters and Setters
    @Id
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "occurrence_datetime", nullable = false)
    private OffsetDateTime occurrenceDatetime;

    @Column(name = "is_completed")
    private boolean isCompleted = false;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = IdGenerator.generateUlidAsUuid();
        }
    }

    public void setId(UUID id) { this.id = id; }

    public void setTask(Task task) { this.task = task; }

    public void setOccurrenceDatetime(OffsetDateTime occurrenceDatetime) { this.occurrenceDatetime = occurrenceDatetime; }

    public void setCompleted(boolean completed) { isCompleted = completed; }
}