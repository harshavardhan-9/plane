package com.plane.comment.dto;

import com.plane.comment.entity.Comment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID issueId,
        UUID authorId,
        String body,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CommentResponse from(Comment c) {
        return new CommentResponse(c.getId(), c.getIssueId(), c.getAuthorId(),
                c.getBody(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
