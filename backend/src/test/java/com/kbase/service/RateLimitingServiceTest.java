package com.kbase.service;

import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitingServiceTest {

    private final RateLimitingService rateLimitingService = new RateLimitingService();

    @Test
    @DisplayName("resolveBucket: Trả về bucket và tái sử dụng cho cùng 1 địa chỉ IP")
    void testResolveBucket_ReturnsAndCachesBucket() {
        Bucket bucket1 = rateLimitingService.resolveBucket("192.168.1.1");
        Bucket bucket2 = rateLimitingService.resolveBucket("192.168.1.1");
        Bucket bucketOther = rateLimitingService.resolveBucket("10.0.0.1");

        assertNotNull(bucket1);
        assertSame(bucket1, bucket2);
        assertNotSame(bucket1, bucketOther);
    }
}
