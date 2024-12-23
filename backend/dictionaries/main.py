from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends

from contextlib import asynccontextmanager
from datetime import date
import motor.motor_asyncio
from pydantic import BaseModel, Field

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://mongo:27017")
db = client["flights_db"]
flights_collection = db["flights"]
cities_collection = db["cities"]


class CityModel(BaseModel):
    name: str


class FlightModel(BaseModel):
    flight_id: str
    from_: str = Field(..., alias="from")
    to: str
    date: str
    price: Optional[float] = 0.0
    passenger_count: int

    class Config:
        allow_population_by_field_name = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    initial_cities = [
        {"name": "Москва"},
        {"name": "Санкт-Петербург"},
        {"name": "Новосибирск"},
        {"name": "Екатеринбург"},
        {"name": "Казань"},
        {"name": "Нижний Новгород"},
    ]

    for city in initial_cities:
        await cities_collection.update_one(
            {"name": city["name"]}, {"$set": city}, upsert=True,
        )

    flights = [
        {"flight_id": "FL300", "from": "Москва", "to": "Санкт-Петербург",
         "date": date(2024, 12, 20).strftime("%-d %b %Y"), "price": 2500,
         "passenger_count": 150},
        {"flight_id": "FL301", "from": "Санкт-Петербург", "to": "Москва",
         "date": date(2024, 12, 21).strftime("%-d %b %Y"), "price": 2550,
         "passenger_count": 145},
        {"flight_id": "FL302", "from": "Новосибирск", "to": "Екатеринбург",
         "date": date(2024, 12, 22).strftime("%-d %b %Y"), "price": 2500,
         "passenger_count": 130},
        {"flight_id": "FL303", "from": "Екатеринбург", "to": "Казань",
         "date": date(2024, 12, 23).strftime("%-d %b %Y"), "price": 2450,
         "passenger_count": 125},
        {"flight_id": "FL304", "from": "Казань", "to": "Нижний Новгород",
         "date": date(2024, 12, 24).strftime("%-d %b %Y"), "price": 2510,
         "passenger_count": 120},
        {"flight_id": "FL305", "from": "Нижний Новгород", "to": "Москва",
         "date": date(2024, 12, 25).strftime("%-d %b %Y"), "price": 2520,
         "passenger_count": 110},
        {"flight_id": "FL306", "from": "Москва", "to": "Новосибирск",
         "date": date(2024, 12, 26).strftime("%-d %b %Y"), "price": 1900,
         "passenger_count": 140},
        {"flight_id": "FL307", "from": "Санкт-Петербург", "to": "Казань",
         "date": date(2024, 12, 27).strftime("%-d %b %Y"), "price": 2000,
         "passenger_count": 135},
        {"flight_id": "FL308", "from": "Казань", "to": "Екатеринбург",
         "date": date(2024, 12, 28).strftime("%-d %b %Y"), "price": 2810,
         "passenger_count": 125},
        {"flight_id": "FL309", "from": "Екатеринбург", "to": "Новосибирск",
         "date": date(2024, 12, 29).strftime("%-d %b %Y"), "price": 2900,
         "passenger_count": 130},
        {"flight_id": "FL310", "from": "Новосибирск", "to": "Москва",
         "date": date(2024, 12, 30).strftime("%-d %b %Y"), "price": 2200,
         "passenger_count": 145},
        {"flight_id": "FL311", "from": "Москва", "to": "Санкт-Петербург",
         "date": date(2024, 12, 31).strftime("%-d %b %Y"), "price": 2260,
         "passenger_count": 150},
        {"flight_id": "FL312", "from": "Санкт-Петербург", "to": "Новосибирск",
         "date": date(2025, 1, 1).strftime("%-d %b %Y"), "price": 2120,
         "passenger_count": 130},
        {"flight_id": "FL313", "from": "Новосибирск", "to": "Казань",
         "date": date(2025, 1, 2).strftime("%-d %b %Y"), "price": 2490,
         "passenger_count": 120},
        {"flight_id": "FL314", "from": "Казань", "to": "Санкт-Петербург",
         "date": date(2025, 1, 3).strftime("%-d %b %Y"), "price": 2525,
         "passenger_count": 115},
        {"flight_id": "FL315", "from": "Екатеринбург", "to": "Москва",
         "date": date(2025, 1, 4).strftime("%-d %b %Y"), "price": 2890,
         "passenger_count": 135},
        {"flight_id": "FL316", "from": "Москва", "to": "Нижний Новгород",
         "date": date(2025, 1, 5).strftime("%-d %b %Y"), "price": 2525,
         "passenger_count": 110},
        {"flight_id": "FL317", "from": "Нижний Новгород", "to": "Казань",
         "date": date(2025, 1, 6).strftime("%-d %b %Y"), "price": 2120,
         "passenger_count": 125},
        {"flight_id": "FL318", "from": "Казань", "to": "Екатеринбург",
         "date": date(2025, 1, 7).strftime("%-d %b %Y"), "price": 2500,
         "passenger_count": 130},
        {"flight_id": "FL319", "from": "Санкт-Петербург", "to": "Нижний Новгород",
         "date": date(2025, 1, 8).strftime("%-d %b %Y"), "price": 2510,
         "passenger_count": 140},
        {"flight_id": "FL320", "from": "Новосибирск", "to": "Москва",
         "date": date(2025, 1, 9).strftime("%-d %b %Y"), "price": 2600,
         "passenger_count": 145},
        {"flight_id": "FL321", "from": "Москва", "to": "Екатеринбург",
         "date": date(2025, 1, 10).strftime("%-d %b %Y"), "price": 2510,
         "passenger_count": 150},
        {"flight_id": "FL322", "from": "Екатеринбург", "to": "Санкт-Петербург",
         "date": date(2025, 1, 11).strftime("%-d %b %Y"), "price": 2150,
         "passenger_count": 135}

    ]

    for flight in flights:
        await flights_collection.update_one(
            {"flight_id": flight["flight_id"]},
            {"$set": flight},
            upsert=True
        )

    yield

    client.close()


app = FastAPI(title="Dictionaries Service", lifespan=lifespan)


async def admin_role_dependency(role: str = "admin"):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can perform this action")


@app.get("/cities", response_model=List[CityModel])
async def get_cities():
    city_cursot = cities_collection.find({})
    cities = await city_cursot.to_list()

    return [CityModel(**city) for city in cities]


@app.get("/flights", response_model=List[FlightModel])
async def get_flights():
    flights_cursor = flights_collection.find({})
    flights = await flights_cursor.to_list(None)

    return [FlightModel(**flight) for flight in flights]


@app.post("/cities", response_model=CityModel, dependencies=[Depends(admin_role_dependency)])
async def add_city(city: CityModel):
    existing_city = await cities_collection.find_one({"name": city.name})
    if existing_city:
        raise HTTPException(status_code=400, detail="City already exists")

    await cities_collection.insert_one(city.model_dump())
    return city


@app.post("/flights", response_model=FlightModel, dependencies=[Depends(admin_role_dependency)])
async def add_flight(flight: FlightModel):
    existing_flight = await flights_collection.find_one({"flight_id": flight.flight_id})
    if existing_flight:
        raise HTTPException(status_code=400, detail="Flight ID already exists")

    await flights_collection.insert_one(flight.model_dump(by_alias=True))
    return flight


@app.delete("/city", dependencies=[Depends(admin_role_dependency)])
async def delete_city(city_name: str):
    existing_city = await cities_collection.find_one({"name": city_name})
    if not existing_city:
        raise HTTPException(status_code=400, detail="City does not exists")

    await cities_collection.delete_one({"name": city_name})
    return {"message": f"City {city_name} deleted successfully"}


@app.delete("/flight", dependencies=[Depends(admin_role_dependency)])
async def delete_flight(flight_id: str):
    existing_flight = await flights_collection.find_one({"flight_id": flight_id})
    if not existing_flight:
        raise HTTPException(status_code=400, detail="Flight ID does not exists")

    await flights_collection.delete_one({"flight_id": flight_id})
    return {"message": f"Flight {flight_id} deleted successfully"}


@app.delete("/cities", dependencies=[Depends(admin_role_dependency)])
async def delete_cities():
    resp = await cities_collection.delete_many({})
    return {"message": f"{resp.deleted_count} cities deleted successfully"}


@app.delete("/flights", dependencies=[Depends(admin_role_dependency)])
async def delete_flights():
    resp = await flights_collection.delete_many({})
    return {"message": f"{resp.deleted_count} flights deleted successfully"}


@app.patch("/flights/{flight_id}/decrement")
async def decrement_passenger_count(flight_id: str):
    flight = await flights_collection.find_one({"flight_id": flight_id})
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")

    if flight["passenger_count"] <= 0:
        raise HTTPException(status_code=400, detail="No more seats available on this flight")

    await flights_collection.update_one(
        {"flight_id": flight_id},
        {"$inc": {"passenger_count": -1}}
    )
    updated_flight = await flights_collection.find_one({"flight_id": flight_id})
    return {"flight_id": updated_flight["flight_id"], "remaining_seats": updated_flight["passenger_count"]}