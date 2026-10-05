package com.agriconnect.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Body for PUT /api/auth/profile. Address parts only - the user is editing where their orders
 * get delivered, not their identity. Every part is optional and is treated as a full
 * replacement, so clearing a field clears the stored value rather than silently keeping it.
 */
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(max = 200, message = "Address must be less than 200 characters")
    private String addressLine;

    @Size(max = 60, message = "City must be less than 60 characters")
    private String city;

    @Size(max = 60, message = "State must be less than 60 characters")
    private String state;

    @Size(max = 10, message = "Pincode must be 10 characters or fewer")
    private String pincode;
}
