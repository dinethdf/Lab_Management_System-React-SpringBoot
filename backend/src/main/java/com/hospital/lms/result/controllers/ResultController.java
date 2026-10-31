package com.hospital.lms.result.controllers;

import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.result.dtos.*;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.services.ResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing endpoints for Result Entry, Draft Saving, Submission,
 * and Senior Lab Technician Verification.
 */
@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    /**
     * Retrieves result form data by scanning a container barcode or Test Sample Code.
     */
    @GetMapping("/by-container/{code}")
    public ResponseEntity<?> getResultFormByCode(@PathVariable String code) {
        try {
            ResultFormDataDTO formData = resultService.getResultFormByCode(code);
            return ResponseEntity.ok(formData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving result form: " + e.getMessage()));
        }
    }

    /**
     * Saves or updates a draft test result.
     */
    @PostMapping
    public ResponseEntity<?> saveDraft(@RequestBody SaveResultRequestDTO request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            TestResult saved = resultService.saveDraft(request, username);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to save draft result: " + e.getMessage()));
        }
    }

    /**
     * Submits a draft result for verification by a Senior Lab Technician.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitForVerification(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            TestResult submitted = resultService.submitForVerification(id, username);
            return ResponseEntity.ok(new MessageResponse("Result submitted successfully for senior verification."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to submit result: " + e.getMessage()));
        }
    }

    /**
     * Retrieves all results currently pending verification.
     */
    @GetMapping("/pending-verification")
    public ResponseEntity<List<TestResultSummaryDTO>> getPendingVerificationResults() {
        return ResponseEntity.ok(resultService.getPendingVerificationResults());
    }

    /**
     * Approves a submitted test result (Senior Lab Tech only).
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveResult(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "seniorlabtech@gmail.com";
            resultService.approveResult(id, username);
            return ResponseEntity.ok(new MessageResponse("Result approved and released successfully."));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("Forbidden")) {
                return ResponseEntity.status(403).body(new MessageResponse(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to approve result: " + e.getMessage()));
        }
    }

    /**
     * Rejects a submitted test result with a mandatory reason.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectResult(@PathVariable Long id,
                                          @RequestBody VerificationDecisionRequest request,
                                          Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "seniorlabtech@gmail.com";
            String reason = request != null ? request.getReason() : null;
            resultService.rejectResult(id, reason, username);
            return ResponseEntity.ok(new MessageResponse("Result rejected and sent back to technician for correction."));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("Forbidden")) {
                return ResponseEntity.status(403).body(new MessageResponse(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to reject result: " + e.getMessage()));
        }
    }

    /**
     * Retrieves results entered by the currently authenticated technician.
     */
    @GetMapping("/my-results")
    public ResponseEntity<List<TestResultSummaryDTO>> getMyResults(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
        return ResponseEntity.ok(resultService.getMyResults(username));
    }
}
