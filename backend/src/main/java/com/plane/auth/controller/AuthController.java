package com.plane.auth.controller;

import com.plane.auth.dto.AuthResponse;
import com.plane.auth.dto.LoginRequest;
import com.plane.auth.dto.RefreshRequest;
import com.plane.auth.dto.RegisterRequest;
import com.plane.auth.dto.UserResponse;
import com.plane.auth.service.AuthService;
import com.plane.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        String token = request.getHeader("Authorization").substring(7);
        authService.logout(token, principal.getUserId());
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.getMe(principal.getUserId());
    }
}
