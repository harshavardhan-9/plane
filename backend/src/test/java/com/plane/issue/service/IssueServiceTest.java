package com.plane.issue.service;

import com.plane.issue.dto.CreateIssueRequest;
import com.plane.issue.dto.IssueResponse;
import com.plane.issue.entity.Issue;
import com.plane.issue.entity.IssuePriority;
import com.plane.issue.repository.*;
import com.plane.project.entity.Project;
import com.plane.project.entity.ProjectMember;
import com.plane.project.entity.ProjectNetwork;
import com.plane.project.entity.ProjectRole;
import com.plane.project.entity.State;
import com.plane.project.entity.StateGroup;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.project.repository.StateRepository;
import com.plane.kafka.producer.DomainEventPublisher;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {

    @Mock IssueRepository issueRepository;
    @Mock IssueAssigneeRepository issueAssigneeRepository;
    @Mock IssueLabelRepository issueLabelRepository;
    @Mock IssueRelationRepository issueRelationRepository;
    @Mock IssueActivityRepository issueActivityRepository;
    @Mock ProjectRepository projectRepository;
    @Mock ProjectMemberRepository projectMemberRepository;
    @Mock StateRepository stateRepository;
    @Mock WorkspaceRepository workspaceRepository;
    @Mock WorkspaceMemberRepository workspaceMemberRepository;
    @Mock EntityManager entityManager;
    @Mock DomainEventPublisher eventPublisher;
    @Mock Query nativeQuery;

    IssueService issueService;

    UUID workspaceId = UUID.randomUUID();
    UUID projectId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        issueService = new IssueService(issueRepository, issueAssigneeRepository, issueLabelRepository,
                issueRelationRepository, issueActivityRepository, projectRepository, projectMemberRepository,
                stateRepository, workspaceRepository, workspaceMemberRepository, entityManager, eventPublisher);
    }

    private Project project() {
        Project p = Project.builder().workspaceId(workspaceId).name("Proj").identifier("PRJ")
                .network(ProjectNetwork.PUBLIC).build();
        p.setId(projectId);
        return p;
    }

    private void stubHappyPathLookups() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").build();
        ws.setId(workspaceId);
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(ws));
        when(projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId))
                .thenReturn(Optional.of(project()));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(ProjectMember.builder().projectId(projectId).userId(userId).role(ProjectRole.MEMBER).build()));
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.setParameter(anyString(), any())).thenReturn(nativeQuery);
        when(nativeQuery.getSingleResult()).thenReturn(null);
        when(issueRepository.saveAndFlush(any(Issue.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void create_assignsNextSequenceNumber() {
        stubHappyPathLookups();
        when(issueRepository.maxSequenceByProjectId(projectId)).thenReturn(5);

        IssueResponse response = issueService.create("ws", projectId,
                new CreateIssueRequest("New issue", null, null, null, null, null, null, null), userId);

        assertThat(response.sequence()).isEqualTo(6);
        verify(eventPublisher).publish(any(com.plane.kafka.event.IssueEvent.class));
    }

    @Test
    void create_firstIssueInProjectGetsSequenceOne() {
        stubHappyPathLookups();
        when(issueRepository.maxSequenceByProjectId(projectId)).thenReturn(0);

        IssueResponse response = issueService.create("ws", projectId,
                new CreateIssueRequest("First issue", null, null, null, null, null, null, null), userId);

        assertThat(response.sequence()).isEqualTo(1);
    }

    @Test
    void create_fallsBackToDefaultState_whenStateIdNotProvided() {
        stubHappyPathLookups();
        when(issueRepository.maxSequenceByProjectId(projectId)).thenReturn(0);
        UUID defaultStateId = UUID.randomUUID();
        when(stateRepository.findByProjectIdAndDefaultStateTrue(projectId))
                .thenReturn(Optional.of(State.builder().id(defaultStateId).projectId(projectId)
                        .name("Todo").color("#fff").group(StateGroup.UNSTARTED).defaultState(true).build()));

        IssueResponse response = issueService.create("ws", projectId,
                new CreateIssueRequest("Issue", null, null, null, null, null, null, null), userId);

        assertThat(response.stateId()).isEqualTo(defaultStateId);
    }

    @Test
    void create_rejectsNonMember() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").build();
        ws.setId(workspaceId);
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(ws));
        when(projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId))
                .thenReturn(Optional.of(project()));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> issueService.create("ws", projectId,
                new CreateIssueRequest("Issue", null, null, null, null, null, null, null), userId))
                .isInstanceOf(ForbiddenException.class);
        verify(issueRepository, never()).saveAndFlush(any());
    }

    @Test
    void create_rejectsMissingParentIssue() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").build();
        ws.setId(workspaceId);
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(ws));
        when(projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId))
                .thenReturn(Optional.of(project()));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(ProjectMember.builder().projectId(projectId).userId(userId).role(ProjectRole.MEMBER).build()));
        UUID missingParent = UUID.randomUUID();
        when(issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(missingParent, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> issueService.create("ws", projectId,
                new CreateIssueRequest("Issue", null, null, null, missingParent, null, null, null), userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_softDeletesIssue() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").build();
        ws.setId(workspaceId);
        UUID issueId = UUID.randomUUID();
        Issue issue = Issue.builder().projectId(projectId).workspaceId(workspaceId).title("X").sequence(1).build();
        issue.setId(issueId);
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(ws));
        when(projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId))
                .thenReturn(Optional.of(project()));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(ProjectMember.builder().projectId(projectId).userId(userId).role(ProjectRole.MEMBER).build()));
        when(issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(issueId, projectId)).thenReturn(Optional.of(issue));

        issueService.delete("ws", projectId, issueId, userId);

        assertThat(issue.getDeletedAt()).isNotNull();
        verify(issueRepository).save(issue);
    }

    @Test
    void findAll_returnsEmptyList_whenProjectHasNoIssues() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").build();
        ws.setId(workspaceId);
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(ws));
        when(projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId))
                .thenReturn(Optional.of(project()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId))
                .thenReturn(Optional.of(com.plane.workspace.entity.WorkspaceMember.builder()
                        .workspaceId(workspaceId).userId(userId).role(com.plane.workspace.entity.WorkspaceRole.MEMBER).build()));
        when(issueRepository.findAllByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of());

        List<IssueResponse> result = issueService.findAll("ws", projectId, userId, null, null, null, null);

        assertThat(result).isEmpty();
        verify(issueAssigneeRepository, never()).findAllByIssueIdIn(any());
    }
}
