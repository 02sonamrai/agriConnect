package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Seller contact details for the "Contact Farmer" action on a crop listing.
 *
 * <p>Deliberately a narrow whitelist: display name, contact phone and location only. It never
 * carries credentials, tokens, internal ids of the seller account, or unrelated profile fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerContactResponse {

    private Long cropId;
    private String cropName;

    /** Farmer full name, or the Collected Farmer name for coordinator-added crops. */
    private String contactName;

    /** "Farmer" or "Collected Farmer" - plain text for display, not a role lookup. */
    private String contactType;

    private Boolean collectedFarmerListing;

    private String phone;

    private String location;

    /** Remaining stock, so the buyer is not told to call about a sold-out listing. */
    private BigDecimal stockQuantity;
    private String unit;
    private Boolean available;
}
