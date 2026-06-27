package com.plane.project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "color", nullable = false)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "state_group", nullable = false)
    private StateGroup group;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultState = false;

    @Builder.Default
    @Column(name = "sequence", nullable = false)
    private int sequence = 0;
}
