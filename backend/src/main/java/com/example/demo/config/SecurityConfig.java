package com.example.demo.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demo.security.JwtAccessDeniedHandler;
import com.example.demo.security.JwtAuthenticationEntryPoint;
import com.example.demo.security.JwtTokenFilter;

/**
 * Spring Security configuration for JWT-based authentication.
 * - Stateless session management
 * - JWT token validation via filter
 * - Role-based authorization
 * - CORS configuration
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    private final JwtTokenFilter jwtTokenFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    public SecurityConfig(
            JwtTokenFilter jwtTokenFilter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            JwtAccessDeniedHandler jwtAccessDeniedHandler) {
        this.jwtTokenFilter = jwtTokenFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
    }

    /**
     * Configure the security filter chain.
     * - Disable CSRF (stateless JWT-based authentication)
     * - Set session creation policy to STATELESS
     * - Add JWT token filter before UsernamePasswordAuthenticationFilter
     * - Configure public endpoints (login, refresh, health checks)
     * - Require authentication for all other endpoints
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(authz -> authz
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/signup").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
                    .requestMatchers("/health/**").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/sale/mpesa/**").permitAll()

                .requestMatchers(HttpMethod.GET, "/invoices/**").hasRole("CASHIER")
                .requestMatchers(HttpMethod.POST, "/invoices/**").hasRole("CASHIER")
                .requestMatchers(HttpMethod.GET, "/inventory/search").hasRole("CASHIER")
                .requestMatchers(HttpMethod.POST, "/payments/**").hasRole("CASHIER")
                .requestMatchers(HttpMethod.GET, "/credit/**").hasRole("CASHIER")

                .requestMatchers(HttpMethod.POST, "/inventory/parts").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/inventory/parts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/inventory/parts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/inventory/low-stock").hasRole("ADMIN")
                .requestMatchers("/suppliers/**").hasRole("ADMIN")
                .requestMatchers("/reports/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/auth/logout").authenticated()

                .anyRequest().authenticated()

            );

        // Add JWT token filter
        http.addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configure CORS to allow frontend requests.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://posis.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configure AuthenticationManager for authentication processing.
     */
//    @Bean
//    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
//        AuthenticationManagerBuilder authBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
//        authBuilder
//            .userDetailsService(userDetailsService)
//            .passwordEncoder(passwordEncoder);
//        return authBuilder.build();
//    }



    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
