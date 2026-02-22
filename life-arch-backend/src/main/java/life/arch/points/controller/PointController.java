package life.arch.points.controller;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.points.dto.RankResponse;
import life.arch.points.entity.PointTransaction;
import life.arch.points.repository.PointTransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/points")
public class PointController {

    private final PointTransactionRepository pointRepository;

    public PointController(PointTransactionRepository pointRepository) {
        this.pointRepository = pointRepository;
    }

    // 1. Get the current total score
    @GetMapping("/total")
    public ResponseEntity<Map<String, Integer>> getTotalPoints() {
        User currentUser = SecurityUtils.getCurrentUser();
        int total = pointRepository.getTotalPointsForUser(currentUser.getId());
        return ResponseEntity.ok(Map.of("totalPoints", total));
    }

    // 2. Get the ledger history
    @GetMapping("/history")
    public ResponseEntity<List<PointTransaction>> getPointHistory() {
        User currentUser = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(pointRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()));
    }

    // 3. Get the user's current rank & title
    @GetMapping("/rank")
    public ResponseEntity<RankResponse> getRank() {
        User currentUser = SecurityUtils.getCurrentUser();
        int points = pointRepository.getTotalPointsForUser(currentUser.getId());
        return ResponseEntity.ok(calculateRank(points));
    }

    // --- Rank Milestone Logic ---
    private record Milestone(int level, String title, String emoji, int pointsRequired) {
    }

    private static final Milestone[] MILESTONES = {
            new Milestone(1, "Beginner", "🌱", 0),
            new Milestone(2, "Explorer", "🧭", 500),
            new Milestone(3, "Builder", "🔨", 1000),
            new Milestone(4, "Achiever", "🎯", 2500),
            new Milestone(5, "Champion", "🏆", 5000),
            new Milestone(6, "Legend", "🌟", 10000),
    };

    private RankResponse calculateRank(int points) {
        Milestone current = MILESTONES[0];
        Milestone next = MILESTONES[1];

        for (int i = MILESTONES.length - 1; i >= 0; i--) {
            if (points >= MILESTONES[i].pointsRequired()) {
                current = MILESTONES[i];
                next = (i < MILESTONES.length - 1) ? MILESTONES[i + 1] : null;
                break;
            }
        }

        int nextMilestone = (next != null) ? next.pointsRequired() : current.pointsRequired();
        int prevMilestone = current.pointsRequired();
        int progress = (next == null) ? 100
                : (int) (((double) (points - prevMilestone) / (nextMilestone - prevMilestone)) * 100);

        return new RankResponse(
                current.level(),
                current.title(),
                current.emoji(),
                points,
                nextMilestone,
                Math.max(0, Math.min(100, progress)));
    }
}