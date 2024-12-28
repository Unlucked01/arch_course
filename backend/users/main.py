from typing import Optional, Annotated
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import motor.motor_asyncio
from passlib.context import CryptContext
from jose import jwt, JWTError
import time
from bson import ObjectId

app = FastAPI(title="Users Service")

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://mongo:27017")
db = client["gateway_users_db"]
users_collection = db["users"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "SECRET_JWT_KEY"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class User(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    role: Optional[str] = None


class UserInDB(User):
    hashed_password: str


class UserCreate(BaseModel):
    username: str
    password: str


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_token(user_id: str, role: str):
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + 3600
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


async def get_user_by_username(username: str) -> Optional[UserInDB]:
    user = await users_collection.find_one({"username": username})
    if user:
        return UserInDB(
            username=user["username"],
            full_name=None,
            email=None,
            disabled=False,
            role=user["role"],
            hashed_password=user["hashed_password"]
        )
    return None


async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_db = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_db:
            raise HTTPException(status_code=401, detail="User not found")

        user = UserInDB(
            username=user_db["username"],
            full_name=None,
            email=None,
            disabled=False,
            role=user_db["role"],
            hashed_password=user_db["hashed_password"]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(
        current_user: Annotated[UserInDB, Depends(get_current_user)]
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@app.post("/users/register")
async def register_user(user: UserCreate):
    existing = await users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_pw = get_password_hash(user.password)
    new_user = {
        "username": user.username,
        "hashed_password": hashed_pw,
        "role": "customer",
    }
    await users_collection.insert_one(new_user)
    return {"message": "User registered successfully"}


@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    user_db = await users_collection.find_one({"username": user.username})
    user_id_str = str(user_db["_id"])
    access_token = create_token(user_id_str, user.role or "customer")
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def read_users_me(current_user: Annotated[UserInDB, Depends(get_current_active_user)]):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "disabled": current_user.disabled
    }


@app.post("/users/add_role")
async def add_role(role: str, current_user: Annotated[UserInDB, Depends(get_current_active_user)]):
    await users_collection.update_one({"username": current_user.username}, {"$set": {"role": role}})
    return {"message": f"Role {role} assigned to {current_user.username}"}
