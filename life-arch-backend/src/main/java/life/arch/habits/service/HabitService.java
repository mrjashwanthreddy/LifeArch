package life.arch.habits.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.habits.dto.HabitRequest;
import life.arch.habits.dto.HabitResponse;
import life.arch.habits.entity.Habit;
import life.arch.habits.entity.HabitLog;
import life.arch.habits.repository.HabitLogRepository;
import life.arch.habits.repository.HabitRepository;
import life.arch.points.entity.PointTransaction;
import life.arch.points.repository.PointTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final PointTransactionRepository pointTransactionRepository;

    public HabitService(HabitRepository habitRepository,
            HabitLogRepository habitLogRepository,
            PointTransactionRepository pointTransactionRepository) {
        this.habitRepository = habitRepository;
        this.habitLogRepository = habitLogRepository;
        this.pointTransactionRepository = pointTransactionRepository;
    }

    // 1. Create a new Habit
    @Transactional
    public HabitResponse createHabit(HabitRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        Habit habit = new Habit();
        habit.setUser(currentUser);
        habit.setName(request.name());
        habit.setDescription(request.description());

        if (request.frequency() != null) {
            habit.setFrequency(request.frequency());
        }
        if (request.pointsReward() != null) {
            habit.setPointsReward(request.pointsReward());
        }

        Habit savedHabit = habitRepository.save(habit);
        return mapToResponse(savedHabit);
    }

    // 2. Get all active habits for the user
    @Transactional(readOnly = true)
    public List<HabitResponse> getMyHabits() {
        User currentUser = SecurityUtils.getCurrentUser();
        return habitRepository.findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 3. Log a Habit (Check-in) AND Award Points
    @Transactional
    public void logHabit(UUID habitId, LocalDate date) {
        User currentUser = SecurityUtils.getCurrentUser();

        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new IllegalArgumentException("Habit not found"));

        // Security check
        if (!habit.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied to this habit");
        }

        // Prevent double-logging for the same day
        if (habitLogRepository.existsByHabitIdAndCompletedDate(habitId, date)) {
            return; // Already logged, do nothing
        }

        // A. Record the Check-in
        HabitLog log = new HabitLog();
        log.setHabit(habit);
        log.setCompletedDate(date);
        habitLogRepository.save(log);

        // B. Reward the Points in the Ledger
        PointTransaction pt = new PointTransaction();
        pt.setUser(currentUser);
        pt.setAmount(habit.getPointsReward());
        pt.setDescription("Completed habit: " + habit.getName());
        pointTransactionRepository.save(pt);
    }

    // 4. Undo a Habit Log AND Deduct Points
    @Transactional
    public void unlogHabit(UUID habitId, LocalDate date) {
        User currentUser = SecurityUtils.getCurrentUser();

        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new IllegalArgumentException("Habit not found"));

        if (!habit.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied to this habit");
        }

        Optional<HabitLog> logOpt = habitLogRepository.findByHabitIdAndCompletedDate(habitId, date);

        if (logOpt.isPresent()) {
            // A. Remove the Check-in
            habitLogRepository.delete(logOpt.get());

            // B. Deduct the Points (Negative Amount)
            PointTransaction pt = new PointTransaction();
            pt.setUser(currentUser);
            pt.setAmount(-habit.getPointsReward());
            pt.setDescription("Undid habit: " + habit.getName());
            pointTransactionRepository.save(pt);
        }
    }

    // 5. Archive a Habit
    @Transactional
    public void archiveHabit(UUID habitId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new IllegalArgumentException("Habit not found"));

        if (!habit.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied to this habit");
        }

        habit.setArchived(true);
        habitRepository.save(habit);
    }

    // Helper mapper — checks today's HabitLog for accurate isCompletedToday and
    // streaks
    private HabitResponse mapToResponse(Habit habit) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        boolean isCompletedToday = habitLogRepository.existsByHabitIdAndCompletedDate(habit.getId(), today);

        // Fetch all log dates sorted newest-first for streak calculation
        List<LocalDate> logDates = habitLogRepository
                .findByHabitIdOrderByCompletedDateDesc(habit.getId())
                .stream()
                .map(log -> log.getCompletedDate())
                .toList();

        int[] streaks = calculateStreaks(logDates, today);

        // Last 7 days status (from oldest to today)
        java.util.List<Boolean> last7Days = new java.util.ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            last7Days.add(logDates.contains(today.minusDays(i)));
        }

        return new HabitResponse(
                habit.getId(),
                habit.getName(),
                habit.getDescription(),
                habit.getFrequency(),
                habit.getPointsReward(),
                habit.isArchived(),
                habit.getCreatedAt(),
                isCompletedToday,
                streaks[0], // currentStreak
                streaks[1], // longestStreak
                last7Days); // last7Days
    }

    /**
     * Calculates current and longest streaks from a list of dates (newest-first).
     * Current streak: consecutive days ending on today or yesterday.
     * Longest streak: the maximum consecutive-day window across all history.
     */
    private int[] calculateStreaks(List<LocalDate> dates, LocalDate today) {
        if (dates.isEmpty())
            return new int[] { 0, 0 };

        // --- Current streak ---
        int current = 0;
        LocalDate expected = today;

        // If the habit wasn't done today, still allow it to count from yesterday
        if (!dates.contains(today)) {
            expected = today.minusDays(1);
        }

        for (LocalDate date : dates) {
            if (date.equals(expected)) {
                current++;
                expected = expected.minusDays(1);
            } else if (date.isBefore(expected)) {
                break;
            }
        }

        // --- Longest streak ---
        int longest = 0;
        int run = 1;
        for (int i = 1; i < dates.size(); i++) {
            LocalDate prev = dates.get(i - 1);
            LocalDate curr = dates.get(i);
            if (prev.minusDays(1).equals(curr)) {
                run++;
            } else {
                longest = Math.max(longest, run);
                run = 1;
            }
        }
        longest = Math.max(longest, run);

        return new int[] { current, longest };
    }
}
