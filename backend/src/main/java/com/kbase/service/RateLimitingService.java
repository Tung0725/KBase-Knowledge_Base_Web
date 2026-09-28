package com.kbase.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    /**
     * Resolves the rate limiting bucket for a specific IP address.
     * If the bucket doesn't exist, it creates a new one.
     */
    public Bucket resolveBucket(String ip) {
        return cache.computeIfAbsent(ip, this::newBucket);
    }

    private Bucket newBucket(String ip) {
        // Allow maximum 2 request per 1 minute
        Bandwidth limit = Bandwidth.classic(2, Refill.intervally(2, Duration.ofMinutes(1)));
                
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
