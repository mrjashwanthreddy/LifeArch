package life.arch.tasks.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import life.arch.common.entity.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tags")
@Getter
@Setter
public class Tag extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "color_hex", length = 7)
    private String colorHex = "#85a3c2";
}
