package com.example.demo.services;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.models.User;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * UserService for retrieving user data.
 *
 * IMPORTANT: Do not extract JWT here!
 * Let JwtTokenFilter and Spring Security handle JWT validation.
 * Services should work with authenticated User objects, not tokens.
 */
@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get user by ID.
     * Called after JWT is already validated by filter.
     *
     * @param userId The user ID from SecurityContext
     * @return User entity
     */
    public User getUserById(String userId) {
        return userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with ID " + userId + " could not be found"
                ));
    }

    /**
     * Get user by username.
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with username '" + username + "' could not be found"
                ));
    }

    /**
     * Extract User from authenticated UserDetails.
     * This should be called with @AuthenticationPrincipal UserDetailsImpl userDetails.
     *
     * @param userDetails Authenticated user details from SecurityContext
     * @return User entity
     */
    public User getUserFromAuthenticatedPrincipal(UserDetailsImpl userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        return getUserById(userDetails.getId());
    }
}