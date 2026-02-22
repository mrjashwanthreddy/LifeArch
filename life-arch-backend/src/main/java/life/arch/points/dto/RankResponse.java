package life.arch.points.dto;

public record RankResponse(
        int level,
        String title,
        String emoji,
        int currentPoints,
        int nextMilestone,
        int progressPercent) {
}
