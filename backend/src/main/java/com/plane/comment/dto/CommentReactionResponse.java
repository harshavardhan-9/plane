package com.plane.comment.dto;

import com.plane.comment.entity.CommentReaction;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentReactionResponse(UUID id, UUID commentId, UUID userId, String emoji, OffsetDateTime createdAt) {
    public static CommentReactionResponse from(CommentReaction r) {
        return new CommentReactionResponse(r.getId(), r.getCommentId(), r.getUserId(), r.getEmoji(), r.getCreatedAt());
    }
}
