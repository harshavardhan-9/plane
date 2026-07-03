package com.plane.comment.repository;

import com.plane.comment.entity.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, UUID> {
    List<CommentReaction> findAllByCommentId(UUID commentId);
    Optional<CommentReaction> findByCommentIdAndUserIdAndEmoji(UUID commentId, UUID userId, String emoji);

    @Modifying
    @Query("DELETE FROM CommentReaction r WHERE r.commentId = :commentId AND r.userId = :userId AND r.emoji = :emoji")
    void deleteByCommentIdAndUserIdAndEmoji(@Param("commentId") UUID commentId,
                                            @Param("userId") UUID userId,
                                            @Param("emoji") String emoji);
}
