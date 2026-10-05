package com.agriconnect.controller;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/users")
    public List<UserProfileResponse> getUsers() {
        return adminService.getUsers();
    }

    @GetMapping("/crops")
    public List<CropResponse> getCrops() {
        return adminService.getCrops();
    }
}
