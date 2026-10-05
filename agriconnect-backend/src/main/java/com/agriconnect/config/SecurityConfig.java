package com.agriconnect.config;

import com.agriconnect.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login", "/uploads/**").permitAll()
                .requestMatchers("/api/farmer/**").hasAuthority("ROLE_FARMER")
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/middleman/**").hasAnyAuthority("ROLE_MIDDLEMAN", "ROLE_ADMIN")
                .requestMatchers("/api/marketplace/**").hasAnyAuthority("ROLE_BUYER", "ROLE_FARMER", "ROLE_ADMIN")
                .requestMatchers("/api/cart/**").hasAnyAuthority("ROLE_BUYER", "ROLE_ADMIN")
                // Declared ahead of the broad /api/orders/** rule below. "Received" is the
                // seller view, so a buyer must not reach it even though the query would
                // return nothing for them.
                // Coordinator receives their own assisted collected-farmer orders.
                .requestMatchers(HttpMethod.GET, "/api/orders/coordinator")
                    .hasAnyAuthority("ROLE_MIDDLEMAN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/received")
                    .hasAnyAuthority("ROLE_FARMER", "ROLE_ADMIN")
                // Only a buyer checks out. A farmer or coordinator must not be able to
                // create orders against another account.
                .requestMatchers(HttpMethod.POST, "/api/orders")
                    .hasAnyAuthority("ROLE_BUYER", "ROLE_ADMIN")
                // "My orders" is the buyer's own history. A coordinator reaches only their
                // own assisted orders through /api/orders/coordinator above.
                .requestMatchers(HttpMethod.GET, "/api/orders")
                    .hasAnyAuthority("ROLE_BUYER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/orders/all")
                    .hasAnyAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/status")
                    .hasAnyAuthority("ROLE_FARMER", "ROLE_MIDDLEMAN", "ROLE_ADMIN")
                .requestMatchers("/api/orders/**").hasAnyAuthority("ROLE_BUYER", "ROLE_FARMER", "ROLE_ADMIN", "ROLE_MIDDLEMAN")
                .requestMatchers("/api/contact/**").hasAnyAuthority("ROLE_BUYER", "ROLE_FARMER", "ROLE_ADMIN")
                // Notifications belong to whoever they were written for, so every signed-in
                // role may reach the prefix. The service then scopes every query to the JWT
                // account, which is what stops one user reading another's alerts.
                .requestMatchers("/api/notifications/**").authenticated()
                // Same idea for reviews. Role is checked per action in ReviewServiceImpl - only a
                // buyer can write, and a seller can only read their own scorecard - so this rule
                // deliberately does not narrow the prefix by role.
                .requestMatchers("/api/reviews/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);


        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
