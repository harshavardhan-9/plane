package com.plane.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Spring Security's default entry point returns 403 for any unauthenticated request
 * when no form-login/http-basic is configured — including a missing, expired, or
 * malformed JWT. That collapses "who are you" (401) into "you're not allowed" (403),
 * which breaks the frontend's refresh-on-401 interceptor: an expired access token
 * must come back as 401 so the client knows to retry with a refreshed token, not
 * treat it as a permanent access-denied.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"status\":401,\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required or token invalid/expired\"}");
    }
}
