from ninja import Schema
from pydantic.alias_generators import to_snake


def _to_camel(string: str) -> str:
    base = "".join(word.capitalize() for word in string.split("_"))
    return f"{base[0].lower()}{base[1:]}"


class RequestSchema(Schema):

    class Config:
        alias_generator = _to_camel


class ResponseSchema(Schema):

    class Config:
        alias_generator = to_snake
