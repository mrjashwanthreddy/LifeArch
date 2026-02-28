package life.arch.tasks.controller;

import jakarta.validation.Valid;
import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.tasks.dto.SavedFilterRequest;
import life.arch.tasks.dto.SavedFilterResponse;
import life.arch.tasks.entity.SavedFilter;
import life.arch.tasks.repository.SavedFilterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/saved-filters")
public class SavedFilterController {

    private final SavedFilterRepository savedFilterRepository;

    public SavedFilterController(SavedFilterRepository savedFilterRepository) {
        this.savedFilterRepository = savedFilterRepository;
    }

    @GetMapping
    public ResponseEntity<List<SavedFilterResponse>> getMyFilters() {
        User user = SecurityUtils.getCurrentUser();
        List<SavedFilterResponse> filters = savedFilterRepository.findByUserIdOrderByNameAsc(user.getId())
                .stream()
                .map(f -> new SavedFilterResponse(f.getId(), f.getName(), f.getColorHex(), f.getQueryString()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filters);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<SavedFilterResponse> createFilter(@Valid @RequestBody SavedFilterRequest req) {
        User user = SecurityUtils.getCurrentUser();

        SavedFilter filter = new SavedFilter();
        filter.setUser(user);
        filter.setName(req.name());
        if (req.colorHex() != null)
            filter.setColorHex(req.colorHex());
        filter.setQueryString(req.queryString());

        filter = savedFilterRepository.save(filter);
        return ResponseEntity.ok(new SavedFilterResponse(filter.getId(), filter.getName(), filter.getColorHex(),
                filter.getQueryString()));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<SavedFilterResponse> updateFilter(@PathVariable UUID id,
            @Valid @RequestBody SavedFilterRequest req) {
        User user = SecurityUtils.getCurrentUser();
        SavedFilter filter = savedFilterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Filter not found"));

        if (!filter.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied");
        }

        filter.setName(req.name());
        if (req.colorHex() != null)
            filter.setColorHex(req.colorHex());
        filter.setQueryString(req.queryString());

        filter = savedFilterRepository.save(filter);
        return ResponseEntity.ok(new SavedFilterResponse(filter.getId(), filter.getName(), filter.getColorHex(),
                filter.getQueryString()));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteFilter(@PathVariable UUID id) {
        User user = SecurityUtils.getCurrentUser();
        SavedFilter filter = savedFilterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Filter not found"));

        if (!filter.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied");
        }

        savedFilterRepository.delete(filter);
        return ResponseEntity.noContent().build();
    }
}
