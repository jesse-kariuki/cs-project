package com.example.demo.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT Token Filter that intercepts every request and validates JWT token.
 *
 * Flow:
 * 1. Extract token from Authorization header (Bearer <token>)
 * 2. Validate token signature and expiration
 * 3. Extract userId from token subject
 * 4. Load user details from database
 * 5. Create authentication object with user details
 * 6. Set authentication in SecurityContext
 *
 * Note: This is the ONLY JWT filter. JwtValidator should be deleted.
 */
@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtTokenFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Filter logic executed for each request.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = extractTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            try {
                // Validate token (throws TokenExpiredException if expired)
                if (!jwtService.validateToken(token)) {
                    logger.warn("Invalid JWT token");
                    filterChain.doFilter(request, response);
                    return;
                }

                // Extract user ID from token subject
                String userId = jwtService.extractUserId(token);
                String username = jwtService.extractUsername(token);
                logger.debug("Extracted userId from token: {}", userId);

                // Load user details from database
                UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(username);
                logger.debug("Loaded user details for userId: {}", userId);

                // Create authentication object with loaded authorities
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authentication);

                logger.debug("JWT token validated and authentication set for user: {}", userId);

            } catch (Exception e) {
                logger.error("Cannot set user authentication: {} - {}", e.getClass().getSimpleName(), e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            logger.debug("No JWT token found in request");
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header.
     * Expected format: "Bearer <token>"
     *
     * @return token without Bearer prefix, or null if not present
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (StringUtils.hasText(authHeader) && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length());
            logger.debug("Extracted token from Authorization header");
            return token;
        }

        return null;
    }

    /**
     * Determines if this filter should be skipped for the request.
     * Skip public endpoints that don't require authentication.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        String method = request.getMethod();

        // Skip CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            logger.debug("Skipping JWT filter for CORS preflight request");
            return true;
        }

        // Skip public auth endpoints - must match SecurityConfig paths
        if (path.startsWith("/auth/")) {
            logger.debug("Skipping JWT filter for public auth endpoint: {}", path);
            return true;
        }

        // Skip health checks
        if (path.startsWith("/health")) {
            return true;
        }

        // Skip Swagger/OpenAPI docs
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            return true;
        }

        return false;
    }
}