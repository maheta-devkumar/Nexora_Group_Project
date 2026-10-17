# chatbot_controller.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from services.chatbot_service import ChatbotService
from schemas.chatbot_schema import ChatbotDataResponse
import traceback


class ChatbotController:
    def __init__(self, db: Session):
        self.db = db
        self.chatbot_service = ChatbotService()
    
    def get_complete_chatbot_data(self, current_user_id: int = None) -> ChatbotDataResponse:
        """
        Get chatbot data
        """
        try:
            print(f"Controller: Getting chatbot data for user_id: {current_user_id}")
            
            response = self.chatbot_service.get_all_data_for_chatbot(
                self.db, 
                current_user_id
            )
            
            print(f"Controller: Data retrieved successfully")
            return response
            
        except Exception as e:
            print(f"Error in chatbot controller: {str(e)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve chatbot data: {str(e)}"
            )