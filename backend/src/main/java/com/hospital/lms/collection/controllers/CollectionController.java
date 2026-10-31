package com.hospital.lms.collection.controllers;

import com.hospital.lms.collection.dtos.*;
import com.hospital.lms.collection.services.CollectionService;
import com.hospital.lms.common.dtos.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing endpoints for the Phlebotomy & Sample Collection workstation.
 * Accessible to Lab Technicians, Senior Lab Technicians, and Admin.
 */
@RestController
@RequestMapping("/api/collection")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    /**
     * Looks up order and required container slots by scanning the Lab Slip barcode.
     */
    @GetMapping("/order/{barcode}")
    public ResponseEntity<?> getCollectionOrder(@PathVariable String barcode) {
        try {
            CollectionOrderResponseDTO response = collectionService.getCollectionOrderByBarcode(barcode);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving collection order: " + e.getMessage()));
        }
    }

    /**
     * Allocates a 4-digit sticker set code (e.g. "0001") to an ordered test,
     * and automatically matches & generates all container codes (e.g. FBC-0001-P1).
     */
    @PostMapping("/order-tests/{orderTestId}/allocate-set")
    public ResponseEntity<?> allocateStickerSet(@PathVariable Long orderTestId,
                                                @RequestBody AllocateSetRequestDTO request,
                                                Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            CollectionOrderResponseDTO response = collectionService.allocateStickerSet(orderTestId, request.getSetCode(), username);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error allocating sticker set: " + e.getMessage()));
        }
    }

    /**
     * Marks a specimen tube as COLLECTED by scanning its container barcode (e.g. "FBC-0001-P1").
     */
    @PostMapping("/collect-tube")
    public ResponseEntity<?> collectTube(@RequestBody CollectTubeRequestDTO request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            ContainerDetailDTO updated = collectionService.collectTube(request.getTubeCode(), request.getContainerId(), username);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error collecting specimen container: " + e.getMessage()));
        }
    }

    /**
     * Links a pre-printed sticker code (SC00001 format) to an open container slot.
     */
    @PostMapping("/link")
    public ResponseEntity<?> linkSticker(@RequestBody LinkStickerRequestDTO request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            ContainerDetailDTO updated = collectionService.linkSticker(request, username);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error linking sticker code: " + e.getMessage()));
        }
    }

    /**
     * Marks an individual collected container as RECEIVED_AT_LAB.
     */
    @PostMapping("/receive/{containerId}")
    public ResponseEntity<?> receiveContainer(@PathVariable Long containerId, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            ContainerDetailDTO updated = collectionService.receiveContainer(containerId, username);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error receiving container at bench: " + e.getMessage()));
        }
    }

    /**
     * Bulk receives all collected containers for an order when an entire phlebotomy batch arrives.
     */
    @PostMapping("/receive-all/{orderId}")
    public ResponseEntity<?> receiveAllCollected(@PathVariable Long orderId, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            List<ContainerDetailDTO> updatedList = collectionService.receiveAllCollected(orderId, username);
            return ResponseEntity.ok(updatedList);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error receiving all containers: " + e.getMessage()));
        }
    }

    /**
     * Rejects a specimen container at bench receipt due to quality defect (hemolyzed, clotted, etc.).
     */
    @PostMapping("/reject/{containerId}")
    public ResponseEntity<?> rejectContainer(@PathVariable Long containerId,
                                            @RequestBody RejectContainerRequestDTO request,
                                            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "labtech@gmail.com";
            ContainerDetailDTO updated = collectionService.rejectContainer(containerId, request, username);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error rejecting container: " + e.getMessage()));
        }
    }

    /**
     * Returns recent pending collection orders for the phlebotomy room worklist.
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingCollectionOrders() {
        try {
            List<CollectionOrderResponseDTO> pending = collectionService.getPendingCollectionOrders();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error fetching pending collections: " + e.getMessage()));
        }
    }
}
