from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# DJ Senoh Models
class Festival(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    year: int
    location: str
    date: str
    description: str
    venue_info: dict
    sound_system: dict
    family_services: List[dict]
    ticket_info: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DJProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    stage_name: str
    location: str
    music_styles: List[str]
    career_start: int
    bio: str
    philosophy: dict
    timeline: List[dict]
    social_links: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TicketReservation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    festival_id: str
    name: str
    email: str
    phone: str
    ticket_type: str
    quantity: int
    total_price: int
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NFTMoment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_base64: str
    moment_timestamp: str
    rarity: str
    attributes: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Create Models for Input
class TicketReservationCreate(BaseModel):
    festival_id: str
    name: str
    email: str
    phone: str
    ticket_type: str
    quantity: int


# Initialize sample data
@api_router.on_event("startup")
async def startup_event():
    # Check if festival data exists, if not create sample data
    existing_festival = await db.festivals.find_one({"name": "Moment Festival"})
    if not existing_festival:
        sample_festival = Festival(
            name="Moment Festival",
            year=2025,
            location="奈良県天川村 フォレスト・イン洞川",
            date="2025年7月26日-27日",
            description="自然と電子音楽が織りなす至福の瞬間。『今、この瞬間』へピントを合わせる音楽体験。",
            venue_info={
                "name": "フォレスト・イン洞川",
                "address": "奈良県天川村",
                "features": ["神聖な自然環境", "温泉街", "キャンプ場", "清流"],
                "access": "関西からアクセス良好な秘境の地"
            },
            sound_system={
                "primary": "Alcons Audio",
                "secondary": "Function One",
                "description": "プロ仕様ラインアレイスピーカーによる圧倒的な音質体験"
            },
            family_services=[
                {
                    "name": "キッズエリア",
                    "description": "安全に配慮した専用エリア",
                    "icon": "👶"
                },
                {
                    "name": "こどもごはん", 
                    "description": "栄養バランスを考慮したメニュー",
                    "icon": "🍱"
                },
                {
                    "name": "保育士常駐",
                    "description": "資格を持つスタッフが常駐",
                    "icon": "👩‍⚕️"
                },
                {
                    "name": "ワークショップ",
                    "description": "多彩なアクティビティ",
                    "icon": "🎨"
                }
            ],
            ticket_info={
                "early_bird": {"price": 15000, "description": "早割チケット"},
                "regular": {"price": 18000, "description": "一般チケット"},
                "vip": {"price": 35000, "description": "VIP体験チケット"},
                "family": {"price": 40000, "description": "ファミリーパック(大人2名+子供2名)"}
            }
        )
        await db.festivals.insert_one(sample_festival.dict())
    
    # Create DJ Profile if not exists
    existing_dj = await db.dj_profiles.find_one({"stage_name": "DJ Senoh"})
    if not existing_dj:
        sample_dj = DJProfile(
            name="Mike Senoh",
            stage_name="DJ Senoh",
            location="大阪",
            music_styles=["Psytrance", "Techno", "Electronic Music"],
            career_start=2004,
            bio="関西〜全国へとその場の空気感を大切にしたプレイが持ち味。Moment Festivalの主催者として、奈良県天川村での野外フェスティバルを成功に導き、家族も参加できる新しい形の音楽体験を提案し続けている。",
            philosophy={
                "meditation": {
                    "title": "瞑想的体験",
                    "description": "音楽を通じて深い集中状態へと導き、内なる平静を見つける",
                    "icon": "🧘"
                },
                "awareness": {
                    "title": "瞬間の認識", 
                    "description": "今この瞬間の価値を意識し、時間の流れに敏感になる",
                    "icon": "👁️"
                },
                "permanence": {
                    "title": "永続的価値",
                    "description": "一瞬の体験をNFTとして記録し、未来へと継承する", 
                    "icon": "♾️"
                }
            },
            timeline=[
                {"year": 2004, "event": "大阪のクラブ「exodus」オープニングでDJデビュー"},
                {"year": "2004-2014", "event": "関西クラブシーンでPsytranceからTechnoまで幅広く活動"},
                {"year": "2014-2020", "event": "全国各地のフェスティバル出演・イベント主催活動を拡大"},
                {"year": 2021, "event": "Moment Festivalを奈良県天川村で初開催"},
                {"year": "2021-2025", "event": "Moment Festival拡大・音響システム強化・国際的アーティスト招聘"},
                {"year": "2024-2025", "event": "DJ活動20周年 & Moment Festival 5周年記念"}
            ],
            social_links={
                "soundcloud": "@djsenoh",
                "facebook": "DJ Senoh Official",
                "instagram": "@moment_jp",
                "twitter": "@moment_jp"
            }
        )
        await db.dj_profiles.insert_one(sample_dj.dict())

# Festival API endpoints
@api_router.get("/festivals", response_model=List[Festival])
async def get_festivals():
    festivals = await db.festivals.find().to_list(1000)
    return [Festival(**festival) for festival in festivals]

@api_router.get("/festivals/{festival_id}", response_model=Festival)
async def get_festival(festival_id: str):
    festival = await db.festivals.find_one({"id": festival_id})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")
    return Festival(**festival)

# DJ Profile API endpoints  
@api_router.get("/dj-profile", response_model=DJProfile)
async def get_dj_profile():
    dj = await db.dj_profiles.find_one({"stage_name": "DJ Senoh"})
    if not dj:
        raise HTTPException(status_code=404, detail="DJ Profile not found")
    return DJProfile(**dj)

# Ticket Reservation API endpoints
@api_router.post("/ticket-reservation", response_model=TicketReservation)
async def create_ticket_reservation(reservation_data: TicketReservationCreate):
    # Validate festival exists
    festival = await db.festivals.find_one({"id": reservation_data.festival_id})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")
    
    # Calculate total price (simplified)
    ticket_prices = {"early_bird": 15000, "regular": 18000, "vip": 35000, "family": 40000}
    total_price = ticket_prices.get(reservation_data.ticket_type, 18000) * reservation_data.quantity
    
    reservation = TicketReservation(
        **reservation_data.dict(),
        total_price=total_price
    )
    
    await db.ticket_reservations.insert_one(reservation.dict())
    return reservation

@api_router.get("/nft-moments", response_model=List[NFTMoment])
async def get_nft_moments():
    # Return mock NFT data for now
    mock_nfts = [
        NFTMoment(
            title="Sunrise Moment #001",
            description="天川村の神聖な朝日とPsytranceが融合した瞬間",
            image_base64="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSJibGFjayIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjUwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxNTAiIHk9IjIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCI+U3VucmlzZSAjMDAxPC90ZXh0Pgo8L3N2Zz4K",
            moment_timestamp="2024-07-26T06:30:00Z",
            rarity="legendary",
            attributes={"location": "天川村", "genre": "Psytrance", "time": "Sunrise"}
        ),
        NFTMoment(
            title="Forest Echo #002",
            description="森の響きと電子音の完璧な調和",
            image_base64="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTExIi8+CjxwYXRoIGQ9Ik0xMDAgMTAwIEwyMDAgMTAwIEwxNTAgMjAwIFoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjUwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5Gb3Jlc3QgRWNobyAjMDAyPC90ZXh0Pgo8L3N2Zz4K",
            moment_timestamp="2024-07-26T22:15:00Z",
            rarity="rare",
            attributes={"location": "天川村", "genre": "Electronic", "time": "Night"}
        ),
        NFTMoment(
            title="Unity Flow #003",
            description="家族と音楽が一つになった特別な瞬間",
            image_base64="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDAwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjIwMCIgcj0iMjAiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMjAiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjcwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5Vbml0eSBGbG93ICMwMDM8L3RleHQ+Cjwvc3ZnPgo=",
            moment_timestamp="2024-07-27T16:00:00Z", 
            rarity="common",
            attributes={"location": "天川村", "genre": "Ambient", "time": "Afternoon"}
        )
    ]
    return mock_nfts

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()