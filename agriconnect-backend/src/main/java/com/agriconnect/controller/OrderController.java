package com.agriconnect.controller;

import com.agriconnect.dto.OrderResponse;
import com.agriconnect.dto.PlaceOrderRequest;
import com.agriconnect.dto.ReceivedOrderResponse;
import com.agriconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Buys the current cart. Rejected as a whole if any line is no longer orderable. */
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody(required = false) PlaceOrderRequest request,
                                                    Principal principal) {
        String note = request == null ? null : request.getNote();
        return new ResponseEntity<>(orderService.placeOrder(note, principal.getName()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders(Principal principal) {
        return ResponseEntity.ok(orderService.getMyOrders(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(orderService.getOrderById(id, principal.getName()));
    }

    /** Farmer view: only the crops this farmer owns. */
    @GetMapping("/received")
    public ResponseEntity<List<ReceivedOrderResponse>> getReceivedOrders(Principal principal) {
        return ResponseEntity.ok(orderService.getReceivedOrders(principal.getName()));
    }

    /** Coordinator view: orders for crops of collected farmers they collected. */
    @GetMapping("/coordinator")
    public ResponseEntity<List<ReceivedOrderResponse>> getCoordinatorOrders(Principal principal) {
        return ResponseEntity.ok(orderService.getCoordinatorReceivedOrders(principal.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                           @RequestParam("status") String status,
                                                           Principal principal) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status, principal.getName()));
    }
}
