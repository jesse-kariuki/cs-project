package com.example.demo.controllers;

import java.time.LocalDateTime;

import com.example.demo.models.UserRole;
import com.example.demo.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.RefreshTokenResponse;
import com.example.demo.dto.UserDto;
import com.example.demo.exception.InvalidCredentialsException;
import com.example.demo.exception.TokenExpiredException;
import com.example.demo.models.User;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.JwtService;
import com.example.demo.security.UserDetailsImpl;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * Authentication endpoints for login, refresh, and logout.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public AuthController(
            JwtService jwtService,
            UserRepository userRepository,
            AuthService authService,
            PasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

//    @PostMapping("/signup")
//    public ResponseEntity<ApiResponse> signup(@RequestBody @Valid LoginRequest loginRequest) {
//        if (userRepository.existsByUsername(loginRequest.getUsername())) {
//            return ResponseEntity.badRequest().body(new ApiResponse(false, null, "Username already exists"));
//        }
//
//        User newUser = new User();
//        newUser.setUsername(loginRequest.getUsername());
//        newUser.setPasswordHash(passwordEncoder.encode(loginRequest.getPassword()));
//        newUser.setRole(loginRequest.getRole());
//        userRepository.save(newUser);
//
//        return ResponseEntity.ok(new ApiResponse(true, newUser, "User registered successfully"));
//    }


    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@RequestBody @Valid LoginRequest loginRequest) throws InvalidCredentialsException{

        return ResponseEntity.ok(authService.signup(loginRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest loginRequest) throws Exception{
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    /**
     * Login endpoint - authenticates user and returns tokens.
     */
//    @PostMapping("/login")
//    public ResponseEntity<ApiResponse<LoginResponse>> login(
//            @Valid @RequestBody LoginRequest loginRequest,
//            HttpServletResponse response) {
//
//        try {
//            Authentication authentication = authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(
//                    loginRequest.getUsername(),
//                    loginRequest.getPassword()
//                )
//            );
//
//            String accessToken = jwtService.generateAccessToken(authentication);
//            String refreshToken = jwtService.generateRefreshToken(authentication);
//
//            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
//            User user = userRepository.findById(Long.parseLong(userDetails.getId()))
//                .orElseThrow(() -> new InvalidCredentialsException("User not found"));
//            user.setLastLogin(LocalDateTime.now());
//            userRepository.save(user);
//
//            setCookie(response, "access_token", accessToken, 900); // 15 minutes
//            setCookie(response, "refresh_token", refreshToken, 604800); // 7 days
//
//            UserDto userDto = new UserDto(
//                user.getId(),
//                user.getUsername(),
//                user.getRole().name()
//            );
//
//            LoginResponse loginResponse = new LoginResponse(accessToken, refreshToken, userDto);
//            return ResponseEntity.ok(new ApiResponse<>(true, loginResponse, "Login successful"));
//
//        } catch (Exception e) {
//            throw new InvalidCredentialsException("Invalid username or password");
//        }
//    }


    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletResponse response) {

        try {
            String refreshToken = request.getRefreshToken();

            // Validate refresh token
            if (!jwtService.validateToken(refreshToken)) {
                throw new TokenExpiredException("Invalid refresh token");
            }

            // Extract user ID from refresh token
            String userId = jwtService.extractUserId(refreshToken);
            User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

            // Create authentication object for token generation
            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );

            // Generate new access token
            String newAccessToken = jwtService.generateAccessToken(authentication);

            // Set cookie
            setCookie(response, "access_token", newAccessToken, 900); // 15 minutes

            RefreshTokenResponse refreshResponse = new RefreshTokenResponse(newAccessToken);
            return ResponseEntity.ok(new ApiResponse<>(true, refreshResponse, "Token refreshed"));

        } catch (TokenExpiredException e) {
            throw e;
        } catch (Exception e) {
            throw new TokenExpiredException("Token refresh failed");
        }
    }

    /**
     * Logout endpoint - clears authentication and tokens.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout(HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        clearCookie(response, "access_token");
        clearCookie(response, "refresh_token");

        return ResponseEntity.ok(new ApiResponse<>(true, null, "Logout successful"));
    }

    private void setCookie(HttpServletResponse response, String name, String value, int maxAge) {
        String cookieValue = String.format(
            "%s=%s; HttpOnly; Secure; SameSite=Strict; Max-Age=%d; Path=/api",
            name, value, maxAge
        );
        response.addHeader("Set-Cookie", cookieValue);
    }


    private void clearCookie(HttpServletResponse response, String name) {
        String cookieValue = String.format("%s=; Max-Age=0; Path=/api", name);
        response.addHeader("Set-Cookie", cookieValue);
    }
}
