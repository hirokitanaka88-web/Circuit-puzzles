"""Backend coverage for the 'Checking still correct for all three designs' criterion.

Validates GET /api/puzzles/new for each of the three topologies: structurally correct
response (given/given_cells/solution/steps) and internally consistent Ohm's-law math
(E = I * R per element, and P = E * I), which is exactly what the frontend relies on
when it marks the Check Answers table "15 / 15 correct".
"""

import httpx
import pytest

from .conftest import api_url

TOPOLOGIES = ["series_parallel", "parallel_branch", "series_parallel_series"]


@pytest.mark.parametrize("topology", TOPOLOGIES)
def test_puzzle_new_returns_consistent_solution(client: httpx.Client, topology: str):
    resp = client.get(api_url("/puzzles/new"), params={"topology": topology})
    assert resp.status_code == 200, f"GET /api/puzzles/new?topology={topology} -> {resp.status_code}: {resp.text[:300]}"
    body = resp.json()

    assert body["topology"] == topology
    assert isinstance(body["given_cells"], list) and len(body["given_cells"]) == 5
    assert isinstance(body["solution"], list) and len(body["solution"]) == 5
    elements = {row["element"] for row in body["solution"]}
    assert elements == {"R1", "R2", "R3", "R4", "Total"}

    # Every row must satisfy Ohm's law and the power law to ~1% (the same tolerance
    # the frontend uses for Check Answers), proving the generated puzzle is self-consistent.
    for row in body["solution"]:
        e, i, r, w = row["E"], row["I"], row["R"], row["W"]
        assert abs(e - i * r) <= max(0.02, 0.01 * abs(e)), f"{topology}/{row['element']}: E != I*R ({e} vs {i*r})"
        assert abs(w - e * i) <= max(0.02, 0.01 * abs(w)), f"{topology}/{row['element']}: P != E*I ({w} vs {e * i})"

    # given_cells reference quantities that are actually present (non-null) in `given`.
    for cell in body["given_cells"]:
        quantity, element = cell.split("-", 1)
        if element == "Total":
            assert body["given"].get("E") is not None or quantity == "E"
        else:
            assert body["given"].get(element) is not None, f"{cell} marked given but {element} missing from given{{}}"


def test_puzzle_new_rejects_unknown_topology(client: httpx.Client):
    resp = client.get(api_url("/puzzles/new"), params={"topology": "tscheck-not-a-topology"})
    assert resp.status_code == 422, f"expected 422 for unknown topology, got {resp.status_code}: {resp.text[:300]}"
