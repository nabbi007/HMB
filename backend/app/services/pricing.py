"""HMB-controlled pricing. Caregivers do NOT set their own rate.

Rules (agreed):
  - Base GHS 100 covers up to 4 hours in a day.
  - Each hour beyond 4 costs GHS 25 (pro-rata with the base).
  - Multi-day bookings get a discount: 5% for 7+ days, 15% for 30+ days.
"""

from decimal import ROUND_HALF_UP, Decimal

BASE_PRICE = Decimal("100")  # GHS, covers up to BASE_HOURS in a day
BASE_HOURS = 4
HOURLY_OVERAGE = Decimal("25")  # GHS per hour beyond BASE_HOURS


def _money(d: Decimal) -> Decimal:
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def day_price(hours: int) -> Decimal:
    """Price for a single day of `hours` hours."""
    extra = max(0, hours - BASE_HOURS)
    return BASE_PRICE + HOURLY_OVERAGE * extra


def discount_rate(days: int) -> Decimal:
    if days >= 30:
        return Decimal("0.15")
    if days >= 7:
        return Decimal("0.05")
    return Decimal("0")


def quote(hours: int, days: int = 1) -> dict:
    """Full price breakdown for `days` days of `hours` hours each."""
    per_day = day_price(hours)
    subtotal = per_day * days
    rate = discount_rate(days)
    discount_amount = _money(subtotal * rate)
    total = _money(subtotal - discount_amount)
    return {
        "per_day": _money(per_day),
        "days": days,
        "subtotal": _money(subtotal),
        "discount_rate": rate,
        "discount_amount": discount_amount,
        "total": total,
    }
