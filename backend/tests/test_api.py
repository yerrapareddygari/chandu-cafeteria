"""
Integration tests for the Chandu Cafeteria backend.

Requires a running MongoDB on localhost:27017.
Uses the "kpit_cafeteria_test" database — see conftest.py for fixtures.
"""

import pytest
from bson import ObjectId

from app.main import app
from app.database import db as motor_db
from conftest import test_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _register(ac, emp_id="KP001", name="Test", email="t1@kpit.com", password="test123"):
    r = await ac.post("/auth/register", json={
        "emp_id": emp_id, "name": name, "email": email, "password": password,
    })
    return r


async def _promote_via_db(emp_id: str, role: str):
    """Promote a user via Motor (same driver as the app).
    Auth middleware re-reads the role from DB on every request."""
    await motor_db["users"].update_one({"emp_id": emp_id}, {"$set": {"role": role}})


async def _register_and_login(ac, emp_id="KP001", name="Test", email="t1@kpit.com", password="test123", role="user"):
    """Register (if needed) and login, optionally promoting to a role.
    Always tries to register — ignores duplicate errors since clean_db resets between tests."""
    # Try registering; ignore if already exists (test isolation guarantees clean slate)
    r = await _register(ac, emp_id=emp_id, name=name, email=email, password=password)

    # Direct DB promotion — auth middleware re-reads on every request
    if role != "user":
        await _promote_via_db(emp_id, role)

    r = await ac.post("/auth/login", json={"emp_id": emp_id, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------------------------------------------------------------------------
# AUTH TESTS
# ---------------------------------------------------------------------------

class TestAuth:
    async def test_register_happy_path(self, ac):
        r = await _register(ac)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["message"] == "User registered successfully"
        assert "user_id" in data

    async def test_register_duplicate_emp_id(self, ac):
        await _register(ac, emp_id="DUP1", email="a@kpit.com")
        r = await _register(ac, emp_id="DUP1", email="b@kpit.com")
        assert r.status_code == 409, r.text
        assert "already registered" in r.json()["detail"]

    async def test_register_duplicate_email(self, ac):
        await _register(ac, emp_id="EMA1", email="dup@kpit.com")
        r = await _register(ac, emp_id="EMA2", email="dup@kpit.com")
        assert r.status_code == 409, r.text
        assert "already registered" in r.json()["detail"]

    async def test_register_short_emp_id(self, ac):
        r = await _register(ac, emp_id="AB", email="a@kpit.com")
        assert r.status_code == 422

    async def test_register_invalid_email(self, ac):
        r = await _register(ac, emp_id="KP002", email="not-an-email")
        assert r.status_code == 422

    async def test_register_short_password(self, ac):
        r = await ac.post("/auth/register", json={
            "emp_id": "KP003", "name": "X", "email": "x@kpit.com", "password": "12345",
        })
        assert r.status_code == 422

    async def test_login_happy_path(self, ac):
        await _register(ac, emp_id="KP-L1", email="l1@kpit.com", name="Login1")
        r = await ac.post("/auth/login", json={"emp_id": "KP-L1", "password": "test123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert len(data["token"]) > 20
        user = data["user"]
        assert user["emp_id"] == "KP-L1"
        assert user["name"] == "Login1"
        assert user["role"] == "user"
        assert "hashed_password" not in user
        assert user["created_at"] is not None

    async def test_login_wrong_password(self, ac):
        await _register(ac, emp_id="KP-L2", email="l2@kpit.com")
        r = await ac.post("/auth/login", json={"emp_id": "KP-L2", "password": "wrong"})
        assert r.status_code == 401

    async def test_login_nonexistent_user(self, ac):
        r = await ac.post("/auth/login", json={"emp_id": "GHOST", "password": "x"})
        assert r.status_code == 401

    async def test_me_endpoint(self, ac):
        token = await _register_and_login(ac, emp_id="KP-ME", email="me@kpit.com")
        r = await ac.get("/auth/me", headers=_auth_header(token))
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["emp_id"] == "KP-ME"
        assert "hashed_password" not in data

    async def test_me_without_token(self, ac):
        r = await ac.get("/auth/me")
        assert r.status_code in (401, 403)  # depends on middleware ordering


# ---------------------------------------------------------------------------
# MENU TESTS
# ---------------------------------------------------------------------------

class TestMenu:
    async def test_create_menu_item_as_manager(self, ac):
        token = await _register_and_login(ac, emp_id="MG1", email="mg1@kpit.com", role="manager")
        r = await ac.post("/menu", json={
            "name": "Test Dosa", "category": "South Indian",
            "price": 60, "time_slot": "breakfast", "description": "Crispy",
        }, headers=_auth_header(token))
        assert r.status_code == 200, r.text
        item = r.json()
        assert item["name"] == "Test Dosa"
        assert "_id" in item

    async def test_create_menu_item_as_user_denied(self, ac):
        token = await _register_and_login(ac, emp_id="NU1", email="nu1@kpit.com", role="user")
        r = await ac.post("/menu", json={
            "name": "Dosa", "category": "A", "price": 50, "time_slot": "lunch", "description": "X",
        }, headers=_auth_header(token))
        assert r.status_code == 403

    async def test_get_all_menu(self, ac):
        token = await _register_and_login(ac, emp_id="GM1", email="gm1@kpit.com", role="manager")
        await ac.post("/menu", json={
            "name": "A", "category": "X", "price": 10, "time_slot": "breakfast", "description": "D",
        }, headers=_auth_header(token))
        r = await ac.get("/menu", headers=_auth_header(token))
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) == 1

    async def test_get_menu_by_slot(self, ac):
        token = await _register_and_login(ac, emp_id="GS1", email="gs1@kpit.com", role="manager")
        await ac.post("/menu", json={
            "name": "Lunch Item", "category": "X", "price": 10, "time_slot": "lunch", "description": "D",
        }, headers=_auth_header(token))
        r = await ac.get("/menu?time_slot=lunch", headers=_auth_header(token))
        assert r.status_code == 200
        assert len(r.json()["items"]) == 1
        r2 = await ac.get("/menu?time_slot=breakfast", headers=_auth_header(token))
        assert len(r2.json()["items"]) == 0

    async def test_get_menu_item_by_id(self, ac):
        token = await _register_and_login(ac, emp_id="GI1", email="gi1@kpit.com", role="manager")
        create = await ac.post("/menu", json={
            "name": "Single", "category": "X", "price": 10, "time_slot": "snacks", "description": "D",
        }, headers=_auth_header(token))
        item_id = create.json()["_id"]
        # Menu has no GET by ID; use list and filter
        r = await ac.get("/menu", headers=_auth_header(token))
        assert r.status_code == 200
        found = [item for item in r.json()["items"] if item["_id"] == item_id]
        assert len(found) == 1
        assert found[0]["name"] == "Single"

    async def test_get_menu_item_404(self, ac):
        # No GET /menu/{id} route; returns 405
        r = await ac.get(f"/menu/{ObjectId()}")
        assert r.status_code in (404, 405)

    async def test_update_menu_item(self, ac):
        token = await _register_and_login(ac, emp_id="UP1", email="up1@kpit.com", role="manager")
        create = await ac.post("/menu", json={
            "name": "Old", "category": "X", "price": 10, "time_slot": "lunch", "description": "D",
        }, headers=_auth_header(token))
        item_id = create.json()["_id"]
        r = await ac.put(f"/menu/{item_id}", json={
            "name": "NEW", "category": "Y", "price": 99, "time_slot": "lunch", "description": "UPDATED",
        }, headers=_auth_header(token))
        assert r.status_code == 200
        assert r.json()["name"] == "NEW"
        assert r.json()["price"] == 99.0

    async def test_delete_menu_item(self, ac):
        token = await _register_and_login(ac, emp_id="DL1", email="dl1@kpit.com", role="manager")
        create = await ac.post("/menu", json={
            "name": "DeleteMe", "category": "X", "price": 10, "time_slot": "snacks", "description": "D",
        }, headers=_auth_header(token))
        item_id = create.json()["_id"]
        r = await ac.delete(f"/menu/{item_id}", headers=_auth_header(token))
        assert r.status_code == 200
        # Verify removed from listing
        r2 = await ac.get("/menu", headers=_auth_header(token))
        assert not any(item["_id"] == item_id for item in r2.json()["items"])


# ---------------------------------------------------------------------------
# ORDERS + STATUS + COMMENTS + DELETE TESTS
# ---------------------------------------------------------------------------

class TestOrders:
    async def _create_menu_item(self, ac, manager_token, name="Test Item", time_slot="breakfast"):
        r = await ac.post("/menu", json={
            "name": name, "category": "South Indian", "price": 50,
            "time_slot": time_slot, "description": "Delicious",
        }, headers=_auth_header(manager_token))
        assert r.status_code == 200, r.text
        return r.json()

    async def test_place_order(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OM1", email="om1@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "Idli")
        user_token = await _register_and_login(ac, emp_id="OU1", email="ou1@kpit.com")

        r = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 2}],
        }, headers=_auth_header(user_token))
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["status"] == "pending"
        assert order["total"] == 100.0
        assert len(order["order_code"]) == 6
        assert order["user_name"] == "Test"
        assert len(order.get("comments", [])) == 0

    async def test_my_orders(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OM2", email="om2@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "Dosa")
        user_token = await _register_and_login(ac, emp_id="OU2", email="ou2@kpit.com")

        await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        r = await ac.get("/orders/mine", headers=_auth_header(user_token))
        assert r.status_code == 200
        assert len(r.json()["orders"]) == 1

    async def test_pending_orders(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OM3", email="om3@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "Paratha")
        user_token = await _register_and_login(ac, emp_id="OU3", email="ou3@kpit.com")

        await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        r = await ac.get("/orders/pending", headers=_auth_header(mgr_token))
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert len(orders) >= 1
        for o in orders:
            assert o["status"] in ("pending", "preparing")

    async def test_active_orders(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OM4", email="om4@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "Upma")
        user_token = await _register_and_login(ac, emp_id="OU4", email="ou4@kpit.com")

        await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        r = await ac.get("/orders/active", headers=_auth_header(mgr_token))
        assert r.status_code == 200
        for o in r.json()["orders"]:
            assert o["status"] not in ("delivered", "cancelled")

    async def test_status_flow_all_steps(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OSF", email="osf@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "FlowTest")
        user_token = await _register_and_login(ac, emp_id="USF", email="usf@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        order_id = place.json()["_id"]
        assert place.json()["status"] == "pending"

        for status in ["preparing", "ready", "paid", "delivered"]:
            r = await ac.put(f"/orders/{order_id}/status", json={"status": status},
                             headers=_auth_header(mgr_token))
            assert r.status_code == 200, f"Failed at status {status}: {r.text}"
            assert r.json()["status"] == status

        # Verify auto-comments were added
        mine = await ac.get("/orders/mine", headers=_auth_header(user_token))
        order = mine.json()["orders"][0]
        comments = order.get("comments", [])
        assert len(comments) == 4  # one per status change

    async def test_status_update_as_user_denied(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OSD1", email="osd1@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "Denied")
        user_token = await _register_and_login(ac, emp_id="USD1", email="usd1@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        r = await ac.put(f"/orders/{place.json()['_id']}/status", json={"status": "preparing"},
                         headers=_auth_header(user_token))
        assert r.status_code == 403

    async def test_add_comment_by_manager(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OCM", email="ocm@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "CommentM")
        user_token = await _register_and_login(ac, emp_id="UCM", email="ucm@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        order_id = place.json()["_id"]

        r = await ac.post(f"/orders/{order_id}/comments", json={"message": "Taking longer, 5 min delay"},
                          headers=_auth_header(mgr_token))
        assert r.status_code == 200
        comment = r.json()["comment"]
        assert comment["message"] == "Taking longer, 5 min delay"
        assert comment["role"] == "manager"

    async def test_add_comment_by_user_on_own_order(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OCU", email="ocu@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "CommentU")
        user_token = await _register_and_login(ac, emp_id="UCU", email="uc1@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        order_id = place.json()["_id"]

        r = await ac.post(f"/orders/{order_id}/comments", json={"message": "Less spice please!"},
                          headers=_auth_header(user_token))
        assert r.status_code == 200
        assert r.json()["comment"]["role"] == "user"

    async def test_add_comment_by_user_on_others_order_denied(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="OCX", email="ocx@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "CommentX")
        user1_token = await _register_and_login(ac, emp_id="UO1", email="uo1@kpit.com")
        user2_token = await _register_and_login(ac, emp_id="UO2", email="uo2@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user1_token))
        r = await ac.post(f"/orders/{place.json()['_id']}/comments", json={"message": "Sneaky"},
                          headers=_auth_header(user2_token))
        assert r.status_code == 403

    async def test_delete_order_by_manager(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="ODL", email="odl@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "DeleteMe")
        user_token = await _register_and_login(ac, emp_id="UDL", email="udl@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        order_id = place.json()["_id"]

        r = await ac.delete(f"/orders/{order_id}", headers=_auth_header(mgr_token))
        assert r.status_code == 200
        assert r.json()["message"] == "Order deleted"

        r2 = await ac.get("/orders/mine", headers=_auth_header(user_token))
        assert len(r2.json()["orders"]) == 0

    async def test_delete_order_by_user_denied(self, ac):
        mgr_token = await _register_and_login(ac, emp_id="ODU", email="odu@kpit.com", role="manager")
        item = await self._create_menu_item(ac, mgr_token, "DeleteU")
        user_token = await _register_and_login(ac, emp_id="UDU", email="udu@kpit.com")

        place = await ac.post("/orders", json={
            "items": [{"menu_item_id": item["_id"], "name": item["name"], "price": item["price"], "quantity": 1}],
        }, headers=_auth_header(user_token))
        r = await ac.delete(f"/orders/{place.json()['_id']}", headers=_auth_header(user_token))
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# ADMIN TESTS
# ---------------------------------------------------------------------------

class TestAdmin:
    async def test_get_users_as_admin(self, ac):
        await _register(ac, emp_id="AU1", email="au1@kpit.com", name="User1")
        admin_token = await _register_and_login(ac, emp_id="ADM", email="adm@kpit.com", role="admin")
        r = await ac.get("/admin/users", headers=_auth_header(admin_token))
        assert r.status_code == 200
        users = r.json()["users"]
        assert len(users) >= 2

    async def test_get_users_as_manager_denied(self, ac):
        # Register manager directly via API then promote
        await _register(ac, emp_id="MGR", email="mgr@kpit.com", password="test123")
        await _promote_via_db("MGR", "manager")
        mgr_login = await ac.post("/auth/login", json={"emp_id": "MGR", "password": "test123"})
        assert mgr_login.status_code == 200, mgr_login.text
        mgr_token = mgr_login.json()["token"]
        r = await ac.get("/admin/users", headers=_auth_header(mgr_token))
        assert r.status_code == 403

    async def test_grant_manager(self, ac):
        await _register(ac, emp_id="AU2", email="au2@kpit.com", name="User2")
        admin_token = await _register_and_login(ac, emp_id="ADM2", email="adm2@kpit.com", role="admin")
        r = await ac.get("/admin/users", headers=_auth_header(admin_token))
        user_id = next(u["_id"] for u in r.json()["users"] if u["emp_id"] == "AU2")
        r2 = await ac.post("/admin/grant-access", json={"user_id": user_id},
                           headers=_auth_header(admin_token))
        assert r2.status_code == 200
        assert r2.json()["user"]["role"] == "manager"

    async def test_revoke_manager(self, ac):
        await _register(ac, emp_id="AU3", email="au3@kpit.com", name="User3")
        admin_token = await _register_and_login(ac, emp_id="ADM3", email="adm3@kpit.com", role="admin")
        r = await ac.get("/admin/users", headers=_auth_header(admin_token))
        user_id = next(u["_id"] for u in r.json()["users"] if u["emp_id"] == "AU3")
        await ac.post("/admin/grant-access", json={"user_id": user_id}, headers=_auth_header(admin_token))
        r2 = await ac.post("/admin/revoke-access", json={"user_id": user_id},
                           headers=_auth_header(admin_token))
        assert r2.status_code == 200
        assert r2.json()["user"]["role"] == "user"