package com.agriconnect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 100, message = "Email must be less than 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    @ToString.Exclude
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be less than 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must be less than 50 characters")
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be between 10 and 15 digits")
    private String phoneNumber;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(FARMER|BUYER|MIDDLEMAN)$", message = "Role must be FARMER, BUYER, or MIDDLEMAN")
    private String role;

    // Optional delivery address. Kept optional so existing registrations still validate.
    @Size(max = 200, message = "Address must be less than 200 characters")
    private String addressLine;

    @Size(max = 60, message = "City must be less than 60 characters")
    private String city;

    @Size(max = 60, message = "State must be less than 60 characters")
    private String state;

    @Size(max = 10, message = "Pincode must be 10 characters or fewer")
    private String pincode;
}
