package com.plane.comment.controller;

import com.plane.comment.dto.CommentResponse;
import com.plane.comment.dto.CreateCommentRequest;
import com.plane.comment.dto.UpdateCommentRequest;
import com.plane.comment.service.CommentService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects/{projectId}/issues/{issueId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public List<CommentResponse> list(@PathVariable String slug,
                                      @PathVariable UUID projectId,
                                      @PathVariable UUID issueId,
                                      @AuthenticationPrincipal UserPrincipal principal) {
        return commentService.findAll(slug, projectId, issueId, principal.getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(@PathVariable String slug,
                                  @PathVariable UUID projectId,
                                  @PathVariable UUID issueId,
                                  @Valid @RequestBody CreateCommentRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return commentService.create(slug, projectId, issueId, request, principal.getUserId());
    }

    @PatchMapping("/{commentId}")
    public CommentResponse update(@PathVariable String slug,
                                  @PathVariable UUID projectId,
                                  @PathVariable UUID issueId,
                                  @PathVariable UUID commentId,
                                  @Valid @RequestBody UpdateCommentRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return commentService.update(slug, projectId, issueId, commentId, request, principal.getUserId());
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @PathVariable UUID issueId,
                       @PathVariable UUID commentId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        commentService.delete(slug, projectId, issueId, commentId, principal.getUserId());
    }
}
