package com.plane.issue.repository;

import com.plane.issue.entity.IssueActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IssueActivityRepository extends JpaRepository<IssueActivity, UUID> {
    List<IssueActivity> findAllByIssueIdOrderByCreatedAtDesc(UUID issueId);
}
