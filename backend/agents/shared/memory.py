"""
shared/memory.py
DB-backed memory using the existing agent_sessions table.
In-process cache for speed within a session.
"""

from datetime import datetime
from collections import defaultdict
from sqlalchemy import text

_cache: dict = defaultdict(list)


def save_turn(db, user_id: int, agent_name: str, query: str, response: str) -> None:
    session_id = str(user_id)
    _cache[session_id].append({"role": "user",      "content": query})
    _cache[session_id].append({"role": "assistant", "content": response})
    _cache[session_id] = _cache[session_id][-20:]

    try:
        db.execute(
            text("""
                INSERT INTO agent_sessions
                    (user_id, agent_name, query, response, timestamp)
                VALUES
                    (:user_id, :agent_name, :query, :response, :timestamp)
            """),
            {
                "user_id":    user_id,
                "agent_name": agent_name,
                "query":      query,
                "response":   str(response)[:4000],
                "timestamp":  datetime.utcnow(),
            }
        )
        db.commit()
    except Exception as e:
        print(f"[memory] DB write failed: {e}")


def load_history(db, user_id: int, limit: int = 6) -> list:
    session_id = str(user_id)
    if _cache[session_id]:
        return _cache[session_id][-limit * 2:]

    try:
        rows = db.execute(
            text("""
                SELECT query, response FROM (
                    SELECT query, response, timestamp
                    FROM agent_sessions
                    WHERE user_id = :user_id
                    ORDER BY timestamp DESC
                    OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY
                ) AS recent
                ORDER BY timestamp ASC
            """),
            {"user_id": user_id, "limit": limit}
        ).fetchall()

        messages = []
        for row in reversed(rows):
            messages.append({"role": "user",      "content": row[0]})
            messages.append({"role": "assistant",  "content": row[1]})

        _cache[session_id] = messages
        return messages

    except Exception as e:
        print(f"[memory] DB read failed: {e}")
        return []


def clear_history(db, user_id: int) -> None:
    _cache[str(user_id)] = []
    try:
        db.execute(
            text("DELETE FROM agent_sessions WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        db.commit()
    except Exception as e:
        print(f"[memory] DB clear failed: {e}")