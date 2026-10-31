package com.hospital.lms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * The main Security Rules for the application.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Allows us to use @PreAuthorize("hasRole('ADMIN')") on our controllers
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // Tells Spring to use BCrypt to hash and check passwords
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Configures the actual security rules
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF since we use JWT tokens instead of sessions
            .cors(cors -> cors.configure(http)) // Allow React frontend to connect
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // No sessions, only JWT
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login").permitAll() // Anyone can try to log in
                .anyRequest().authenticated() // ALL other endpoints require a valid JWT token
            )
            // Put our custom JWT Bouncer in front of the standard Spring authentication
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
