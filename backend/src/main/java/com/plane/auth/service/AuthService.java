package com.plane.auth.service;

import com.plane.auth.dto.AuthResponse;
import com.plane.auth.dto.LoginRequest;
import com.plane.auth.dto.RegisterRequest;
import com.plane.auth.dto.UserResponse;
import com.plane.auth.entity.RefreshToken;
import com.plane.auth.entity.User;
import com.plane.auth.repository.RefreshTokenRepository;
import com.plane.auth.repository.UserRepository;
import com.plane.security.JwtProperties;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.InvalidCredentialsException;
import com.plane.shared.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered: " + request.email());
        }
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName() != null
                        ? request.displayName()
                        : request.email().split("@")[0])
                .build();
        userRepository.saveAndFlush(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndNotDeleted(request.email())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return buildAuthResponse(user);
    }

    @Transactional(noRollbackFor = InvalidTokenException.class)
    public AuthResponse refresh(String tokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));
        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            refreshTokenRepository.revokeAllByUserId(refreshToken.getUserId());
            throw new InvalidTokenException("Refresh token is expired or revoked");
        }
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        User user = userRepository.findByIdAndNotDeleted(refreshToken.getUserId())
                .orElseThrow(() -> new InvalidTokenException("User not found"));
        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String rawToken, UUID userId) {
        Claims claims = jwtService.parseAndValidate(rawToken);
        long ttl = claims.getExpiration().getTime() - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue().set("blacklist:" + claims.getId(), "1", ttl, TimeUnit.MILLISECONDS);
        }
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(UUID userId) {
        User user = userRepository.findByIdAndNotDeleted(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));
        return UserResponse.from(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenValue = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(user.getId())
                .token(refreshTokenValue)
                .expiresAt(OffsetDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiry() / 1000))
                .build());
        return new AuthResponse(accessToken, refreshTokenValue, jwtProperties.getAccessTokenExpiry(), UserResponse.from(user));
    }
}
