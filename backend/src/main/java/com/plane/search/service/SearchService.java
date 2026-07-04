package com.plane.search.service;

import com.plane.issue.repository.IssueRepository;
import com.plane.search.dto.IssueSearchResponse;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final IssueRepository issueRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public List<IssueSearchResponse> searchIssues(String slug, String q, UUID userId) {
        var workspace = workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
        if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this workspace");
        }
        if (q == null || q.isBlank()) return List.of();
        return issueRepository.searchByWorkspace(workspace.getId(), q).stream()
                .map(IssueSearchResponse::from)
                .toList();
    }
}
