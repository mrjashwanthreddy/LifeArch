package life.arch.habits.controller;

import life.arch.habits.dto.HabitRequest;
import life.arch.habits.dto.HabitResponse;
import life.arch.habits.service.HabitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/habits")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    // 1. Create a new habit
    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody HabitRequest request) {
        return new ResponseEntity<>(habitService.createHabit(request), HttpStatus.CREATED);
    }

    // 2. Get all active habits
    @GetMapping
    public ResponseEntity<List<HabitResponse>> getMyHabits() {
        return ResponseEntity.ok(habitService.getMyHabits());
    }

    // 3. Log a habit for a specific date (Query param: ?date=2026-02-22)
    @PostMapping("/{habitId}/log")
    public ResponseEntity<Void> logHabit(
            @PathVariable UUID habitId,
            @RequestParam LocalDate date) {
        habitService.logHabit(habitId, date);
        return ResponseEntity.ok().build();
    }

    // 4. Undo a habit log for a specific date
    @DeleteMapping("/{habitId}/log")
    public ResponseEntity<Void> unlogHabit(
            @PathVariable UUID habitId,
            @RequestParam LocalDate date) {
        habitService.unlogHabit(habitId, date);
        return ResponseEntity.ok().build();
    }

    // 5. Archive a habit
    @PutMapping("/{habitId}/archive")
    public ResponseEntity<Void> archiveHabit(@PathVariable UUID habitId) {
        habitService.archiveHabit(habitId);
        return ResponseEntity.ok().build();
    }
}