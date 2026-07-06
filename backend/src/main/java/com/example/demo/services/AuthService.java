package com.example.demo.services;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.UserDto;
import com.example.demo.exception.InvalidCredentialsException;
import jdk.jshell.spi.ExecutionControl;

public interface AuthService {

    ApiResponse<LoginResponse> signup(LoginRequest userDto) throws InvalidCredentialsException;
    ApiResponse<LoginResponse> login(LoginRequest userDto) throws Exception;
}
