package com.example.demo.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.models.User;
import com.example.demo.repositories.UserRepository;

/**
 * Spring Security UserDetailsService implementation.
 * Loads user details from database by username or userId.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load user by username (called during login).
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(
                String.format("User not found with username: %s", username)
            ));

        return UserDetailsImpl.build(user);
    }

    /**
     * Load user by ID (called from JWT token filter).
     */
    public UserDetails loadUserById(String userId) throws ResourceNotFoundException {
        User user = userRepository.findById(Long.parseLong(userId))
            .orElseThrow(() -> new ResourceNotFoundException(
                String.format("User not found with ID: %s", userId)
            ));

        return UserDetailsImpl.build(user);
    }
}
