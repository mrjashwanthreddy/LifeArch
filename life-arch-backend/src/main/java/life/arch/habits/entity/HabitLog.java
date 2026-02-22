package life.arch.habits.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Setter
@Getter
@Entity
@Table(name = "habit_logs")
public class HabitLog {

    // --- Getters and Setters ---
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    // The actual date the user is claiming they did the habit
    @Column(name = "completed_date", nullable = false)
    private LocalDate completedDate;

    @Column(name = "logged_at", updatable = false)
    private OffsetDateTime loggedAt;

    @PrePersist
    protected void onCreate() {
        if (this.loggedAt == null) {
            this.loggedAt = OffsetDateTime.now();
        }
    }

}