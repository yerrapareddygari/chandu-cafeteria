from fastapi import Request, HTTPException
from collections import defaultdict
import time
from app.config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW


class RateLimiter:
    def __init__(self, max_requests: int = 60, window: int = 60):
        self.max_requests = max_requests
        self.window = window
        self.requests: dict = defaultdict(list)

    def _cleanup(self):
        """Periodic cleanup of stale entries."""
        now = time.time()
        for key in list(self.requests.keys()):
            self.requests[key] = [t for t in self.requests[key] if now - t < self.window]
            if not self.requests[key]:
                del self.requests[key]

    async def __call__(self, request: Request, call_next):
        # Skip rate limiting for WebSocket, health, and static
        if request.url.path.startswith("/ws") or request.url.path == "/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean up old timestamps for this IP
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window]

        if len(self.requests[client_ip]) >= self.max_requests:
            retry_after = int(self.window - (now - self.requests[client_ip][0]))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )

        self.requests[client_ip].append(now)

        # Periodic cleanup every 1000 requests
        if sum(len(v) for v in self.requests.values()) > 1000:
            self._cleanup()

        return await call_next(request)


# Global instance — reuse across workers via shared memory
rate_limiter = RateLimiter(max_requests=RATE_LIMIT_REQUESTS, window=RATE_LIMIT_WINDOW)