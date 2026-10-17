from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(data: Any = None, message: str = "Success", status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data
        }
    )

def error_response(message: str = "Error", status_code: int = 400, errors: Optional[dict] = None):
    content = {
        "success": False,
        "message": message
    }
    if errors:
        content["errors"] = errors
    return JSONResponse(status_code=status_code, content=content)

