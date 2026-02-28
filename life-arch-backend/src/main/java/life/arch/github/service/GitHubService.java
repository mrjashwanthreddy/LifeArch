package life.arch.github.service;

import life.arch.auth.entity.User;
import life.arch.auth.repository.UserRepository;
import life.arch.github.entity.GitHubAccount;
import life.arch.github.repository.GitHubAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitHubService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final GitHubAccountRepository gitHubAccountRepository;
    private final UserRepository userRepository;

    @Value("${github.client-id}")
    private String clientId;

    @Value("${github.client-secret}")
    private String clientSecret;

    @Transactional
    public void connectAccount(User user, String code) {
        // Exchange code for access token
        String tokenUrl = "https://github.com/login/oauth/access_token";
        Map<String, String> params = Map.of(
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", code);

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(tokenUrl, request, Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("Failed to obtain access token from GitHub");
        }

        String accessToken = (String) response.get("access_token");

        // Fetch GitHub user info
        headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> userRequest = new HttpEntity<>(headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> githubUser = restTemplate.exchange(
                "https://api.github.com/user",
                HttpMethod.GET,
                userRequest,
                Map.class).getBody();

        if (githubUser == null) {
            throw new RuntimeException("Failed to fetch user info from GitHub");
        }

        Long githubId = ((Number) githubUser.get("id")).longValue();
        String githubUsername = (String) githubUser.get("login");

        // Save or update GitHubAccount
        GitHubAccount account = gitHubAccountRepository.findByUser(user)
                .orElse(new GitHubAccount());

        account.setUser(user);
        account.setGithubId(githubId);
        account.setGithubUsername(githubUsername);
        account.setAccessToken(accessToken);
        account.setUpdatedAt(OffsetDateTime.now());

        gitHubAccountRepository.save(account);

        // Update User status
        user.setGithubConnected(true);
        user.setGithubUsername(githubUsername);
        userRepository.save(user);
    }

    @Transactional
    public void disconnectAccount(User user) {
        gitHubAccountRepository.findByUser(user).ifPresent(gitHubAccountRepository::delete);
        user.setGithubConnected(false);
        user.setGithubUsername(null);
        userRepository.save(user);
    }

    /**
     * Fetches contribution-like data for a user.
     * Uses access token if available to include private events.
     */
    public Map<String, Integer> getContributionStats(User user) {
        Optional<GitHubAccount> accountOpt = gitHubAccountRepository.findByUser(user);
        String username = user.getGithubUsername();

        if (username == null)
            return Collections.emptyMap();

        String url;
        HttpHeaders headers = new HttpHeaders();

        if (accountOpt.isPresent()) {
            // Fetch ALL events (including private if scope allows)
            url = String.format("https://api.github.com/users/%s/events", username);
            headers.setBearerAuth(accountOpt.get().getAccessToken());
        } else {
            // Fallback to public events only
            url = String.format("https://api.github.com/users/%s/events/public", username);
        }

        Map<String, Integer> dailyStats = new TreeMap<>();
        try {
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> events = restTemplate.exchange(url, HttpMethod.GET, entity, List.class).getBody();

            if (events != null) {
                for (Map<String, Object> event : events) {
                    String createdAt = (String) event.get("created_at");
                    if (createdAt != null) {
                        String date = createdAt.substring(0, 10);
                        dailyStats.put(date, dailyStats.getOrDefault(date, 0) + 1);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch GitHub events for user {}: {}", username, e.getMessage());
        }

        // Fill gaps for last 90 days
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 90; i++) {
            String dateStr = today.minusDays(i).format(DateTimeFormatter.ISO_LOCAL_DATE);
            dailyStats.putIfAbsent(dateStr, 0);
        }

        return dailyStats;
    }
}
