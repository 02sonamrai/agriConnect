package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One stored notification as shown in the bell dropdown and the notifications page. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Long orderId;
    private String orderNumber;
    private Boolean read;
    private LocalDateTime createdAt;
}
