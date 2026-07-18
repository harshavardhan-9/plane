package com.plane.workspace.service;

import com.plane.auth.entity.User;
import com.plane.auth.repository.UserRepository;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.ForbiddenException;
import com.plane.workspace.dto.CreateWorkspaceRequest;
import com.plane.workspace.dto.UpdateMemberRoleRequest;
import com.plane.workspace.dto.WorkspaceResponse;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.entity.WorkspaceMember;
import com.plane.workspace.entity.WorkspaceRole;
import com.plane.workspace.repository.WorkspaceInviteRepository;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock WorkspaceRepository workspaceRepository;
    @Mock WorkspaceMemberRepository workspaceMemberRepository;
    @Mock WorkspaceInviteRepository workspaceInviteRepository;
    @Mock UserRepository userRepository;

    WorkspaceService workspaceService;

    UUID ownerId = UUID.randomUUID();
    UUID workspaceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        workspaceService = new WorkspaceService(workspaceRepository, workspaceMemberRepository, workspaceInviteRepository, userRepository);
    }

    @Test
    void create_derivesSlugFromName_whenSlugNotProvided() {
        when(workspaceRepository.existsBySlugAndNotDeleted("my-cool-workspace")).thenReturn(false);
        when(workspaceRepository.saveAndFlush(any(Workspace.class))).thenAnswer(inv -> inv.getArgument(0));

        WorkspaceResponse response = workspaceService.create(
                new CreateWorkspaceRequest("My Cool Workspace!", null, null, null), ownerId);

        assertThat(response.slug()).isEqualTo("my-cool-workspace");
        verify(workspaceMemberRepository).save(argThat(m -> m.getRole() == WorkspaceRole.OWNER && m.getUserId().equals(ownerId)));
    }

    @Test
    void create_usesProvidedSlug_whenGiven() {
        when(workspaceRepository.existsBySlugAndNotDeleted("custom-slug")).thenReturn(false);
        when(workspaceRepository.saveAndFlush(any(Workspace.class))).thenAnswer(inv -> inv.getArgument(0));

        WorkspaceResponse response = workspaceService.create(
                new CreateWorkspaceRequest("Anything", "custom-slug", null, null), ownerId);

        assertThat(response.slug()).isEqualTo("custom-slug");
    }

    @Test
    void create_rejectsDuplicateSlug() {
        when(workspaceRepository.existsBySlugAndNotDeleted("taken")).thenReturn(true);

        assertThatThrownBy(() -> workspaceService.create(
                new CreateWorkspaceRequest("Anything", "taken", null, null), ownerId))
                .isInstanceOf(ConflictException.class);
        verify(workspaceRepository, never()).saveAndFlush(any());
    }

    private Workspace someWorkspace() {
        Workspace ws = Workspace.builder().name("WS").slug("ws").ownerId(ownerId).build();
        ws.setId(workspaceId);
        return ws;
    }

    @Test
    void updateMemberRole_rejectsChangingOwnerRole() {
        UUID requesterId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(requesterId).role(WorkspaceRole.ADMIN).build()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, ownerId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(ownerId).role(WorkspaceRole.OWNER).build()));

        assertThatThrownBy(() -> workspaceService.updateMemberRole("ws", ownerId,
                new UpdateMemberRoleRequest(WorkspaceRole.MEMBER), requesterId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void updateMemberRole_rejectsAssigningOwnerRole() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(requesterId).role(WorkspaceRole.ADMIN).build()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, targetId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(targetId).role(WorkspaceRole.MEMBER).build()));

        assertThatThrownBy(() -> workspaceService.updateMemberRole("ws", targetId,
                new UpdateMemberRoleRequest(WorkspaceRole.OWNER), requesterId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void updateMemberRole_rejectsNonAdminRequester() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(requesterId).role(WorkspaceRole.MEMBER).build()));

        assertThatThrownBy(() -> workspaceService.updateMemberRole("ws", targetId,
                new UpdateMemberRoleRequest(WorkspaceRole.MEMBER), requesterId))
                .isInstanceOf(ForbiddenException.class);
        verify(workspaceMemberRepository, never()).save(any());
    }

    @Test
    void removeMember_rejectsRemovingOwner() {
        UUID requesterId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(requesterId).role(WorkspaceRole.ADMIN).build()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, ownerId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(ownerId).role(WorkspaceRole.OWNER).build()));

        assertThatThrownBy(() -> workspaceService.removeMember("ws", ownerId, requesterId))
                .isInstanceOf(ForbiddenException.class);
        verify(workspaceMemberRepository, never()).delete(any());
    }

    @Test
    void removeMember_allowsSelfRemoval_withoutAdminRole() {
        UUID memberId = UUID.randomUUID();
        WorkspaceMember membership = WorkspaceMember.builder().workspaceId(workspaceId).userId(memberId).role(WorkspaceRole.MEMBER).build();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, memberId))
                .thenReturn(Optional.of(membership));

        workspaceService.removeMember("ws", memberId, memberId);

        verify(workspaceMemberRepository).delete(membership);
    }

    @Test
    void findMembers_rejectsNonMemberRequester() {
        UUID requesterId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workspaceService.findMembers("ws", requesterId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void findMembers_returnsAllMembersWithUserDetails() {
        UUID requesterId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        when(workspaceRepository.findBySlug("ws")).thenReturn(Optional.of(someWorkspace()));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, requesterId))
                .thenReturn(Optional.of(WorkspaceMember.builder().workspaceId(workspaceId).userId(requesterId).role(WorkspaceRole.MEMBER).build()));
        WorkspaceMember member = WorkspaceMember.builder().workspaceId(workspaceId).userId(memberId).role(WorkspaceRole.MEMBER).build();
        when(workspaceMemberRepository.findAllByWorkspaceId(workspaceId)).thenReturn(List.of(member));
        User user = User.builder().email("m@test.com").displayName("M").build();
        user.setId(memberId);
        when(userRepository.findAllById(any())).thenReturn(List.of(user));

        var result = workspaceService.findMembers("ws", requesterId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).email()).isEqualTo("m@test.com");
    }
}
