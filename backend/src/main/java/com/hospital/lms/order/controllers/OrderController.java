package com.hospital.lms.order.controllers;

import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.order.dtos.OrderRequestDTO;
import com.hospital.lms.order.dtos.OrderResponseDTO;
import com.hospital.lms.order.services.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing endpoints for creating and looking up diagnostic test orders.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Creates a test order for a patient and issues a unique lab slip barcode.
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO request) {
        try {
            OrderResponseDTO order = orderService.createOrder(request);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to create order: " + e.getMessage()));
        }
    }

    /**
     * Looks up an order by its lab slip barcode.
     */
    @GetMapping("/{barcode}")
    public ResponseEntity<?> getOrderByBarcode(@PathVariable String barcode) {
        try {
            OrderResponseDTO order = orderService.getOrderByBarcode(barcode);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error retrieving order: " + e.getMessage()));
        }
    }

    /**
     * Retrieves all past test orders for a given patient ID.
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(orderService.getOrdersByPatientId(patientId));
    }
}
