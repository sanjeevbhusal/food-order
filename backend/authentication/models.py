from typing import Any

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

# A model represents a table in the database.
# To perform database operations, Django uses a model manager. Each model gets a default model manager.

# To create a super user, django will need to know which model represents User in your application. Django by default comes with a User model. If you want to override that with your own user model, you have to set it in the settings. This user model also has a custom model manager that extends from the default model manager. This is because django needs a function that should be invoked everytime a super user is created. Django adds that function to the model manager.

# Now, since you override the default user model, you will also have to create your own user manager. This is because the default user manager is tightly coupled with the default user model.

# Create your models here.


class UserManager(BaseUserManager):

    def _create_user(
        self, first_name: str, last_name: str, email: str, password: str, **extra_fields
    ):
        email = self.normalize_email(email)
        user = self.model(
            first_name=first_name, last_name=last_name, email=email, **extra_fields
        )
        user.password = make_password(password)
        user.save()
        return user

    def create_user(
        self, first_name: str, last_name: str, email: str, password: str, **extra_fields
    ):
        """
        Create and save a user with the given first_name, last_name, email, and password.
        """
        extra_fields["is_staff"] = False
        extra_fields["is_superuser"] = False
        return self._create_user(first_name, last_name, email, password, **extra_fields)

    def create_superuser(
        self, first_name: str, last_name: str, email: str, password: str, **extra_fields
    ):
        """
        Create and save a super user with the given first_name, last_name, email, and password.
        """
        extra_fields["is_active"] = True
        extra_fields["is_staff"] = True
        extra_fields["is_superuser"] = True

        return self._create_user(first_name, last_name, email, password, **extra_fields)


class User(AbstractBaseUser):
    first_name = models.CharField()
    last_name = models.CharField()
    email = models.EmailField(unique=True)

    is_email_verified = models.BooleanField(default=False)

    # Toggle this field if you want to delete the user
    is_active = models.BooleanField(default=False)

    # If the user is not a staff user, he can't login to the admin panel. This is django's default behaviour and we can't do much about it.
    is_staff = models.BooleanField(default=False)

    # If the user is not a superuser, he cannot view anything in the admin panel (look for has_perm and has_module_perm function below). This is our custom implementation and django doesn't provide this by default.
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def has_perm(self, perm: Any, obj: Any = None) -> bool:
        return self.is_superuser

    def has_module_perms(self, app_label: Any) -> bool:
        return self.is_superuser


class ResetPasswordToken(models.Model):
    token = models.CharField()
    used = models.BooleanField(default=False)
