package life.arch.auth.controller;

import life.arch.auth.entity.User;
import life.arch.auth.repository.UserRepository;
import life.arch.auth.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final life.arch.github.service.GitHubService githubService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("timezone", user.getTimezone());
        response.put("githubConnected", user.isGithubConnected());
        response.put("githubUsername", user.getGithubUsername());
        response.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, String> updates) {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (updates.containsKey("fullName")) {
            user.setFullName(updates.get("fullName"));
        }
        if (updates.containsKey("timezone")) {
            user.setTimezone(updates.get("timezone"));
        }
        if (updates.containsKey("githubUsername")) {
            String githubUser = updates.get("githubUsername");
            user.setGithubUsername(githubUser);
            user.setGithubConnected(githubUser != null && !githubUser.isBlank());
        }

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/github-stats")
    public ResponseEntity<Map<String, Integer>> getGithubStats() {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.isGithubConnected() || user.getGithubUsername() == null) {
            return ResponseEntity.ok(Collections.emptyMap());
        }

        return ResponseEntity.ok(githubService.getContributionStats(user));
    }
}
