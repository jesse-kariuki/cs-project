# POSIS Garage Management System - JWT Authentication Setup

## Project Overview

This is a Spring Boot 4.0.6 application with complete JWT authentication, role-based access control, and database migration support using Flyway.

## Architecture

### Authentication Flow

1. **Login** → POST `/api/auth/login`
   - Credentials validated via `AuthenticationManager`
   - Tokens generated (access + refresh)
   - Tokens set in HTTP-only secure cookies
   - Last login timestamp updated

2. **Protected Request** → Any endpoint requiring authentication
   - `JwtTokenFilter` intercepts all requests
   - Token extracted from `Authorization: Bearer <token>` header
   - Token validated and claims extracted
   - User loaded from database and set in `SecurityContext`

3. **Token Refresh** → POST `/api/auth/refresh`
   - New access token generated from valid refresh token
   - Old token invalidated

4. **Logout** → POST `/api/auth/logout`
   - Cookies cleared
   - SecurityContext cleared

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CASHIER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username)
);
```

### Other Tables (Auto-created by Flyway)
- `customers` - Customer information
- `spare_parts` - Inventory of spare parts
- `service_invoices` - Invoice records
- `invoice_items` - Line items for invoices
- `customer_credit_ledger` - Customer credit tracking
- `supplier_credit_ledger` - Supplier payment tracking

## Configuration

### application.properties
```properties
# Database (update these in production)
spring.datasource.url=jdbc:mariadb://localhost:3306/posis_db
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:password}

# JWT Secret (min 32 characters, set via environment variable in production)
jwt.secret=${JWT_SECRET:your-super-secret-jwt-key-min-32-characters-long}

# Token Expiration
jwt.accessTokenExpirationMs=900000      # 15 minutes
jwt.refreshTokenExpirationMs=604800000  # 7 days
```

### Environment Variables (Production)
```bash
JWT_SECRET=your-cryptographically-random-secret-min-32-chars
DB_USERNAME=posis_user
DB_PASSWORD=secure_password
```

## API Endpoints

### Public Endpoints

#### POST /api/auth/login
**Request:**
```json
{
  "username": "cashier1",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "cashier1",
      "role": "CASHIER"
    }
  },
  "message": "Login successful"
}
```

**Cookies Set:**
- `access_token` (HttpOnly, Secure, 15 min)
- `refresh_token` (HttpOnly, Secure, 7 days)

#### POST /api/auth/refresh
**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  },
  "message": "Token refreshed"
}
```

#### POST /api/auth/logout
**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Protected Endpoints (requires authentication)

#### POST /api/auth/logout
Only accessible to authenticated users. Clears session and cookies.

## Security Features

1. **Password Security**
   - BCrypt hashing with strength 12
   - Passwords never logged or transmitted in plain text

2. **JWT Security**
   - HS512 signature algorithm
   - Configurable expiration times
   - Claims: userId (sub), username, roles, iat, exp, iss

3. **HTTP Security**
   - CSRF disabled (stateless API)
   - CORS configured for specific origins
   - Secure cookies (HttpOnly, Secure, SameSite=Strict)

4. **Role-Based Access**
   - ADMIN: Full access including user management
   - CASHIER: Invoice and inventory operations
   - Method-level security via `@PreAuthorize` decorator

5. **Error Handling**
   - Consistent JSON error responses
   - No sensitive data in error messages
   - Centralized exception handling

## Project Structure

```
src/main/java/com/example/demo/
├── config/
│   ├── JwtProperties.java          # JWT configuration properties
│   ├── PasswordEncoderConfig.java   # BCrypt configuration
│   └── SecurityConfig.java         # Spring Security configuration
├── controllers/
│   └── AuthController.java         # Authentication endpoints
├── dto/
│   ├── ApiResponse.java            # Generic API response wrapper
│   ├── LoginRequest.java           # Login request DTO
│   ├── LoginResponse.java          # Login response DTO
│   ├── RefreshTokenRequest.java    # Refresh token request DTO
│   ├── RefreshTokenResponse.java   # Refresh token response DTO
│   ├── UserDto.java                # User info DTO
│   ├── ErrorResponse.java          # Error response DTO
│   └── ValidationErrorResponse.java # Validation error DTO
├── exception/
│   ├── GlobalExceptionHandler.java # Centralized exception handler
│   ├── TokenExpiredException.java
│   ├── InvalidCredentialsException.java
│   ├── ResourceNotFoundException.java
│   └── InsufficientStockException.java
├── models/
│   ├── User.java                   # User entity
│   └── UserRole.java               # Role enum (ADMIN, CASHIER)
├── repositories/
│   └── UserRepository.java         # User JPA repository
└── security/
    ├── JwtService.java             # Token generation & validation
    ├── JwtTokenFilter.java         # JWT filter for all requests
    ├── CustomUserDetailsService.java
    ├── UserDetailsImpl.java         # Custom UserDetails
    ├── JwtAuthenticationEntryPoint.java   # 401 handler
    └── JwtAccessDeniedHandler.java        # 403 handler

src/main/resources/
├── application.properties           # Application configuration
└── db/migration/
    └── V1__init_schema.sql         # Initial database schema
```

## Dependencies

### Core
- Spring Boot 4.0.6
- Spring Security
- Spring Data JPA
- Jakarta Persistence API

### JWT
- JJWT 0.12.3 (JWT handling)
- Jackson (JSON serialization)

### Database
- MariaDB JDBC Driver
- Flyway (database migrations)

### Other
- Jakarta Servlet API
- Lombok (optional, for @Getter/@Setter)

## Setup Instructions

### 1. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE posis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Flyway will auto-create tables on first run
```

### 2. Environment Variables
```bash
# Linux/Mac
export JWT_SECRET="your-very-long-and-random-secret-key-at-least-32-characters"
export DB_USERNAME="posis_user"
export DB_PASSWORD="secure_password"

# Windows (Command Prompt)
set JWT_SECRET=your-very-long-and-random-secret-key-at-least-32-characters
set DB_USERNAME=posis_user
set DB_PASSWORD=secure_password
```

### 3. Update application.properties
- Database URL, username, password
- JWT secret (or use environment variable)

### 4. Build & Run
```bash
./mvnw clean install
./mvnw spring-boot:run
```

### 5. Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Creating Test Users

### Via SQL (Direct Database)
```sql
-- Admin user (password: admin123)
INSERT INTO users (username, password_hash, role, created_at) VALUES (
    'admin',
    '$2a$12$...',  -- bcrypt hash of "admin123"
    'ADMIN',
    NOW()
);

-- Cashier user (password: cashier123)
INSERT INTO users (username, password_hash, role, created_at) VALUES (
    'cashier1',
    '$2a$12$...',  -- bcrypt hash of "cashier123"
    'CASHIER',
    NOW()
);
```

### Generate BCrypt Hash
```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
String hashed = encoder.encode("admin123");
System.out.println(hashed);
```

## Using Protected Endpoints

### With Authorization Header
```bash
curl -X GET http://localhost:8080/api/invoices \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

### With Cookies
```bash
curl -X GET http://localhost:8080/api/invoices \
  -H "Cookie: access_token=eyJhbGc..." \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

## Securing Endpoints

### Method-Level Security Example
```java
@GetMapping("/admin-only")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> adminOnly() {
    return ResponseEntity.ok("Admin access only");
}

@GetMapping("/user-info")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> getUserInfo(@AuthenticationPrincipal UserDetailsImpl user) {
    return ResponseEntity.ok(new UserDto(user.getId(), user.getUsername(), user.getRole()));
}
```

## Troubleshooting

### "Invalid JWT signature" Error
- Check JWT_SECRET environment variable is set
- Ensure secret is at least 32 characters
- Secret must be the same across all deployments

### "User not found" After Login
- Verify user exists in database
- Check username is correct

### Token Expiration Issues
- Access tokens expire after 15 minutes (configurable)
- Use refresh token to get new access token
- Refresh tokens expire after 7 days

### CORS Errors
- Check `SecurityConfig.java` for allowed origins
- Update CORS configuration for your frontend URL

## Production Checklist

- [ ] Set JWT_SECRET via environment variable
- [ ] Set DB credentials via environment variables
- [ ] Enable HTTPS/TLS on server
- [ ] Configure CORS for production frontend domain
- [ ] Run Flyway migrations before deployment
- [ ] Set up database backups
- [ ] Configure logging aggregation (ELK, Splunk)
- [ ] Enable rate limiting on auth endpoints
- [ ] Monitor failed login attempts
- [ ] Audit user activities (optional)
- [ ] Regular security updates for dependencies
- [ ] Load test authentication endpoints

## Additional Resources

- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [JJWT GitHub](https://github.com/jwtk/jjwt)
- [JWT Introduction](https://jwt.io/)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)

## Support & Maintenance

For issues or questions:
1. Check the troubleshooting section
2. Review Spring Security logs
3. Validate JWT tokens at https://jwt.io
4. Check database connectivity and schema
