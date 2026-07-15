package com.plane.notification.repository;

import com.plane.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByRecipientIdAndWorkspaceIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID recipientId, UUID workspaceId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientId = :recipientId AND n.workspaceId = :workspaceId AND n.read = false")
    void markAllRead(@Param("recipientId") UUID recipientId, @Param("workspaceId") UUID workspaceId);
}
