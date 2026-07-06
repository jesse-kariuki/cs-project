package com.example.demo.security;


public class JwtConstant {

    public static final String JWT_SECRET = "713e0738ac801dc3a7c300500c26d7354fd3328ca18c8ce27d810d4de6065dd6";
    public static final String JWT_HEADER = "Authorization";

    public String getJwtSecret(){
        return JWT_SECRET;
    }
}
