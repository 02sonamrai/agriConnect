package com.agriconnect.controller;

import com.agriconnect.dto.AddToCartRequest;
import com.agriconnect.dto.CartResponse;
import com.agriconnect.dto.UpdateCartItemRequest;
import com.agriconnect.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(Principal principal) {
        return ResponseEntity.ok(cartService.getCart(principal.getName()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(@Valid @RequestBody AddToCartRequest request, Principal principal) {
        CartResponse response = cartService.addItem(request.getCropId(), request.getQuantity(), principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateItem(@PathVariable Long itemId,
                                                  @Valid @RequestBody UpdateCartItemRequest request,
                                                  Principal principal) {
        CartResponse response = cartService.updateItem(itemId, request.getQuantity(), principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long itemId, Principal principal) {
        cartService.removeItem(itemId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(Principal principal) {
        cartService.clearCart(principal.getName());
        return ResponseEntity.noContent().build();
    }
}
