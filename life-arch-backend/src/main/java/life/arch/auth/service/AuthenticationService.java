package life.arch.auth.service;

import life.arch.auth.dto.AuthResponse;
import life.arch.auth.dto.LoginRequest;
import life.arch.auth.dto.RegisterRequest;
import life.arch.auth.entity.User;
import life.arch.auth.jwt.SecurityUser;
import life.arch.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Check if user already exists
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        // 2. Create and save new user
        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        // 3. Generate token
        SecurityUser securityUser = new SecurityUser(user);
        String jwtToken = jwtService.generateToken(securityUser);

        return new AuthResponse(jwtToken, user.getEmail(), user.getFullName());
    }

    public AuthResponse authenticate(LoginRequest request) {
        // 1. Verify credentials against DB via Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()));

        // 2. If we reach here, credentials are valid. Fetch user and generate token.
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        SecurityUser securityUser = new SecurityUser(user);
        String jwtToken = jwtService.generateToken(securityUser);

        return new AuthResponse(jwtToken, user.getEmail(), user.getFullName());
    }

}
