package com.kbase;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Integration test: Yêu cầu PostgreSQL (pgvector) và Redis container chạy ở localhost để load full context")
class KbaseBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
