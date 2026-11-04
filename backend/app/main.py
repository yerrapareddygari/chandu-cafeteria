from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, menu, orders, admin, notifications, shop
from app.middleware.rate_limit import rate_limiter

app = FastAPI(title="Chandu Cafeteria API", version="1.0.0")

# Rate limiting — applied first, acts on all requests
app.middleware("http")(rate_limiter)

# CORS — allow all origins in production (frontend on Render static site)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(shop.router)


@app.get("/health")
async def health():
    return {"status": "ok"}