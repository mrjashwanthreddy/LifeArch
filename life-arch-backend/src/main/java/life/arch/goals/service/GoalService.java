package life.arch.goals.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.goals.dto.GoalRequest;
import life.arch.goals.dto.GoalResponse;
import life.arch.goals.entity.Goal;
import life.arch.goals.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    @Transactional
    public GoalResponse createGoal(GoalRequest request) {
        User user = SecurityUtils.getCurrentUser();
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetDate(request.targetDate());
        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getGoals() {
        User user = SecurityUtils.getCurrentUser();
        return goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public GoalResponse completeGoal(UUID goalId) {
        User user = SecurityUtils.getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        goal.setCompleted(true);
        goal.setCompletedAt(LocalDate.now(ZoneId.of("Asia/Kolkata")));
        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(UUID goalId) {
        User user = SecurityUtils.getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        goalRepository.delete(goal);
    }

    private GoalResponse mapToResponse(Goal goal) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        long daysLeft = goal.getTargetDate() != null
                ? ChronoUnit.DAYS.between(today, goal.getTargetDate())
                : 0;
        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getTargetDate(),
                goal.isCompleted(),
                goal.getCompletedAt(),
                goal.getCreatedAt(),
                daysLeft);
    }
}
