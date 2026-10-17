from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from config.database import Base

class Permission(Base):
    __tablename__ = "permission"

    permission_id = Column(Integer, primary_key=True, index=True)
    permission_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))

    role_permissions = relationship("RolePermission", back_populates="permission")

class Role(Base):
    __tablename__ = "role"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)

    users = relationship("UserRole", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role")

class UserRole(Base):
    __tablename__ = "user_role"

    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("role.role_id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(TIMESTAMP, server_default=func.now())

    role = relationship("Role", back_populates="users")
    user = relationship("User", back_populates="roles")

class RolePermission(Base):
    __tablename__ = "role_permission"

    role_id = Column(Integer, ForeignKey("role.role_id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permission.permission_id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(TIMESTAMP, server_default=func.now())

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="role_permissions")