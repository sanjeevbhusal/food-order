from typing import Dict

import jwt
from authentication.models import ResetPasswordToken, User
from django.conf import settings
from django.contrib.auth import login as login_user
from django.contrib.auth import logout as logout_user
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.http import HttpRequest
from global_utils import RequestSchema, ResponseSchema
from ninja import Router
from pydantic import EmailStr, field_validator, model_validator, validator

router = Router()


class SignupIn(RequestSchema):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


@router.post("/signup", response={201: Dict[str, int], 409: Dict[str, str]})
def signup(request, payload: SignupIn):
    if User.objects.filter(email=payload.email).exists():
        return 409, {"error": "User already exists"}

    user = User(
        first_name=payload.first_name, last_name=payload.last_name, email=payload.email
    )
    user.password = make_password(payload.password)
    user.save()

    token = jwt.encode(
        {"user_id": user.id, "type": "signup_email_verification"},
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    send_mail(
        subject="QuickByte Signup Verification",
        message="",
        recipient_list=[user.email],
        from_email=settings.EMAIL_HOST_USER,
        html_message=f"Verify your email, <a href='http://localhost:5173/signup/verify-email?token={token}' target='_blank'> Click here </a>",
    )

    return 201, {"id": user.id}


class LoginIn(RequestSchema):
    email: EmailStr
    password: str


class LoginOut(ResponseSchema):
    id: int
    firstName: str
    lastName: str
    email: EmailStr


@router.post(
    "/login",
    response={
        200: Dict[str, LoginOut],
        404: Dict[str, str],
        401: Dict[str, str],
        403: Dict[str, str],
    },
)
def login(request: HttpRequest, payload: LoginIn):
    print(
        "request-session",
        request.session.items(),
        "user",
        request.user,
        request.session.test_cookie_worked(),
    )

    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        return 404, {"error": "User does not exist"}

    if not user.check_password(payload.password):
        return 401, {"error": "Invalid password"}

    if not user.is_email_verified:
        return 403, {"error": "Email not verified"}

    login_user(request, user)
    return 200, {"data": user}


@router.post(
    "/logout",
    response={200: Dict[str, str], 404: Dict[str, str], 401: Dict[str, str]},
)
def logout(request: HttpRequest):
    if not isinstance(request.user, User):
        return 401, {"error": "Unauthorized"}

    logout_user(request)
    return 200, {"data": "Ok"}


@router.get(
    "/me",
    response={200: Dict[str, LoginOut], 404: Dict[str, str], 401: Dict[str, str]},
)
def me(request: HttpRequest):
    if not isinstance(request.user, User):
        return 401, {"error": "Unauthorized"}

    return 200, {"data": request.user}


class ForgotPasswordIn(ResponseSchema):
    email: EmailStr


@router.post(
    "/forgot-password",
    response={
        200: Dict[str, bool],
        404: Dict[str, str],
    },
)
def forgot_password(request: HttpRequest, payload: ForgotPasswordIn):
    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        return 404, {"error": "User does not exist"}

    token = jwt.encode(
        {"user_id": user.id, "type": "forgot_password"},
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    ResetPasswordToken.objects.create(token=token)

    send_mail(
        subject="Forgot Password | QuickByte",
        message="",
        recipient_list=[user.email],
        from_email=settings.EMAIL_HOST_USER,
        html_message=f"Reset your password, <a href='http://localhost:5173/reset-password?token={token}' target='_blank'> Click here </a>",
    )

    return 200, {"ok": True}


@router.get(
    "/verify-reset-password-token",
    response={200: Dict[str, bool], 401: Dict[str, str], 404: Dict[str, str]},
)
def verify_reset_password_token(request: HttpRequest, token: str):
    try:
        db_token = ResetPasswordToken.objects.get(token=token)
        if db_token.used:
            return 401, {"error": "Token has been already used"}
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except ResetPasswordToken.DoesNotExist:
        return 404, {"error": "Token doesnot exist"}
    except jwt.ExpiredSignatureError:
        return 401, {"error": "Token has expired"}
    except jwt.DecodeError:
        return 401, {"error": "Token couldnot be decoded"}
    except jwt.InvalidTokenError:
        return 401, {"error": "Token is invalid"}

    if payload.get("type") != "forgot_password":
        return 401, {"error": "Token is not valid for this operation"}

    try:
        user = User.objects.get(pk=payload["user_id"])
    except User.DoesNotExist:
        return 401, {"error": "User associated with token doesnot exist"}

    return 200, {"ok": True}


class ResetPasswordIn(RequestSchema):
    password: str
    confirm_password: str
    token: str

    @model_validator(mode="after")
    def validate_confirm_password(self):
        if self.password != self.confirm_password:
            raise ValueError("Confirm Password should be same as Password")

        return self


@router.post(
    "/reset-password",
    response={200: Dict[str, bool], 401: Dict[str, str]},
)
def reset_password(request: HttpRequest, payload: ResetPasswordIn):
    try:
        db_token = ResetPasswordToken.objects.get(token=payload.token)
        if db_token.used:
            return 401, {"error": "Token has been already used"}
        token_data = jwt.decode(
            payload.token, settings.SECRET_KEY, algorithms=["HS256"]
        )
    except ResetPasswordToken.DoesNotExist:
        return 404, {"error": "Token doesnot exist"}
    except jwt.ExpiredSignatureError:
        return 401, {"error": "Token has expired"}
    except jwt.DecodeError:
        return 401, {"error": "Token couldnot be decoded"}
    except jwt.InvalidTokenError:
        return 401, {"error": "Token is invalid"}

    if token_data.get("type") != "forgot_password":
        return 401, {"error": "Token is not valid for this operation"}

    try:
        user = User.objects.get(pk=token_data["user_id"])
    except User.DoesNotExist:
        return 401, {"error": "User associated with token doesnot exist"}

    user.password = make_password(payload.password)
    user.save()
    db_token.used = True
    db_token.save()

    return 200, {"ok": True}


class SendVerificationEmailIn(RequestSchema):
    email: EmailStr


@router.post(
    "/send-verification-email", response={201: Dict[str, int], 409: Dict[str, str]}
)
def send_verification_email(request, payload: SendVerificationEmailIn):
    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        return 404, {"error": "User does not exist"}

    token = jwt.encode(
        {"user_id": user.id, "type": "signup_email_verification"},
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    send_mail(
        subject="QuickByte Signup Verification",
        message="",
        recipient_list=[user.email],
        from_email=settings.EMAIL_HOST_USER,
        html_message=f"Verify your email, <a href='http://localhost:5173/signup/verify-email?token={token}' target='_blank'> Click here </a>",
    )

    return 201, {"id": user.id}


@router.get("/verify-email", response={200: Dict[str, bool], 401: Dict[str, str]})
def verify_email(request, token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return 401, {"error": "Token expired"}
    except (jwt.DecodeError, jwt.InvalidTokenError):
        return 401, {"error": "Invalid token"}

    if payload.get("type") != "signup_email_verification":
        return 401, {"error": "Invalid token"}

    try:
        user = User.objects.get(pk=payload["user_id"])
    except User.DoesNotExist:
        return 401, {"error": "Invalid token"}

    if user.is_email_verified:
        return 401, {"error": "Invalid token"}

    user.is_email_verified = True
    user.save()
    return 200, {"ok": True}
