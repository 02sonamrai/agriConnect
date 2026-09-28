package com.agriconnect.dto;

import lombok.*;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}
