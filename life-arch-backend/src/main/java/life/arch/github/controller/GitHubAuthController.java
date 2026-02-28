package life.arch.github.controller;

import life.arch.auth.entity.User;
import life.arch.auth.repository.UserRepository;
import life.arch.auth.utils.SecurityUtils;
import life.arch.github.service.GitHubService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GitHubAuthController {

    private final GitHubService gitHubService;
    private final UserRepository userRepository;

    @Value("${github.client-id}")
    private String clientId;

    @Value("${github.redirect-uri}")
    private String redirectUri;

    @Value("${application.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/authorize")
    public ResponseEntity<Map<String, String>> authorize() {
        User currentUser = SecurityUtils.getCurrentUser();
        // Use user ID as state to identify the user in the stateless callback
        String state = currentUser.getId().toString();

        String url = String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user,repo&state=%s",
                clientId,
                redirectUri,
                state);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam String code, @RequestParam String state) {
        // Find user by state (UUID)
        User user = userRepository.findById(java.util.UUID.fromString(state))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        gitHubService.connectAccount(user, code);

        // Redirect back to profile page on the frontend
        return ResponseEntity.status(302)
                .location(URI.create(frontendUrl + "/profile?connected=github"))
                .build();
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Void> disconnect() {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        gitHubService.disconnectAccount(user);
        return ResponseEntity.noContent().build();
    }
}
