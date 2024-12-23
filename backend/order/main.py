import logging
from contextlib import asynccontextmanager
from time import sleep
from typing import Optional

from confluent_kafka import Producer, Consumer, KafkaError
from fastapi import FastAPI, HTTPException, Request
import motor.motor_asyncio
from pydantic import BaseModel
import json
import asyncio

from kafka import start_kafka_producer, start_kafka_consumer, send_message

app = FastAPI(title="Order Service")

logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO)
log = logging.getLogger(__name__)

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://mongo:27017")
db = client["order_db"]
orders_collection = db["orders"]


async def consume_order_requests(consumer: Consumer):
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

            ticket_id = message['ticket_id']
            user_id = message['user_id']
            price = message['price']

            new_order = Order(user_id=user_id, ticket_id=ticket_id, price=price, status="created")

            await orders_collection.insert_one(new_order.model_dump())

            kafka_response = {
                "ticket_id": ticket_id,
                "status": "paid"
            }

            sleep(1)

            send_message(start_kafka_producer(), 'order_responses', kafka_response)

            log.info(f"Order created and response sent for Ticket ID: {ticket_id}")
            consumer.commit()
        except Exception as e:
            log.error(f"Error processing order request: {str(e)}")


producer: Producer
consumer = start_kafka_consumer('order_requests', 'order_requests_group')
consumer_task = asyncio.create_task(consume_order_requests(consumer))


@asynccontextmanager
async def lifespan(app):

    yield

    consumer_task.cancel()
    consumer.close()


class OrderCreate(BaseModel):
    ticket_id: str


class Order(BaseModel):
    user_id: str
    ticket_id: str
    price: Optional[float] = 0
    status: str


@app.post("/orders")
async def create_order(order: OrderCreate, request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    new_order = {
        "user_id": user_id,
        "ticket_id": order.ticket_id,
        "status": "created"
    }

    try:
        result = await orders_collection.insert_one(new_order)

        kafka_message = {
            "ticket_id": order.ticket_id,
            "status": "payed"
        }

        send_message(producer, 'order_responses', kafka_message)
        return {"order_id": str(result.inserted_id), "status": "created"}

    except KafkaError as e:
        raise HTTPException(status_code=500, detail=f"Kafka error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")


@app.get("/orders/admin")
async def get_all_orders_admin(request: Request):
    role = request.headers.get("X-User-Role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    cursor = orders_collection.find({})
    orders = await cursor.to_list(None)
    return [Order(**o) for
            o in orders]


@app.get("/orders/")
async def get_user_orders(request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    cursor = orders_collection.find({"user_id": user_id})
    orders = await cursor.to_list(None)
    return [
        Order(**o)
        for o in orders]

