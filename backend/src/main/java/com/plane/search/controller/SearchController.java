package com.plane.search.controller;

import com.plane.search.dto.IssueSearchResponse;
import com.plane.search.service.SearchService;
import com.plane.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/issues")
    public List<IssueSearchResponse> searchIssues(@PathVariable String slug,
                                                   @RequestParam String q,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return searchService.searchIssues(slug, q, principal.getUserId());
    }
}
