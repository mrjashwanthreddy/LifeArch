package life.arch.points.controller;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
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
        
        // Returning as a JSON object: { "totalPoints": 150 }
        return ResponseEntity.ok(Map.of("totalPoints", total));
    }

    // 2. Get the ledger history (Optional, but great for a "History" tab later)
    @GetMapping("/history")
    public ResponseEntity<List<PointTransaction>> getPointHistory() {
        User currentUser = SecurityUtils.getCurrentUser();
        return ResponseEntity.ok(pointRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()));
    }
}