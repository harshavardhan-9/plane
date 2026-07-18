package com.plane.auth.service;

import com.plane.auth.dto.AuthResponse;
import com.plane.auth.dto.LoginRequest;
import com.plane.auth.dto.RegisterRequest;
import com.plane.auth.entity.RefreshToken;
import com.plane.auth.entity.User;
import com.plane.auth.repository.RefreshTokenRepository;
import com.plane.auth.repository.UserRepository;
import com.plane.security.JwtProperties;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.InvalidCredentialsException;
import com.plane.shared.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock JwtService jwtService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock StringRedisTemplate redisTemplate;

    AuthService authService;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("test-secret");
        jwtProperties.setAccessTokenExpiry(900_000);
        jwtProperties.setRefreshTokenExpiry(604_800_000);
        authService = new AuthService(userRepository, refreshTokenRepository, jwtService, passwordEncoder, redisTemplate, jwtProperties);
    }

    private User someUser() {
        return User.builder().email("a@test.com").passwordHash("hashed").displayName("A").build();
    }

    @Test
    void register_createsUserAndReturnsTokens() {
        RegisterRequest request = new RegisterRequest("a@test.com", "password123", "A");
        when(userRepository.existsByEmail("a@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(jwtService.generateAccessToken(any(), anyString())).thenReturn("access-token");

        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("a@test.com");
        verify(userRepository).saveAndFlush(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void register_defaultsDisplayNameToEmailPrefix_whenNotProvided() {
        RegisterRequest request = new RegisterRequest("bob@test.com", "password123", null);
        when(userRepository.existsByEmail("bob@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(jwtService.generateAccessToken(any(), anyString())).thenReturn("access-token");

        AuthResponse response = authService.register(request);

        assertThat(response.user().displayName()).isEqualTo("bob");
    }

    @Test
    void register_rejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("a@test.com", "password123", "A");
        when(userRepository.existsByEmail("a@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void login_succeedsWithCorrectPassword() {
        User user = someUser();
        when(userRepository.findByEmailAndNotDeleted("a@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateAccessToken(any(), anyString())).thenReturn("access-token");

        AuthResponse response = authService.login(new LoginRequest("a@test.com", "password123"));

        assertThat(response.accessToken()).isEqualTo("access-token");
    }

    @Test
    void login_rejectsWrongPassword() {
        User user = someUser();
        when(userRepository.findByEmailAndNotDeleted("a@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("a@test.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_rejectsUnknownEmail() {
        when(userRepository.findByEmailAndNotDeleted("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@test.com", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void refresh_rotatesToken_whenValid() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = RefreshToken.builder()
                .userId(userId).token("old-token").revoked(false)
                .expiresAt(OffsetDateTime.now().plusDays(1)).build();
        User user = someUser();
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(token));
        when(userRepository.findByIdAndNotDeleted(userId)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(any(), anyString())).thenReturn("new-access-token");

        AuthResponse response = authService.refresh("old-token");

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(token.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(token);
        verify(refreshTokenRepository, never()).revokeAllByUserId(any());
    }

    @Test
    void refresh_revokesWholeChain_whenTokenAlreadyRevoked() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = RefreshToken.builder()
                .userId(userId).token("reused-token").revoked(true)
                .expiresAt(OffsetDateTime.now().plusDays(1)).build();
        when(refreshTokenRepository.findByToken("reused-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.refresh("reused-token"))
                .isInstanceOf(InvalidTokenException.class);
        verify(refreshTokenRepository).revokeAllByUserId(userId);
    }

    @Test
    void refresh_revokesWholeChain_whenTokenExpired() {
        UUID userId = UUID.randomUUID();
        RefreshToken token = RefreshToken.builder()
                .userId(userId).token("expired-token").revoked(false)
                .expiresAt(OffsetDateTime.now().minusDays(1)).build();
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.refresh("expired-token"))
                .isInstanceOf(InvalidTokenException.class);
        verify(refreshTokenRepository).revokeAllByUserId(userId);
    }

    @Test
    void refresh_rejectsUnknownToken() {
        when(refreshTokenRepository.findByToken("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("nonexistent"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void logout_blacklistsJtiAndRevokesRefreshTokens() {
        UUID userId = UUID.randomUUID();
        Claims claims = mock(Claims.class);
        when(claims.getId()).thenReturn("jti-123");
        when(claims.getExpiration()).thenReturn(new java.util.Date(System.currentTimeMillis() + 60_000));
        when(jwtService.parseAndValidate("raw-token")).thenReturn(claims);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        authService.logout("raw-token", userId);

        verify(valueOps).set(eq("blacklist:jti-123"), eq("1"), anyLong(), any());
        verify(refreshTokenRepository).revokeAllByUserId(userId);
    }
}
