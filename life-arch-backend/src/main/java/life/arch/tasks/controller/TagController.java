package life.arch.tasks.controller;

import life.arch.auth.entity.User;
import life.arch.auth.utils.SecurityUtils;
import life.arch.tasks.dto.TagResponse;
import life.arch.tasks.entity.Tag;
import life.arch.tasks.repository.TagRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tags")
public class TagController {

    private final TagRepository tagRepository;

    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @GetMapping
    public ResponseEntity<List<TagResponse>> getMyTags() {
        User user = SecurityUtils.getCurrentUser();
        List<TagResponse> tags = tagRepository.findByUserIdOrderByNameAsc(user.getId())
                .stream()
                .map(t -> new TagResponse(t.getId(), t.getName(), t.getColorHex()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(tags);
    }

    public record TagUpdateRequest(String name, String colorHex) {
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<TagResponse> updateTag(@PathVariable UUID id, @RequestBody TagUpdateRequest req) {
        User user = SecurityUtils.getCurrentUser();
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        if (!tag.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied");
        }

        if (req.name() != null && !req.name().isBlank())
            tag.setName(req.name());
        if (req.colorHex() != null)
            tag.setColorHex(req.colorHex());

        tag = tagRepository.save(tag);
        return ResponseEntity.ok(new TagResponse(tag.getId(), tag.getName(), tag.getColorHex()));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTag(@PathVariable UUID id) {
        User user = SecurityUtils.getCurrentUser();
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        if (!tag.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied");
        }

        tagRepository.delete(tag);
        return ResponseEntity.noContent().build();
    }
}
