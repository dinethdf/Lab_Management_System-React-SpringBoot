package com.hospital.lms.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * The Bouncer at the door.
 * Intercepts EVERY API request to check if the user has a valid JWT token.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Look for the "Authorization" header in the request sent by React
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        // 2. If the header exists and starts with "Bearer ", extract the token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                // Invalid token, username will remain null
            }
        }

        // 3. If we found a username and the user isn't already logged in for this request
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Check if token is valid
            if (jwtUtil.validateToken(token, username)) {
                // Get the user's role from the token (e.g., ADMIN, DOCTOR)
                String role = jwtUtil.extractClaim(token, claims -> claims.get("role", String.class));

                // Tell Spring Security that this user is officially logged in!
                // We add "ROLE_" prefix because Spring Security expects it for RBAC annotations like @PreAuthorize("hasRole('ADMIN')")
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)));
                
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 4. Continue to the next filter or the Controller
        filterChain.doFilter(request, response);
    }
}
