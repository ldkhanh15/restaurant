"""
API Helper Functions for Chatbot
Handles all API calls to be_restaurant backend
"""

import os
import requests
import logging

logger = logging.getLogger(__name__)

BE_URL = os.getenv("BE_URL", "http://localhost:8000/api")


def fetch_menu(token=None):
    """Fetch menu/dishes from be_restaurant - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        resp = requests.get(f"{BE_URL}/dishes", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # Handle different response formats
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else data.get("dishes", [])
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching menu: {str(e)}")
        return []


def fetch_tables(token=None, available_only=True):
    """Fetch available tables from be_restaurant - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{BE_URL}/tables"
        if available_only:
            url = f"{BE_URL}/tables/status/available"

        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching tables: {str(e)}")
        return []


def fetch_reservations(user_id, token):
    """Fetch user's reservations from be_restaurant - Requires auth
    Uses GET /reservations/my-reservations (user-specific endpoint).
    This endpoint automatically filters by the authenticated user from the token.
    """
    try:
        if not token:
            logger.warning("fetch_reservations requires token")
            return []
        if not user_id or user_id == "anonymous":
            logger.warning("fetch_reservations requires user_id")
            return []

        headers = {"Authorization": f"Bearer {token}"}

        # Use the user-specific endpoint that automatically filters by token
        url = f"{BE_URL}/reservations/my-reservations"
        resp = requests.get(url, headers=headers, timeout=5)

        # If unauthorized (401), return empty list
        if resp.status_code == 401:
            logger.info(
                f"fetch_reservations: Unauthorized (invalid token). Return empty list."
            )
            return []

        resp.raise_for_status()
        data = resp.json()
        print(data)
        # Extract data from response
        if isinstance(data, dict):
            # Check if it's paginated response
            if (
                "data" in data
                and isinstance(data["data"], dict)
                and "data" in data["data"]
            ):
                return data["data"]["data"]
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.info(f"fetch_reservations: Unauthorized for user {user_id}")
            return []
        logger.error(f"Error fetching reservations: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Error fetching reservations: {str(e)}")
        return []


def fetch_orders(user_id, token, status=None):
    """Fetch user's orders from be_restaurant - Requires auth
    Uses GET /orders/my-orders (user-specific endpoint).
    This endpoint automatically filters by the authenticated user from the token.
    """
    try:
        if not token:
            logger.warning("fetch_orders requires token")
            return []
        if not user_id or user_id == "anonymous":
            logger.warning("fetch_orders requires user_id")
            return []

        headers = {"Authorization": f"Bearer {token}"}

        # Use the user-specific endpoint that automatically filters by token
        url = f"{BE_URL}/orders/my-orders"
        if status:
            url += f"?status={status}"

        resp = requests.get(url, headers=headers, timeout=5)

        # If unauthorized (401), return empty list
        if resp.status_code == 401:
            logger.info(
                f"fetch_orders: Unauthorized (invalid token). Return empty list."
            )
            return []

        resp.raise_for_status()
        data = resp.json()

        # Extract data from response
        if isinstance(data, dict):
            # Check if it's paginated response
            if (
                "data" in data
                and isinstance(data["data"], dict)
                and "data" in data["data"]
            ):
                return data["data"]["data"]
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.info(f"fetch_orders: Unauthorized for user {user_id}")
            return []
        logger.error(f"Error fetching orders: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        return []


def fetch_vouchers(token=None, active_only=True):
    """Fetch vouchers from be_restaurant - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{BE_URL}/vouchers/active"
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching vouchers: {str(e)}")
        return []


def fetch_events(token=None, active_only=True):
    """Fetch events from be_restaurant - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{BE_URL}/events"
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        return []


def create_reservation(data, token):
    """Create a new reservation - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to create reservation")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(
            f"{BE_URL}/reservations", json=data, headers=headers, timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error creating reservation: {str(e)}")
        raise


def create_order(data, token):
    """Create a new order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to create order")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{BE_URL}/orders", json=data, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise


def get_reservation_by_id(reservation_id, token):
    """Get reservation by ID - Requires auth"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(
            f"{BE_URL}/reservations/{reservation_id}",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching reservation: {str(e)}")
        return None


def get_order_by_id(order_id, token):
    """Get order by ID - Requires auth"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BE_URL}/orders/{order_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching order: {str(e)}")
        return None


def cancel_reservation(reservation_id, token):
    """Cancel a reservation - Requires auth (admin/employee only)"""
    try:
        if not token:
            raise ValueError("Token is required to cancel reservation")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(
            f"{BE_URL}/reservations/{reservation_id}/cancel",
            json={"reason": "Hủy qua chatbot"},
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error canceling reservation: {str(e)}")
        raise


def create_review(data, token):
    """Create a review - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to create review")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{BE_URL}/reviews", json=data, headers=headers, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        raise


def create_complaint(data, token):
    """Create a complaint/feedback - Public endpoint (no auth required)"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(
            f"{BE_URL}/complaints", json=data, headers=headers, timeout=5
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error creating complaint: {str(e)}")
        raise


def get_dish_by_id(dish_id, token=None):
    """Get dish by ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/dishes/{dish_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching dish: {str(e)}")
        return None


def get_table_by_id(table_id, token=None):
    """Get table by ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/tables/{table_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching table: {str(e)}")
        return None


def checkin_reservation(reservation_id, token):
    """Check-in a reservation - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to check-in reservation")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(
            f"{BE_URL}/reservations/{reservation_id}/checkin",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error checking in reservation: {str(e)}")
        raise


def add_item_to_order(order_id, data, token):
    """Add item to order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to add item to order")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(
            f"{BE_URL}/orders/{order_id}/items",
            json=data,
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error adding item to order: {str(e)}")
        raise


def update_reservation(reservation_id, data, token):
    """Update reservation - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to update reservation")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.patch(
            f"{BE_URL}/reservations/{reservation_id}",
            json=data,
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error updating reservation: {str(e)}")
        raise


def update_order(order_id, data, token):
    """Update order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to update order")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.put(
            f"{BE_URL}/orders/{order_id}",
            json=data,
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error updating order: {str(e)}")
        raise


def get_order_by_table(table_id, token, status=None):
    """Get order by table - Requires auth"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        url = f"{BE_URL}/orders/table/{table_id}"
        if status:
            url += f"?status={status}"
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching order by table: {str(e)}")
        return None


def update_item_quantity(item_id, quantity, token):
    """Update item quantity in order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to update item quantity")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.patch(
            f"{BE_URL}/orders/items/{item_id}/quantity",
            json={"quantity": quantity},
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error updating item quantity: {str(e)}")
        raise


def delete_order_item(item_id, token):
    """Delete item from order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to delete item")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(
            f"{BE_URL}/orders/items/{item_id}",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        raise


def apply_voucher_to_order(order_id, voucher_code, token):
    """Apply voucher to order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to apply voucher")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(
            f"{BE_URL}/orders/{order_id}/voucher",
            json={"code": voucher_code},
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error applying voucher: {str(e)}")
        raise


def remove_voucher_from_order(order_id, token):
    """Remove voucher from order - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to remove voucher")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(
            f"{BE_URL}/orders/{order_id}/voucher",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error removing voucher: {str(e)}")
        raise


def delete_reservation(reservation_id, token):
    """Delete reservation - Requires auth"""
    try:
        if not token:
            raise ValueError("Token is required to delete reservation")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(
            f"{BE_URL}/reservations/{reservation_id}",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error deleting reservation: {str(e)}")
        raise


def get_review_by_id(review_id, token=None):
    """Get review by ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/reviews/{review_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching review: {str(e)}")
        return None


def fetch_reviews(token=None):
    """Fetch all reviews - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/reviews", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching reviews: {str(e)}")
        return []


def update_review(review_id, data, token):
    """Update review - Requires auth (customer only)"""
    try:
        if not token:
            raise ValueError("Token is required to update review")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.put(
            f"{BE_URL}/reviews/{review_id}",
            json=data,
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error updating review: {str(e)}")
        raise


def delete_review(review_id, token):
    """Delete review - Requires auth (admin or customer)"""
    try:
        if not token:
            raise ValueError("Token is required to delete review")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(
            f"{BE_URL}/reviews/{review_id}",
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error deleting review: {str(e)}")
        raise


def fetch_categories(token=None):
    """Fetch all categories - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/categories", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return []


def get_category_by_id(category_id, token=None):
    """Get category by ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(
            f"{BE_URL}/categories/{category_id}", headers=headers, timeout=5
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching category: {str(e)}")
        return None


def get_dishes_by_category(category_id, token=None):
    """Get dishes by category ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(
            f"{BE_URL}/dishes/category/{category_id}", headers=headers, timeout=5
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching dishes by category: {str(e)}")
        return []


def get_event_by_id(event_id, token=None):
    """Get event by ID - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/events/{event_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching event: {str(e)}")
        return None


def get_voucher_by_id(voucher_id, token):
    """Get voucher by ID - Requires auth (admin/employee only)"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(
            f"{BE_URL}/vouchers/{voucher_id}", headers=headers, timeout=5
        )
        # If unauthorized (403) or forbidden, return None
        if resp.status_code == 403 or resp.status_code == 401:
            logger.info(f"get_voucher_by_id: Access denied (customer role).")
            return None
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code in [403, 401]:
            logger.info(f"get_voucher_by_id: Access denied for voucher {voucher_id}")
            return None
        logger.error(f"Error fetching voucher: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error fetching voucher: {str(e)}")
        return None


def get_complaint_by_id(complaint_id, token):
    """Get complaint by ID - Requires auth (admin/employee only)"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(
            f"{BE_URL}/complaints/{complaint_id}", headers=headers, timeout=5
        )
        # If unauthorized (403) or forbidden, return None
        if resp.status_code == 403 or resp.status_code == 401:
            logger.info(f"get_complaint_by_id: Access denied (customer role).")
            return None
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code in [403, 401]:
            logger.info(
                f"get_complaint_by_id: Access denied for complaint {complaint_id}"
            )
            return None
        logger.error(f"Error fetching complaint: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error fetching complaint: {str(e)}")
        return None


def update_complaint(complaint_id, data, token):
    """Update complaint - Public endpoint (no auth required)"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.put(
            f"{BE_URL}/complaints/{complaint_id}",
            json=data,
            headers=headers,
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error updating complaint: {str(e)}")
        raise


def fetch_complaints(token=None):
    """Fetch all complaints - Public endpoint"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        resp = requests.get(f"{BE_URL}/complaints", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            return data.get("data", []) if "data" in data else []
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.error(f"Error fetching complaints: {str(e)}")
        return []


def get_user_by_id(user_id, token):
    """Get user by ID - Requires auth"""
    try:
        if not token:
            return None
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BE_URL}/users/{user_id}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        return None
