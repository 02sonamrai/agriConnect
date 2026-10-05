package com.agriconnect.controller;

import com.agriconnect.dto.FarmerContactResponse;
import com.agriconnect.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    /**
     * Contact details for the seller of a listing. Separate from MarketplaceController so the
     * existing crop/marketplace endpoints stay untouched.
     */
    @GetMapping("/crop/{cropId}")
    public ResponseEntity<FarmerContactResponse> getContactForCrop(@PathVariable Long cropId) {
        return ResponseEntity.ok(contactService.getContactForCrop(cropId));
    }
}
