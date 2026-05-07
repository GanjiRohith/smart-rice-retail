from sqlalchemy import text


def get_order_status(
    db,
    order_id
):

    query = text("""

        SELECT
            order_status

        FROM orders

        WHERE order_id=:order_id

    """)

    result = db.execute(
        query,
        {
            "order_id": order_id
        }
    ).fetchone()

    if not result:

        return "Order not found"

    return result[0]


def get_payment_status(
    db,
    order_id
):

    query = text("""

        SELECT
            payment_status

        FROM orders

        WHERE order_id=:order_id

    """)

    result = db.execute(
        query,
        {
            "order_id": order_id
        }
    ).fetchone()

    if not result:

        return "Payment not found"

    return result[0]