package com.example.demo.dto;

/**
 * Refresh token response DTO.
 */
public class RefreshTokenResponse {
    private String accessToken;

    public RefreshTokenResponse() {}

    public RefreshTokenResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    // Getters and Setters
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
}
