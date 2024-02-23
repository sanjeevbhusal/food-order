from ninja import NinjaAPI

from authentication.api import router as authentication_router

api = NinjaAPI()
api.add_router("/authentication", authentication_router)
