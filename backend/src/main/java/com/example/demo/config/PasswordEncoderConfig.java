package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration for password encoding using BCrypt.
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * Provide BCrypt password encoder bean.
     * Strength: 12 (default is 10, but 12 provides better security with minimal performance impact)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
