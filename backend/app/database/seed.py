from datetime import datetime, date, timedelta

from app.core.security import hash_password
from app.database.db import SessionLocal, engine
from app.database.models import (
    Base,
    User,
    Product,
    Inventory,
    Order,
    OrderItem,
    Payment,
    Sale,
)


def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    try:
        existing_owner = session.query(User).filter(User.email == "owner@test.com").first()
        if existing_owner:
            print("Seed data already exists. Exiting without duplicate insert.")
            return

        now = datetime.utcnow()

        users = [
            User(
                name="Owner Admin",
                email="owner@test.com",
                password_hash=hash_password("owner123"),
                role="owner",
                phone="911234567890",
                address="MG Road, Bengaluru, Karnataka",
                created_at=now - timedelta(days=60),
            ),
            User(
                name="User One",
                email="user1@test.com",
                password_hash=hash_password("user123"),
                role="customer",
                phone="912345678901",
                address="Koramangala, Bengaluru",
                created_at=now - timedelta(days=30),
            ),
            User(
                name="User Two",
                email="user2@test.com",
                password_hash=hash_password("user123"),
                role="customer",
                phone="912345678902",
                address="Jayanagar, Bengaluru",
                created_at=now - timedelta(days=28),
            ),
            User(
                name="User Three",
                email="user3@test.com",
                password_hash=hash_password("user123"),
                role="customer",
                phone="912345678903",
                address="Indiranagar, Bengaluru",
                created_at=now - timedelta(days=25),
            ),
            User(
                name="User Four",
                email="user4@test.com",
                password_hash=hash_password("user123"),
                role="customer",
                phone="912345678904",
                address="Whitefield, Bengaluru",
                created_at=now - timedelta(days=20),
            ),
            User(
                name="User Five",
                email="user5@test.com",
                password_hash=hash_password("user123"),
                role="customer",
                phone="912345678905",
                address="Yelahanka, Bengaluru",
                created_at=now - timedelta(days=15),
            ),
        ]
        session.add_all(users)
        session.flush()

        products_data = [
            {
                "rice_type": "Basmati Rice",
                "brand": "Royal Harvest",
                "rice_age_months": 12,
                "price_per_kg": 235.0,
                "package_size": 5.0,
                "stock_quantity": 120,
                "description": "Aromatic long-grain basmati rice with a premium fragrance and soft texture.",
                "image_url": "https://example.com/images/basmati_rice.jpg",
            },
            {
                "rice_type": "Sona Masoori",
                "brand": "South Grain",
                "rice_age_months": 8,
                "price_per_kg": 180.0,
                "package_size": 5.0,
                "stock_quantity": 95,
                "description": "Light, fluffy sona masoori rice ideal for daily meals and South Indian dishes.",
                "image_url": "https://example.com/images/sona_masoori.jpg",
            },
            {
                "rice_type": "Brown Rice",
                "brand": "Nature Pure",
                "rice_age_months": 6,
                "price_per_kg": 210.0,
                "package_size": 2.0,
                "stock_quantity": 75,
                "description": "Healthy whole grain brown rice with natural fiber and nutty flavor.",
                "image_url": "https://example.com/images/brown_rice.jpg",
            },
            {
                "rice_type": "Ponni Rice",
                "brand": "Tamil Pantry",
                "rice_age_months": 9,
                "price_per_kg": 42.0,
                "package_size": 1.0,
                "stock_quantity": 180,
                "description": "Classic Ponni rice with a soft bite, perfect for everyday South Indian cooking.",
                "image_url": "https://example.com/images/ponni_rice.jpg",
            },
            {
                "rice_type": "Idli Rice",
                "brand": "South Chef",
                "rice_age_months": 7,
                "price_per_kg": 145.0,
                "package_size": 2.0,
                "stock_quantity": 90,
                "description": "Special rice for soft idlis and dosa batter with balanced starch levels.",
                "image_url": "https://example.com/images/idli_rice.jpg",
            },
            {
                "rice_type": "Boiled Rice",
                "brand": "Daily Grain",
                "rice_age_months": 5,
                "price_per_kg": 170.0,
                "package_size": 5.0,
                "stock_quantity": 105,
                "description": "Parboiled rice with rich nutrition and firm grains that cook without sticking.",
                "image_url": "https://example.com/images/boiled_rice.jpg",
            },
            {
                "rice_type": "Organic Rice",
                "brand": "Green Fields",
                "rice_age_months": 10,
                "price_per_kg": 345.0,
                "package_size": 5.0,
                "stock_quantity": 60,
                "description": "Certified organic rice grown without pesticides for healthy family meals.",
                "image_url": "https://example.com/images/organic_rice.jpg",
            },
            {
                "rice_type": "Premium Rice Bags",
                "brand": "Elite Grain",
                "rice_age_months": 11,
                "price_per_kg": 74.95,
                "package_size": 20.0,
                "stock_quantity": 45,
                "description": "Premium 20kg rice bag with carefully selected long grains for large households.",
                "image_url": "https://example.com/images/premium_rice_bag.jpg",
            },
            {
                "rice_type": "Extra Long Basmati",
                "brand": "King Basmati",
                "rice_age_months": 13,
                "price_per_kg": 255.0,
                "package_size": 2.0,
                "stock_quantity": 80,
                "description": "Extra long basmati rice with exceptional aroma and non-sticky grains.",
                "image_url": "https://example.com/images/extra_long_basmati.jpg",
            },
            {
                "rice_type": "Premium Sona Masoori",
                "brand": "Gold Leaf",
                "rice_age_months": 9,
                "price_per_kg": 195.0,
                "package_size": 5.0,
                "stock_quantity": 70,
                "description": "Premium quality sona masoori rice with refined texture and consistent cooking.",
                "image_url": "https://example.com/images/premium_sona_masoori.jpg",
            },
            {
                "rice_type": "Ponni Rice 10kg Pack",
                "brand": "Village Choice",
                "rice_age_months": 9,
                "price_per_kg": 41.5,
                "package_size": 10.0,
                "stock_quantity": 50,
                "description": "Economy 10kg pack of Ponni rice for families who cook daily meals.",
                "image_url": "https://example.com/images/ponni_rice_10kg.jpg",
            },
            {
                "rice_type": "Brown Rice 5kg",
                "brand": "Healthy Harvest",
                "rice_age_months": 6,
                "price_per_kg": 205.0,
                "package_size": 5.0,
                "stock_quantity": 55,
                "description": "Larger 5kg pack of whole grain brown rice for nutritious cooking.",
                "image_url": "https://example.com/images/brown_rice_5kg.jpg",
            },
            {
                "rice_type": "Steam Rice",
                "brand": "River Grain",
                "rice_age_months": 8,
                "price_per_kg": 165.0,
                "package_size": 5.0,
                "stock_quantity": 100,
                "description": "Steam rice with a polished finish and soft texture for everyday meals.",
                "image_url": "https://example.com/images/steam_rice.jpg",
            },
            {
                "rice_type": "Aromatic Rice",
                "brand": "Monsoon Harvest",
                "rice_age_months": 11,
                "price_per_kg": 260.0,
                "package_size": 5.0,
                "stock_quantity": 85,
                "description": "Aromatic rice with a rich scent and delicate flavor for special occasions.",
                "image_url": "https://example.com/images/aromatic_rice.jpg",
            },
            {
                "rice_type": "Everyday Rice",
                "brand": "Family Grain",
                "rice_age_months": 5,
                "price_per_kg": 150.0,
                "package_size": 5.0,
                "stock_quantity": 140,
                "description": "Economic everyday rice for regular use, balanced in taste and texture.",
                "image_url": "https://example.com/images/everyday_rice.jpg",
            },
        ]

        products = []
        for item in products_data:
            product = Product(
                rice_type=item["rice_type"],
                brand=item["brand"],
                rice_age_months=item["rice_age_months"],
                price_per_kg=item["price_per_kg"],
                package_size=item["package_size"],
                stock_quantity=item["stock_quantity"],
                category="Rice",
                description=item["description"],
                image_url=item["image_url"],
                created_at=now - timedelta(days=14),
            )
            session.add(product)
            products.append(product)

        session.flush()

        inventory_items = []
        for product in products:
            inventory_items.append(
                Inventory(
                    product_id=product.product_id,
                    stock_available=product.stock_quantity,
                    reorder_level=40 if product.stock_quantity >= 100 else 30,
                    warehouse_location="Bengaluru Central Warehouse",
                    updated_at=now - timedelta(days=2),
                )
            )
        session.add_all(inventory_items)
        session.flush()

        order_records = []
        order_items = []
        payment_records = []

        order_templates = [
            {
                "customer": users[1],
                "items": [
                    {"product": products[0], "quantity": 2.0},
                    {"product": products[4], "quantity": 1.0},
                ],
                "delivery_address": "No. 12, 4th Cross, Koramangala, Bengaluru",
                "payment_method": "online",
                "payment_status": "paid",
                "order_status": "delivered",
                "order_offset_days": 10,
                "delivery_offset_days": 7,
                "transaction_id": "TXN1001",
            },
            {
                "customer": users[2],
                "items": [
                    {"product": products[7], "quantity": 1.0},
                ],
                "delivery_address": "Apt 301, Prestige Shantiniketan, Jayanagar, Bengaluru",
                "payment_method": "online",
                "payment_status": "paid",
                "order_status": "delivered",
                "order_offset_days": 6,
                "delivery_offset_days": 4,
                "transaction_id": "TXN1002",
            },
            {
                "customer": users[3],
                "items": [
                    {"product": products[6], "quantity": 1.0},
                    {"product": products[2], "quantity": 1.0},
                ],
                "delivery_address": "19th Main Road, Indiranagar, Bengaluru",
                "payment_method": "cash",
                "payment_status": "pending",
                "order_status": "placed",
                "order_offset_days": 2,
                "delivery_offset_days": None,
                "transaction_id": None,
            },
            {
                "customer": users[4],
                "items": [
                    {"product": products[1], "quantity": 3.0},
                ],
                "delivery_address": "Hoodi Main Road, Whitefield, Bengaluru",
                "payment_method": "online",
                "payment_status": "paid",
                "order_status": "shipped",
                "order_offset_days": 4,
                "delivery_offset_days": 2,
                "transaction_id": "TXN1003",
            },
            {
                "customer": users[5],
                "items": [
                    {"product": products[3], "quantity": 2.0},
                    {"product": products[5], "quantity": 1.0},
                ],
                "delivery_address": "Nandini Layout, Yelahanka, Bengaluru",
                "payment_method": "online",
                "payment_status": "paid",
                "order_status": "confirmed",
                "order_offset_days": 1,
                "delivery_offset_days": None,
                "transaction_id": "TXN1004",
            },
        ]

        for template in order_templates:
            total_amount = sum(item["quantity"] * item["product"].price_per_kg for item in template["items"])
            order_date = now - timedelta(days=template["order_offset_days"])
            delivery_date = (
                order_date + timedelta(days=template["delivery_offset_days"])
                if template["delivery_offset_days"] is not None
                else None
            )
            order = Order(
                customer_id=template["customer"].user_id,
                total_amount=round(total_amount, 2),
                payment_status=template["payment_status"],
                order_status=template["order_status"],
                order_date=order_date,
                delivery_date=delivery_date,
                delivery_address=template["delivery_address"],
            )
            session.add(order)
            session.flush()

            for item in template["items"]:
                order_item = OrderItem(
                    order_id=order.order_id,
                    product_id=item["product"].product_id,
                    quantity=item["quantity"],
                    unit_price=item["product"].price_per_kg,
                )
                order_items.append(order_item)
            session.add_all(order_items[-len(template["items"]):])

            payment = Payment(
                order_id=order.order_id,
                amount=round(total_amount, 2),
                payment_method=template["payment_method"],
                payment_status=template["payment_status"],
                transaction_id=template["transaction_id"] or f"TXN{order.order_id + 1000}",
                created_at=order_date + timedelta(hours=2),
            )
            payment_records.append(payment)
            session.add(payment)

        sale_records = [
            Sale(
                date=date.today() - timedelta(days=12),
                region="Karnataka",
                rice_type="Basmati Rice",
                rice_age_months=12,
                price_per_kg=235.0,
                quantity_sold=220.0,
                festival_flag=False,
                season="Summer",
                temperature=28.0,
                rainfall=12.0,
                weekday=2,
                stock_available=120,
                supplier_name="Royal Harvest Suppliers",
                transport_cost=4.5,
                marketing_spend=1200.0,
                discount=5.0,
                competitor_price=240.0,
                online_orders=65,
                offline_orders=30,
                holiday_flag=False,
                sudden_spike_flag=False,
            ),
            Sale(
                date=date.today() - timedelta(days=9),
                region="Tamil Nadu",
                rice_type="Ponni Rice",
                rice_age_months=9,
                price_per_kg=42.0,
                quantity_sold=360.0,
                festival_flag=True,
                season="Summer",
                temperature=31.0,
                rainfall=18.0,
                weekday=5,
                stock_available=180,
                supplier_name="Tamil Pantry Distributors",
                transport_cost=3.2,
                marketing_spend=800.0,
                discount=3.0,
                competitor_price=44.0,
                online_orders=80,
                offline_orders=45,
                holiday_flag=True,
                sudden_spike_flag=False,
            ),
            Sale(
                date=date.today() - timedelta(days=7),
                region="Maharashtra",
                rice_type="Brown Rice",
                rice_age_months=6,
                price_per_kg=210.0,
                quantity_sold=95.0,
                festival_flag=False,
                season="Monsoon",
                temperature=25.0,
                rainfall=28.0,
                weekday=7,
                stock_available=75,
                supplier_name="Nature Pure Suppliers",
                transport_cost=5.0,
                marketing_spend=600.0,
                discount=4.0,
                competitor_price=215.0,
                online_orders=30,
                offline_orders=20,
                holiday_flag=False,
                sudden_spike_flag=False,
            ),
            Sale(
                date=date.today() - timedelta(days=4),
                region="Karnataka",
                rice_type="Organic Rice",
                rice_age_months=10,
                price_per_kg=345.0,
                quantity_sold=55.0,
                festival_flag=False,
                season="Monsoon",
                temperature=26.0,
                rainfall=22.0,
                weekday=3,
                stock_available=60,
                supplier_name="Green Fields Organics",
                transport_cost=5.5,
                marketing_spend=1400.0,
                discount=2.0,
                competitor_price=350.0,
                online_orders=40,
                offline_orders=10,
                holiday_flag=False,
                sudden_spike_flag=False,
            ),
            Sale(
                date=date.today() - timedelta(days=2),
                region="Karnataka",
                rice_type="Premium Rice Bags",
                rice_age_months=11,
                price_per_kg=74.95,
                quantity_sold=28.0,
                festival_flag=False,
                season="Summer",
                temperature=29.0,
                rainfall=10.0,
                weekday=6,
                stock_available=45,
                supplier_name="Elite Grain Imports",
                transport_cost=3.8,
                marketing_spend=900.0,
                discount=1.0,
                competitor_price=79.0,
                online_orders=12,
                offline_orders=10,
                holiday_flag=False,
                sudden_spike_flag=False,
            ),
        ]
        session.add_all(sale_records)

        session.commit()

        sample_cart_items = [
            {"user_id": users[1].user_id, "product_id": products[0].product_id, "quantity": 2.0},
            {"user_id": users[2].user_id, "product_id": products[7].product_id, "quantity": 1.0},
            {"user_id": users[3].user_id, "product_id": products[4].product_id, "quantity": 3.0},
            {"user_id": users[4].user_id, "product_id": products[1].product_id, "quantity": 1.0},
            {"user_id": users[5].user_id, "product_id": products[3].product_id, "quantity": 2.0},
        ]

        print("Demo seed data inserted successfully.")
        print("Sample cart items (not persisted to a cart table):")
        for cart_item in sample_cart_items:
            print(cart_item)

    except Exception as exc:
        session.rollback()
        print(f"[ERROR] Seeding failed: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_demo_data()
