from typing import List, Any
from sqlalchemy.orm import Query

class Paginator:
    def __init__(self, query: Query, page: int = 1, per_page: int = 20):
        self.query = query
        self.page = max(1, page)
        self.per_page = min(100, max(1, per_page))
        
    def paginate(self):
        total = self.query.count()
        items = self.query.offset((self.page - 1) * self.per_page).limit(self.per_page).all()
        
        return {
            "items": items,
            "total": total,
            "page": self.page,
            "per_page": self.per_page,
            "total_pages": (total + self.per_page - 1) // self.per_page
        }

