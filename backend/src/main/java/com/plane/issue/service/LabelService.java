package com.plane.issue.service;

import com.plane.issue.dto.CreateLabelRequest;
import com.plane.issue.dto.LabelResponse;
import com.plane.issue.dto.UpdateLabelRequest;
import com.plane.issue.entity.Label;
import com.plane.issue.repository.IssueLabelRepository;
import com.plane.issue.repository.LabelRepository;
import com.plane.project.entity.Project;
import com.plane.project.entity.ProjectMember;
import com.plane.project.entity.ProjectNetwork;
import com.plane.project.entity.ProjectRole;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
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
public class LabelService {

    private final LabelRepository labelRepository;
    private final IssueLabelRepository issueLabelRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public List<LabelResponse> findAll(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        return labelRepository.findAllByProjectId(projectId).stream().map(LabelResponse::from).toList();
    }

    @Transactional
    public LabelResponse create(String slug, UUID projectId, CreateLabelRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        if (labelRepository.existsByProjectIdAndName(projectId, request.name())) {
            throw new ConflictException("Label already exists: " + request.name());
        }
        return LabelResponse.from(labelRepository.saveAndFlush(Label.builder()
                .projectId(projectId)
                .name(request.name())
                .color(request.color())
                .build()));
    }

    @Transactional
    public LabelResponse update(String slug, UUID projectId, UUID labelId, UpdateLabelRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        Label label = labelRepository.findByIdAndProjectId(labelId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        if (request.name() != null && !request.name().isBlank()) label.setName(request.name());
        if (request.color() != null) label.setColor(request.color());
        return LabelResponse.from(labelRepository.save(label));
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID labelId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        Label label = labelRepository.findByIdAndProjectId(labelId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        issueLabelRepository.deleteAllByLabelId(labelId);
        labelRepository.delete(label);
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
