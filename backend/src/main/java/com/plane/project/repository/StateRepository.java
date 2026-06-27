package com.plane.project.repository;

import com.plane.project.entity.State;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StateRepository extends JpaRepository<State, UUID> {

    List<State> findAllByProjectIdOrderBySequence(UUID projectId);

    Optional<State> findByIdAndProjectId(UUID id, UUID projectId);

    Optional<State> findByProjectIdAndDefaultStateTrue(UUID projectId);

    int countByProjectId(UUID projectId);
}
