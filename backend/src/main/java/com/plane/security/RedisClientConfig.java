package com.plane.security;

import io.lettuce.core.SocketOptions;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RedisClientConfig {

    /**
     * TCP keep-alive so an idle connection doesn't get silently dropped by NAT/Docker networking
     * and only discovered on next use as a 60s command timeout (JwtAuthenticationFilter and
     * RateLimitFilter both hit Redis on every request, so a stale connection blocks all traffic).
     */
    @Bean
    LettuceClientConfigurationBuilderCustomizer keepAliveCustomizer() {
        return builder -> builder.clientOptions(io.lettuce.core.ClientOptions.builder()
                .socketOptions(SocketOptions.builder()
                        .keepAlive(true)
                        .connectTimeout(Duration.ofSeconds(5))
                        .build())
                .build());
    }
}
