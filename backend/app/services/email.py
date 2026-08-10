"""Email delivery. Dev sends to Mailpit; prod swaps SMTP settings for a real provider.

Uses stdlib smtplib (no extra dependency). Kept tiny and synchronous to match the
rest of the backend.
"""

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    # Two TLS modes: implicit SSL (port 465) vs STARTTLS (port 587). Mailpit uses neither.
    if settings.smtp_ssl:
        smtp: smtplib.SMTP = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
    else:
        smtp = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
    with smtp:
        if settings.smtp_starttls and not settings.smtp_ssl:
            smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)


def send_otp_email(to: str, code: str) -> None:
    send_email(
        to,
        "Your HelloMamaBetter verification code",
        f"Your verification code is {code}.\n\n"
        f"It expires in {settings.otp_expire_minutes} minutes. "
        "If you didn't request this, you can ignore this email.",
    )


def send_password_reset_email(to: str, code: str) -> None:
    send_email(
        to,
        "Reset your HelloMamaBetter password",
        f"Your password reset code is {code}.\n\n"
        f"It expires in {settings.otp_expire_minutes} minutes. "
        "If you didn't request a password reset, you can ignore this email.",
    )


def send_verification_approved_email(to: str) -> None:
    send_email(
        to,
        "You're verified on HelloMamaBetter 🎉",
        "Great news — HMB has verified your account. You now appear in search and "
        "can start receiving bookings. Welcome aboard!",
    )


def send_verification_rejected_email(to: str, reason: str) -> None:
    send_email(
        to,
        "About your HelloMamaBetter verification",
        f"We couldn't verify your account yet.\n\nReason: {reason}\n\n"
        "Please update your documents and we'll review again.",
    )


def send_booking_request_email(to: str, mother_name: str, care_date: str) -> None:
    send_email(
        to,
        "New booking request on HelloMamaBetter",
        f"{mother_name} has requested a booking for {care_date}. "
        "Open your dashboard to accept or decline.",
    )


def send_booking_decision_email(to: str, nurse_name: str, accepted: bool) -> None:
    outcome = "accepted" if accepted else "declined"
    send_email(
        to,
        f"Your booking was {outcome}",
        f"{nurse_name} has {outcome} your booking request. Open the app for details.",
    )


def send_payment_received_email(to: str, mother_name: str, care_date: str) -> None:
    send_email(
        to,
        "Payment confirmed — your booking is set",
        f"{mother_name} has paid for the booking on {care_date}. "
        "It's now confirmed. The fee is held securely and released to you after the shift.",
    )


def send_payout_email(to: str, amount: str) -> None:
    send_email(
        to,
        "Your payout is on the way",
        f"The booking is complete and GHS {amount} (after the HMB fee) is being paid out to you. "
        "Thank you for the care you provide.",
    )


def send_refund_email(to: str, amount: str) -> None:
    send_email(
        to,
        "Your booking was refunded",
        f"Your booking was cancelled and GHS {amount} has been refunded. "
        "It may take a few days to reflect.",
    )
