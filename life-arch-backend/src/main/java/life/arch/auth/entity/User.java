package life.arch.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import life.arch.common.entity.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    // Getters and Setters...
    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 50)
    private String timezone = "UTC";

    @Column(name = "github_username")
    private String githubUsername;

    @Column(name = "github_connected", nullable = false)
    private boolean githubConnected = false;

}