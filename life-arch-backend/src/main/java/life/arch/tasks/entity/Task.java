package life.arch.tasks.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import life.arch.common.entity.BaseEntity;
import life.arch.projects.entity.Project;
import lombok.Data;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tasks")
@Data
public class Task extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 2)
    private String priority;

    @Column(name = "due_datetime")
    private OffsetDateTime dueDatetime;

    @Column(name = "is_completed")
    private boolean isCompleted = false;

    @Column(name = "is_starred")
    private boolean isStarred = false;

    @Column(length = 255)
    private String rrule;

    @Column(name = "reminder_offset_mins")
    private Integer reminderOffsetMins;

}