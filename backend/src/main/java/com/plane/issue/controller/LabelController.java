package com.plane.issue.controller;

import com.plane.issue.dto.CreateLabelRequest;
import com.plane.issue.dto.LabelResponse;
import com.plane.issue.dto.UpdateLabelRequest;
import com.plane.issue.service.LabelService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects/{projectId}/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public List<LabelResponse> list(@PathVariable String slug,
                                    @PathVariable UUID projectId,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return labelService.findAll(slug, projectId, principal.getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LabelResponse create(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @Valid @RequestBody CreateLabelRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return labelService.create(slug, projectId, request, principal.getUserId());
    }

    @PatchMapping("/{labelId}")
    public LabelResponse update(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @PathVariable UUID labelId,
                                @RequestBody UpdateLabelRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return labelService.update(slug, projectId, labelId, request, principal.getUserId());
    }

    @DeleteMapping("/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @PathVariable UUID labelId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        labelService.delete(slug, projectId, labelId, principal.getUserId());
    }
}
