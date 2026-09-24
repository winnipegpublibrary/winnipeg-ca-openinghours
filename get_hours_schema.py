#!/usr/bin/env python3
"""
get_hours_schema.py

Pulls hours from the LibCal Hours API for each WPL branch and writes a
schema.org OpeningHoursSpecification JSON file per branch, so the Drupal
hours-schema widget can fetch it at runtime and inject it as JSON-LD.

Run by the "Update library hours schema" GitHub Actions workflow.

Uses the same read-only LibCal API credential pair already embedded in
the public hours widget JS (no server-side secret to protect -- it's
already visible client-side, same as it is here).
"""

import os
import json
import datetime
from collections import Counter
import requests

LIBCAL_DOMAIN = "wpl.libcal.com"  # confirmed from hours_grid.js widget source
OUTPUT_DIR = "hours-schema"

# Read-only, Hours-scoped LibCal API client (created for this project;
# safe to keep here rather than in GitHub secrets, same as the client
# ids already public in the room-finder and hours widgets).
LIBCAL_CLIENT_ID = "345"
LIBCAL_CLIENT_SECRET = "c8e680b7202fc0e56d504f7b0be61e11"

# Same lid list used in winnipeg_ca_library_hours_translation.js (unique
# lids only -- the EN/FR slug duplication lives in that file, not here).
# Keep both lists in sync if a branch is renamed, added, or removed.
BRANCH_LIDS = [
    1262, 7343, 1264, 1265, 1266, 1280, 1268, 1269, 1270, 1271,
    1272, 1274, 1275, 1276, 1277, 1278, 1279, 1281, 1282, 1283,
]


def get_access_token():
    """
    Confirmed working against the live API (2026-09-24) using client 345,
    read-only, Hours-scoped -- same request shape as the room-finder and
    holidays widgets, just a different client id.
    """
    resp = requests.post(
        f"https://{LIBCAL_DOMAIN}/1.1/oauth/token",
        data={
            "client_id": LIBCAL_CLIENT_ID,
            "client_secret": LIBCAL_CLIENT_SECRET,
            "grant_type": "client_credentials",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_hours(lid, token, days_ahead=28):
    """
    Confirmed against the live API (2026-09-24): returns a list containing
    one location object with a flat "dates" dict keyed by ISO date, e.g.
        {"2026-09-24": {"status": "open",
                         "hours": [{"from": "10:00AM", "to": "8:00PM"}]},
         "2026-09-27": {"status": "closed"},
         "2026-09-30": {"status": "closed", "note": "...holiday..."}}
    Closed days have no "hours" key. Some closed days carry a "note" --
    that marks a one-off exception (e.g. a statutory holiday), not the
    normal weekly pattern, and build_schema() below excludes those when
    deciding what's typical for that weekday.

    Pulling a wider window (default 28 days, ~4 occurrences of each
    weekday) rather than just the next 7 matters here: a single week can
    land on a holiday closure, which would otherwise get baked into the
    schema as if that weekday is always closed.
    """
    today = datetime.date.today()
    resp = requests.get(
        f"https://{LIBCAL_DOMAIN}/1.1/hours/{lid}",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "from": today.isoformat(),
            "to": (today + datetime.timedelta(days=days_ahead)).isoformat(),
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def to_24h(text):
    """Convert LibCal's '8am' / '5:30pm' style times to 24h 'HH:MM'."""
    text = text.strip().lower().replace(" ", "")
    is_pm = text.endswith("pm")
    text = text[:-2]
    if ":" in text:
        hour_str, minute = text.split(":")
    else:
        hour_str, minute = text, "00"
    hour = int(hour_str)
    if is_pm and hour != 12:
        hour += 12
    if not is_pm and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute}"


def normalize_dates(dates_field):
    """
    LibCal's "dates" field isn't consistent across every location: normally
    a flat dict keyed by ISO date, but a branch with no scheduled hours to
    report (e.g. closed indefinitely for repairs, as seen with lid 1270)
    comes back as an empty list instead. The docs' own example also shows
    a third shape -- a list of single-key dicts. Handle all three rather
    than assume one.
    """
    if isinstance(dates_field, dict):
        return dates_field
    merged = {}
    for item in dates_field or []:
        if isinstance(item, dict):
            merged.update(item)
    return merged


def build_schema(location_data):
    """
    Turn a multi-week window of day-by-day hours into one recurring
    OpeningHoursSpecification entry per weekday.

    Days carrying a "note" (e.g. a statutory holiday closure) are treated
    as exceptions and excluded from the "what's typical" calculation --
    otherwise a single holiday in the fetch window would get baked in as
    if that weekday is always closed. For each remaining weekday, the
    most common (open/closed, hours) pattern across however many
    occurrences were fetched wins.

    A branch with no dates at all (e.g. indefinitely closed) simply
    produces an empty spec -- not an error.
    """
    by_weekday = {}  # day name -> list of hashable hours-block tuples

    for date_str, day_info in normalize_dates(location_data.get("dates", {})).items():
        if day_info.get("note"):
            continue  # one-off exception, not representative of a normal week

        day_name = datetime.date.fromisoformat(date_str).strftime("%A")
        by_weekday.setdefault(day_name, [])

        if day_info.get("status") != "open":
            by_weekday[day_name].append(())  # closed that occurrence
            continue

        blocks = tuple((b["from"], b["to"]) for b in day_info.get("hours", []))
        by_weekday[day_name].append(blocks)

    spec = []
    for day_name, occurrences in by_weekday.items():
        most_common_blocks, _ = Counter(occurrences).most_common(1)[0]
        for from_time, to_time in most_common_blocks:
            spec.append({
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": f"https://schema.org/{day_name}",
                "opens": to_24h(from_time),
                "closes": to_24h(to_time),
            })
    return spec


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    token = get_access_token()

    for lid in BRANCH_LIDS:
        try:
            data = fetch_hours(lid, token)
            location = data[0] if isinstance(data, list) else data
            spec = build_schema(location)

            out_path = os.path.join(OUTPUT_DIR, f"{lid}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(spec, f, ensure_ascii=False, indent=2)
            print(f"Wrote {out_path} ({len(spec)} entries)")
        except Exception as exc:
            # Don't let one branch's oddity (indefinitely closed, unexpected
            # response shape, a transient network blip) take down the run
            # for the other 20 branches -- log it and keep going.
            print(f"FAILED lid {lid}: {exc}")


if __name__ == "__main__":
    main()
