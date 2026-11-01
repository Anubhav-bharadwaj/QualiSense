"""
In-Memory Sliding Window Rate Limiter for Authentication Endpoints.
Prevents credential stuffing, automated brute force, and token flooding.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, status, Request

class InMemoryRateLimiter:
    def __init__(self):
        # Maps key -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds
        
        # Prune old timestamps
        timestamps = [ts for ts in self.requests[key] if ts > cutoff]
        self.requests[key] = timestamps

        if len(timestamps) >= max_requests:
            oldest = timestamps[0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            return False, max(1, retry_after)

        self.requests[key].append(now)
        return True, 0

    def check(self, request: Request, action: str, max_requests: int = 5, window_seconds: int = 60, custom_key: str = None):
        client_ip = request.client.host if request.client else "unknown"
        key = f"{action}:{custom_key or client_ip}"
        allowed, retry_after = self.is_allowed(key, max_requests, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests for {action}. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

rate_limiter = InMemoryRateLimiter()
