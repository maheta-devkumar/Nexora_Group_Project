# chatbot_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from config.database import get_db
from controllers.chatbot_controller import ChatbotController
from schemas.chatbot_schema import ChatbotDataResponse
from config.dependencies import get_current_user
from fastapi.security import HTTPBearer
import logging
import time
from datetime import datetime
from models.user import User  # Import User model

router = APIRouter(prefix="/api/v1/chatbot", tags=["Chatbot"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


@router.get(
    "/complete-data",
    response_model=ChatbotDataResponse,
    summary="Get complete database data for chatbot",
    description="""
    Returns comprehensive data for chatbot processing.
    
    Includes:
    - User profile and roles
    - Products, categories, variants
    - Cart items, orders, payments
    - Reviews, addresses
    - Delivery data (if delivery person)
    """
)
async def get_complete_chatbot_data(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Changed to User type
) -> ChatbotDataResponse:
    """
    Get all data for chatbot
    """
    start_time = time.time()
    
    try:
        logger.info("Chatbot complete data endpoint called")
        
        # Extract current user ID if authenticated
        current_user_id = None
        if current_user:
            current_user_id = current_user.user_id  # Direct attribute access
            logger.info(f"Processing for user ID: {current_user_id}, Username: {current_user.username}")
        else:
            logger.info("Processing for anonymous user")
        
        # Initialize controller
        controller = ChatbotController(db)
        
        # Get data
        response = controller.get_complete_chatbot_data(current_user_id)
        
        elapsed_time = time.time() - start_time
        
        logger.info(f"Chatbot data retrieved in {elapsed_time:.2f}s")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Error in chatbot endpoint after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/data",
    response_model=ChatbotDataResponse,
    summary="Alternative endpoint for chatbot data",
    description="Same as complete-data but without authentication requirement"
)
async def get_chatbot_data(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user, use_cache=False)  # Optional auth
) -> ChatbotDataResponse:
    """
    Get chatbot data (optional authentication)
    """
    return await get_complete_chatbot_data(db, current_user)


@router.get(
    "/test",
    summary="Test endpoint to verify chatbot is working"
)
async def test_chatbot():
    """
    Test endpoint to verify chatbot is working
    """
    return {
        "success": True,
        "message": "Chatbot API is working",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "complete-data": "GET /api/v1/chatbot/complete-data - Get all data (requires auth)",
            "data": "GET /api/v1/chatbot/data - Get data (optional auth)",
            "test": "GET /api/v1/chatbot/test - Test endpoint"
        }
    }


@router.get(
    "/health",
    summary="Health check for chatbot service"
)
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "chatbot-api",
        "timestamp": datetime.utcnow().isoformat()
    }