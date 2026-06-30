package com.plane.comment.repository;

import com.plane.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findAllByIssueIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID issueId);
    Optional<Comment> findByIdAndIssueIdAndDeletedAtIsNull(UUID id, UUID issueId);
}
