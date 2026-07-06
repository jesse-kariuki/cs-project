    package com.example.demo.services;

    import com.example.demo.dto.ApiResponse;
    import com.example.demo.dto.LoginRequest;
    import com.example.demo.dto.LoginResponse;
    import com.example.demo.dto.UserDto;
    import com.example.demo.exception.InvalidCredentialsException;
    import com.example.demo.models.User;
    import com.example.demo.repositories.UserRepository;
    import com.example.demo.security.JwtService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
    import org.springframework.security.core.Authentication;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.security.core.userdetails.UserDetails;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.stereotype.Service;

    import java.util.Optional;

    @Service
    @RequiredArgsConstructor
    public class AuthServiceImpl implements AuthService{

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final CustomUserImplementation customUserImplementation;
        private final JwtService jwtService;




        @Override
        public ApiResponse<LoginResponse> signup(LoginRequest userDto) throws InvalidCredentialsException {

            Optional<User> newUser = userRepository.findByUsername(userDto.getUsername());
            if(newUser.isPresent()){
                throw new InvalidCredentialsException("User with email already exists");
            }

            User user = new User();
            user.setUsername(userDto.getUsername());
            user.setPasswordHash(passwordEncoder.encode(userDto.getPassword()));
            user.setRole(userDto.getRole());

            User savedUser = userRepository.save(user);

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDto.getUsername(),
                    userDto.getPassword());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtService.generateAccessToken(authentication);
            LoginResponse response = new LoginResponse();
            response.setUser(new UserDto(savedUser.getId(), savedUser.getUsername(), String.valueOf(savedUser.getRole())));
            response.setAccessToken(jwt);

            return new ApiResponse<>(true, response, "Successfully Registered");
        }

        @Override
        public ApiResponse<LoginResponse> login(LoginRequest userDto) throws Exception {

            String username = userDto.getUsername();
            String password = userDto.getPassword();

            Authentication authentication = authenticate(username, password);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtService.generateAccessToken(authentication);
            Optional<User> user = userRepository.findByUsername(username);
            if(user.isEmpty()){
                throw new Exception("User not found");
            }

            User existingUser = user.get();
            LoginResponse response = new LoginResponse();
            response.setUser(new UserDto(existingUser.getId(), existingUser.getUsername(), String.valueOf(existingUser.getRole())));
            response.setAccessToken(jwt);

            return new ApiResponse<>(true, response, "Successfully Logged in");


        }

        private Authentication authenticate(String email, String password) throws Exception {

            UserDetails userDetails = customUserImplementation.loadUserByUsername(email);
            if (userDetails == null) {
                throw new InvalidCredentialsException("User with email " + email + " not found");
            }

            if (!passwordEncoder.matches(password, userDetails.getPassword())) {
                throw new InvalidCredentialsException("Invalid password");
            }

            return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        }
    }
