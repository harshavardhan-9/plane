package com.plane.comment.service;

import com.plane.comment.dto.*;
import com.plane.comment.entity.Comment;
import com.plane.comment.entity.CommentReaction;
import com.plane.comment.repository.CommentReactionRepository;
import com.plane.comment.repository.CommentRepository;
import com.plane.issue.entity.Issue;
import com.plane.issue.entity.IssueActivity;
import com.plane.issue.entity.IssueActivityVerb;
import com.plane.issue.repository.IssueActivityRepository;
import com.plane.issue.repository.IssueRepository;
import com.plane.project.entity.Project;
import com.plane.project.entity.ProjectMember;
import com.plane.project.entity.ProjectNetwork;
import com.plane.project.entity.ProjectRole;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.kafka.event.CommentEvent;
import com.plane.kafka.producer.DomainEventPublisher;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final DomainEventPublisher eventPublisher;
    private final IssueRepository issueRepository;
    private final IssueActivityRepository issueActivityRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> findAll(String slug, UUID projectId, UUID issueId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getIssue(issueId, projectId);
        return commentRepository.findAllByIssueIdAndDeletedAtIsNullOrderByCreatedAtAsc(issueId).stream()
                .map(CommentResponse::from).toList();
    }

    @Transactional
    public CommentResponse create(String slug, UUID projectId, UUID issueId, CreateCommentRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        getIssue(issueId, projectId);

        Comment comment = commentRepository.saveAndFlush(Comment.builder()
                .issueId(issueId)
                .authorId(userId)
                .body(request.body())
                .build());

        issueActivityRepository.save(IssueActivity.builder()
                .issueId(issueId).actorId(userId)
                .verb(IssueActivityVerb.COMMENTED)
                .field("comment").newValue(comment.getBody())
                .build());

        eventPublisher.publish(CommentEvent.added(comment.getId(), issueId, projectId, workspace.getId(), userId));
        return CommentResponse.from(comment);
    }

    @Transactional
    public CommentResponse update(String slug, UUID projectId, UUID issueId, UUID commentId,
            UpdateCommentRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        Comment comment = getComment(commentId, issueId);
        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("Only the comment author can edit this comment");
        }
        comment.setBody(request.body());
        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID issueId, UUID commentId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        Comment comment = getComment(commentId, issueId);
        if (!comment.getAuthorId().equals(userId)) {
            requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        }
        comment.softDelete();
        commentRepository.save(comment);

        issueActivityRepository.save(IssueActivity.builder()
                .issueId(issueId).actorId(userId)
                .verb(IssueActivityVerb.COMMENT_DELETED)
                .field("comment").oldValue(comment.getBody())
                .build());

        eventPublisher.publish(CommentEvent.deleted(commentId, issueId, projectId, workspace.getId(), userId));
    }

    @Transactional(readOnly = true)
    public List<CommentReactionResponse> listReactions(String slug, UUID projectId, UUID issueId,
            UUID commentId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getComment(commentId, issueId);
        return commentReactionRepository.findAllByCommentId(commentId).stream()
                .map(CommentReactionResponse::from).toList();
    }

    @Transactional
    public CommentReactionResponse addReaction(String slug, UUID projectId, UUID issueId,
            UUID commentId, AddReactionRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getComment(commentId, issueId);
        if (commentReactionRepository.findByCommentIdAndUserIdAndEmoji(commentId, userId, request.emoji()).isPresent()) {
            throw new ConflictException("You have already reacted with this emoji");
        }
        return CommentReactionResponse.from(commentReactionRepository.saveAndFlush(
                CommentReaction.builder()
                        .commentId(commentId).userId(userId).emoji(request.emoji())
                        .build()));
    }

    @Transactional
    public void removeReaction(String slug, UUID projectId, UUID issueId,
            UUID commentId, UUID reactionId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getComment(commentId, issueId);
        CommentReaction reaction = commentReactionRepository.findById(reactionId)
                .filter(r -> r.getCommentId().equals(commentId))
                .orElseThrow(() -> new ResourceNotFoundException("Reaction not found"));
        if (!reaction.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only remove your own reactions");
        }
        commentReactionRepository.deleteById(reactionId);
    }

    private Comment getComment(UUID commentId, UUID issueId) {
        return commentRepository.findByIdAndIssueIdAndDeletedAtIsNull(commentId, issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    private Issue getIssue(UUID issueId, UUID projectId) {
        return issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(issueId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private Project getProject(UUID projectId, UUID workspaceId) {
        return projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private ProjectMember getProjectMembership(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this project"));
    }

    private void requireProjectRole(UUID projectId, UUID userId, ProjectRole required) {
        ProjectMember member = getProjectMembership(projectId, userId);
        if (!member.getRole().isAtLeast(required)) {
            throw new ForbiddenException("Requires project " + required + " or above");
        }
    }

    private void checkProjectAccess(Project project, UUID userId) {
        if (project.getNetwork() == ProjectNetwork.SECRET) {
            getProjectMembership(project.getId(), userId);
        } else {
            if (workspaceMemberRepository.findByWorkspaceIdAndUserId(project.getWorkspaceId(), userId).isEmpty()) {
                throw new ForbiddenException("You are not a member of this workspace");
            }
        }
    }
}
