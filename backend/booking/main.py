import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List

import httpx
from confluent_kafka import Producer, Consumer
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import motor.motor_asyncio
from bson import ObjectId

from kafka import start_kafka_producer, start_kafka_consumer, send_message

app = FastAPI(title="Booking Service")

logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
log = logging.getLogger(__name__)

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://mongo:27017")
db = client["booking_db"]
flight_db = client["flight_db"]
tickets_collection = db["tickets"]


async def consume_order_responses(consumer: Consumer):
    while True:
        try:
            msg = await asyncio.to_thread(consumer.poll, timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                log.error(f"Consumer error: {msg.error()}")
                continue

            message = json.loads(msg.value().decode('utf-8'))
            log.info(f"Received message: {message}")

            ticket_id = message.get('ticket_id')
            status = message.get('status')

            await tickets_collection.update_one(
                {"_id": ObjectId(ticket_id)},
                {"$set": {"paid": True, "status": status}}
            )
            log.info(f"Updated ticket {ticket_id} to status {status}")

        except Exception as e:
            log.error(f"Error consuming Kafka message: {e}")


producer: Producer
consumer = start_kafka_consumer('order_responses', 'order_responses_group')
consumer_task = asyncio.create_task(consume_order_responses(consumer))


@asynccontextmanager
async def lifespan(app):
    yield

    consumer_task.cancel()
    consumer.close()


class TicketCreate(BaseModel):
    ticket_id: Optional[str] = ''
    flight_id: str
    user_id: str
    price: Optional[float] = 0
    status: Optional[str] = "booked"
    paid: Optional[bool] = False


@app.post("/tickets")
async def create_ticket(ticket_data: TicketCreate, request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    async with httpx.AsyncClient() as client:
        decrement_url = f"http://dictionaries:8004/flights/{ticket_data.flight_id}/decrement"
        try:
            response = await client.patch(decrement_url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to decrement passenger count: {response.json().get('detail', 'Unknown error')}"
                )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to dictionaries service: {str(exc)}"
            )

    ticket_doc = ticket_data.model_dump()
    ticket_doc["user_id"] = user_id

    result = await tickets_collection.insert_one(ticket_doc)

    inserted_id_str = str(result.inserted_id)
    await tickets_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"ticket_id": inserted_id_str}}
    )

    return {"ticket_id": inserted_id_str}


@app.patch("/tickets/{ticket_id}/pay")
async def pay_ticket(ticket_id: str, request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id), "user_id": user_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or not yours")

    await tickets_collection.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"paid": False, "status": "pending"}}
    )

    payment_request = {"ticket_id": ticket_id, "user_id": user_id, "price": ticket["price"]}
    try:
        send_message(start_kafka_producer(), "order_requests", payment_request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"ticket_id": ticket_id, "status": "pending"}


@app.get("/tickets", response_model=List[TicketCreate])
async def get_user_tickets(request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    cursor = tickets_collection.find({"user_id": user_id})
    tickets = await cursor.to_list(None)

    return [
        TicketCreate(
            ticket_id=str(t["_id"]),
            flight_id=t["flight_id"],
            user_id=t["user_id"],
            price=t.get("price", 0.0),
            status=t.get("status", "booked"),
            paid=t.get("paid", False)
        )
        for t in tickets
    ]


@app.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = await tickets_collection.delete_one({"_id": ObjectId(ticket_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found or not yours")
    return {"message": f"Ticket {ticket_id} deleted successfully"}
