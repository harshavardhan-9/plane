package com.plane.comment.dto;

import jakarta.validation.constraints.NotBlank;

public record AddReactionRequest(@NotBlank String emoji) {}
