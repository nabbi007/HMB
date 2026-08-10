"""Payment gateway — SIMULATED.

The whole point of this module is to be the single seam we swap for a real provider
(Paystack) later. Every function returns the same shape a real gateway would, so the
callers in `app/api/bookings.py` never change when we go live:

    - charge()  -> a Paystack "initialize transaction" + "verify transaction"
    - payout()  -> a Paystack "Transfer" (needs a transfer-verified business account)
    - refund()  -> a Paystack "refund"

Today these just mint a fake reference and report success. When keys land, replace the
bodies here (and add init/verify/webhook plumbing) — nothing else in the app moves.
"""

import uuid

# HMB's platform commission on each completed booking.
HMB_FEE_RATE = 0.10


def _ref(prefix: str) -> str:
    # Not Date.now/random-sensitive for correctness; a uuid is a fine unique token.
    return f"sim_{prefix}_{uuid.uuid4().hex[:14]}"


def charge(amount: float) -> str:
    """Charge the mother. Real: Paystack initialize + verify. Returns a provider ref."""
    return _ref("ch")


def payout(amount: float, recipient_key: str) -> str:
    """Pay the nurse (amount already net of fee). Real: Paystack Transfer to a recipient."""
    return _ref("po")


def refund(original_ref: str | None) -> str:
    """Refund a held charge. Real: Paystack refund against the original transaction."""
    return _ref("rf")
