package life.arch.tasks.service;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.tasks.dto.CalendarTaskResponse;
import life.arch.tasks.entity.Task;
import life.arch.tasks.entity.TaskOccurrence;
import life.arch.tasks.repository.TaskOccurrenceRepository;
import life.arch.tasks.repository.TaskRepository;
import net.fortuna.ical4j.model.DateList;
import net.fortuna.ical4j.model.DateTime;
import net.fortuna.ical4j.model.Recur;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CalendarExpansionService {

    private final TaskRepository taskRepository;
    private final TaskOccurrenceRepository taskOccurrenceRepository;

    public CalendarExpansionService(TaskRepository taskRepository, TaskOccurrenceRepository taskOccurrenceRepository) {
        this.taskRepository = taskRepository;
        this.taskOccurrenceRepository = taskOccurrenceRepository;
    }

    @Transactional(readOnly = true)
    public List<CalendarTaskResponse> getExpandedCalendarTasks(OffsetDateTime start, OffsetDateTime end) {
        User currentUser = SecurityUtils.getCurrentUser();

        // 1. Fetch all tasks that could overlap this window
        List<Task> overlappingTasks = taskRepository.findTasksForCalendarWindow(currentUser.getId(), start, end);
        if (overlappingTasks.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Fetch any specific completed occurrences for these tasks in this window
        List<UUID> taskIds = overlappingTasks.stream().map(Task::getId).toList();
        List<TaskOccurrence> occurrences = taskOccurrenceRepository
                .findByTaskIdInAndOccurrenceDatetimeBetween(taskIds, start, end);

        // Map them by TaskId + Date (truncated to day) for fast lookup O(1)
        Map<String, TaskOccurrence> occurrenceMap = occurrences.stream()
                .collect(Collectors.toMap(
                        occ -> generateOccurrenceKey(occ.getTask().getId(), occ.getOccurrenceDatetime()),
                        occ -> occ,
                        (existing, replacement) -> existing // Keep first if duplicate
                ));

        List<CalendarTaskResponse> expandedTasks = new ArrayList<>();

        // 3. Expand each task
        for (Task task : overlappingTasks) {
            if (task.getRrule() == null || task.getRrule().isBlank()) {
                // Not recurring: just add it if it falls in the window
                if (!task.getDueDatetime().isBefore(start) && !task.getDueDatetime().isAfter(end)) {
                    expandedTasks.add(createResponse(task, task.getDueDatetime(), task.isCompleted(), false));
                }
            } else {
                // Recurring: Let ical4j calculate the dates
                try {
                    net.fortuna.ical4j.model.Recur recur = new net.fortuna.ical4j.model.Recur(task.getRrule());

                    // 1. Convert java.time.OffsetDateTime to standard java.util.Date
                    java.util.Date utilTaskStart = java.util.Date.from(task.getDueDatetime().toInstant());
                    java.util.Date utilPeriodStart = java.util.Date.from(start.toInstant());
                    java.util.Date utilPeriodEnd = java.util.Date.from(end.toInstant());

                    // 2. Explicitly create ical4j DateTime objects
                    net.fortuna.ical4j.model.DateTime seed = new net.fortuna.ical4j.model.DateTime(utilTaskStart);
                    net.fortuna.ical4j.model.DateTime pStart = new net.fortuna.ical4j.model.DateTime(utilPeriodStart);
                    net.fortuna.ical4j.model.DateTime pEnd = new net.fortuna.ical4j.model.DateTime(utilPeriodEnd);

                    // 3. Fetch the recurring dates (Requires the 4th parameter: Value.DATE_TIME)
                    List<net.fortuna.ical4j.model.Date> dates = recur.getDates(
                            seed,
                            pStart,
                            pEnd,
                            net.fortuna.ical4j.model.parameter.Value.DATE_TIME
                    );

                    // 4. Add a transient DTO for each generated date
                    for (net.fortuna.ical4j.model.Date dateObj : dates) {
                        // Extract the raw milliseconds to safely convert back to java.time
                        java.util.Date utilDate = new java.util.Date(dateObj.getTime());
                        OffsetDateTime occurrenceDateTime = utilDate.toInstant().atOffset(ZoneOffset.UTC);

                        // Check if this specific instance was modified/completed
                        String key = generateOccurrenceKey(task.getId(), occurrenceDateTime);
                        boolean isCompleted = task.isCompleted(); // Default to master task state

                        if (occurrenceMap.containsKey(key)) {
                            isCompleted = occurrenceMap.get(key).isCompleted();
                        }

                        expandedTasks.add(createResponse(task, occurrenceDateTime, isCompleted, true));
                    }
                } catch (ParseException e) {
                    // Log the error for invalid RRULEs, but don't crash the whole calendar
                    System.err.println("Invalid RRULE for task " + task.getId() + ": " + e.getMessage());
                }
            }
        }

        // Sort chronologically before returning
        expandedTasks.sort(Comparator.comparing(CalendarTaskResponse::dueDatetime));
        return expandedTasks;
    }

    private String generateOccurrenceKey(UUID taskId, OffsetDateTime dateTime) {
        // Creates a key like: "123e4567-e89b-12d3-a456-426614174000_2026-02-21"
        return taskId.toString() + "_" + dateTime.toLocalDate().toString();
    }

    private CalendarTaskResponse createResponse(Task task, OffsetDateTime dueDatetime, boolean isCompleted, boolean isRecurring) {
        String occurrenceId = generateOccurrenceKey(task.getId(), dueDatetime);
        return new CalendarTaskResponse(
                occurrenceId,
                task.getId(),
                task.getTitle(),
                task.getPriority(),
                dueDatetime,
                isCompleted,
                isRecurring
        );
    }
}