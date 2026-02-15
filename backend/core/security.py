import hashlib
import random
import string

class SecurityUtils:
    """
    Utility class for security-related operations.
    """

    @staticmethod
    def generate_otp(length=6) -> str:
        """Generates a numeric OTP of given length."""
        return "".join([str(random.randint(0, 9)) for _ in range(length)])

    @staticmethod
    def hash_text(text: str) -> str:
        """Hashes text (like OTPs) using SHA-256."""
        if text is None:
            return "" # Return empty string instead of crashing
        return hashlib.sha256(text.encode()).hexdigest()

    @staticmethod
    def verify_hash(plain_text: str, hashed_text: str) -> bool:
        """Verifies if a plain text matches a hash."""
        if plain_text is None:
            return False
        return SecurityUtils.hash_text(plain_text) == hashed_text