package life.arch.tasks.entity;

import jakarta.persistence.*;
import life.arch.auth.entity.User;
import life.arch.common.entity.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "saved_filters")
@Getter
@Setter
public class SavedFilter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "color_hex", length = 7)
    private String colorHex = "#85a3c2";

    @Column(name = "query_string", columnDefinition = "TEXT", nullable = false)
    private String queryString;
}
