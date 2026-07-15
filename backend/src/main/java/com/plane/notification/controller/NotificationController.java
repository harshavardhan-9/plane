package com.plane.notification.controller;

import com.plane.notification.dto.NotificationResponse;
import com.plane.notification.service.NotificationService;
import com.plane.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(@PathVariable String slug, @AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.list(slug, principal.getUserId());
    }

    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable String slug, @PathVariable UUID notificationId,
                          @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(slug, notificationId, principal.getUserId());
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@PathVariable String slug, @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(slug, principal.getUserId());
    }
}
