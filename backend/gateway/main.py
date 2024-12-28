import os

from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import httpx
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="API Gateway",
    openapi_components={
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        }
    }
)

USERS_SERVICE_URL = os.getenv("USERS_SERVICE_URL", "http://users:8001")
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://tickets:8002")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order:8003")
DICT_SERVICE_URL = os.getenv("DICT_SERVICE_URL", "http://dictionaries:8004")

SECRET_KEY = "SECRET_JWT_KEY"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def admin_role_dependency(request: Request):
    user_id = request.headers.get("X-User-Id")
    if user_id != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")


class User(BaseModel):
    username: str
    password: str


@app.post("/auth/register")
async def gateway_register(user: User = Depends()):
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{USERS_SERVICE_URL}/users/register",
                                 json={"username": user.username, "password": user.password})
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json().get("detail", "Unknown error"))
    return resp.json()


@app.post("/auth/login")
async def gateway_login(form_data: User = Depends()):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{USERS_SERVICE_URL}/token",
            data={"username": form_data.username, "password": form_data.password}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json().get("detail", "Invalid credentials"))
    return resp.json()


@app.get("/dictionaries/cities")
async def get_cities():
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{DICT_SERVICE_URL}/cities")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch cities")
    return resp.json()


@app.get("/dictionaries/flights")
async def get_flights():
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{DICT_SERVICE_URL}/flights")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch flights")
    return resp.json()


@app.get("/booking/tickets")
async def get_user_tickets(payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BOOKING_SERVICE_URL}/tickets",
            headers={"X-User-Id": payload["sub"], "X-User-Role": payload["role"]}
        )
    return resp.json()


@app.post("/booking/tickets")
async def book_ticket(flight_id: str, price: float, payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BOOKING_SERVICE_URL}/tickets",
            headers={"X-User-Id": payload["sub"]},
            json={
                "flight_id": flight_id,
                "price": price,
                "user_id": payload["sub"]
            }
        )

    if resp.status_code == 200:
        return resp.json()
    else:
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json().get("detail", "Error booking ticket")
        )


@app.patch("/booking/tickets/{ticket_id}/pay")
async def pay_ticket(ticket_id: str, payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{BOOKING_SERVICE_URL}/tickets/{ticket_id}/pay",
            headers={"X-User-Id": payload["sub"], "X-User-Role": payload["role"]},
            json={"ticket_id": ticket_id}
        )
    return resp.json()


@app.post("/orders")
async def create_order(ticket_id: str, payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ORDER_SERVICE_URL}/orders",
            headers={"X-User-Id": payload["sub"], "X-User-Role": payload["role"]},
            json={"ticket_id": ticket_id}
        )
    return resp.json()


@app.get("/admin/orders/")
async def get_orders_admin(payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{ORDER_SERVICE_URL}/orders/admin",
            headers={"X-User-Id": payload["sub"], "X-User-Role": payload["role"]}
        )
    return resp.json()


@app.get("/orders")
async def get_orders(payload=Depends(validate_token)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{ORDER_SERVICE_URL}/orders/",
                headers={"X-User-Id": payload["sub"], "Accept": "application/json"}
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.json().get("detail", "Failed to fetch orders"))
        return resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Internal Gateway Error: {str(e)}")


@app.delete("/booking/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, payload=Depends(validate_token)):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{BOOKING_SERVICE_URL}/tickets/{ticket_id}",
            headers={"X-User-Id": payload["sub"]}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json().get("detail", "Failed to delete ticket"))
    return resp.json()


@app.post("/dictionaries/cities", dependencies=[Depends(validate_token)])
async def add_city(city: dict):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{DICT_SERVICE_URL}/cities",
            json=city
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@app.delete("/dictionaries/city", dependencies=[Depends(validate_token)])
async def delete_city(city_name: str):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{DICT_SERVICE_URL}/city",
            params={"city_name": city_name}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@app.delete("/dictionaries/cities", dependencies=[Depends(validate_token)])
async def delete_cities():
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{DICT_SERVICE_URL}/cities"
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@app.post("/dictionaries/flights", dependencies=[Depends(validate_token)])
async def add_flight(flight: dict):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{DICT_SERVICE_URL}/flights",
            json=flight
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@app.delete("/dictionaries/flight", dependencies=[Depends(validate_token)])
async def delete_flight(flight_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{DICT_SERVICE_URL}/flight",
            params={"flight_id": flight_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()
