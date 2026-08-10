import uuid

from pydantic import BaseModel, ConfigDict, Field


class ChildOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    age_years: int | None
    allergies: str | None
    notes: str | None


class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    age_years: int | None = Field(default=None, ge=0, le=25)
    allergies: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)


class ChildUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    age_years: int | None = Field(default=None, ge=0, le=25)
    allergies: str | None = Field(default=None, max_length=1000)
    notes: str | None = Field(default=None, max_length=1000)
