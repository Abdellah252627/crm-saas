import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Stage, type ContactType } from "@prisma/client";
import {
  buildDashboardStats,
  type ContactWithClientName,
  type StageAndCreatedAt,
} from "../src/services/dashboard.service.js";

const NOW = new Date("2026-10-15T12:00:00.000Z");
const THIS_MONTH = new Date("2026-10-02T09:00:00.000Z");
const LAST_MONTH = new Date("2026-09-28T09:00:00.000Z");

function client(stage: Stage, createdAt: Date = THIS_MONTH): StageAndCreatedAt {
  return { stage, createdAt };
}

function contact(overrides: Partial<ContactWithClientName> = {}): ContactWithClientName {
  return {
    id: "contact-1",
    type: "CALL" as ContactType,
    note: null,
    date: new Date("2026-10-10T08:00:00.000Z"),
    createdAt: new Date("2026-10-10T08:00:00.000Z"),
    clientId: "client-1",
    client: { name: "Acme" },
    ...overrides,
  };
}

describe("buildDashboardStats", () => {
  it("returns zeroed values for a user with no data instead of throwing", () => {
    const stats = buildDashboardStats([], [], NOW);

    assert.equal(stats.totalClients, 0);
    assert.deepEqual(stats.byStage, { LEAD: 0, CONTACTED: 0, PROPOSAL: 0, WON: 0, LOST: 0 });
    assert.equal(stats.wonRate, 0);
    assert.deepEqual(stats.recentContacts, []);
    assert.equal(stats.newClientsThisMonth, 0);
  });

  it("always exposes all five stage keys", () => {
    const stats = buildDashboardStats([client(Stage.WON)], [], NOW);
    assert.deepEqual(Object.keys(stats.byStage).sort(), [
      "CONTACTED",
      "LEAD",
      "LOST",
      "PROPOSAL",
      "WON",
    ]);
  });

  it("tallies clients per stage and sums to totalClients", () => {
    const stats = buildDashboardStats(
      [
        client(Stage.LEAD),
        client(Stage.LEAD),
        client(Stage.CONTACTED),
        client(Stage.PROPOSAL),
        client(Stage.WON),
        client(Stage.LOST, LAST_MONTH),
      ],
      [],
      NOW,
    );

    assert.equal(stats.totalClients, 6);
    assert.deepEqual(stats.byStage, { LEAD: 2, CONTACTED: 1, PROPOSAL: 1, WON: 1, LOST: 1 });
    const sum = Object.values(stats.byStage).reduce((a, n) => a + n, 0);
    assert.equal(sum, stats.totalClients);
  });

  it("computes wonRate in memory as a percentage of totalClients", () => {
    const stats = buildDashboardStats(
      [client(Stage.WON), client(Stage.WON), client(Stage.LEAD), client(Stage.LOST)],
      [],
      NOW,
    );
    assert.equal(stats.wonRate, 50);
  });

  it("rounds wonRate to two decimals rather than truncating", () => {
    const stats = buildDashboardStats(
      [client(Stage.WON), client(Stage.LEAD), client(Stage.CONTACTED)],
      [],
      NOW,
    );
    assert.equal(stats.wonRate, 33.33);
  });

  it("reports wonRate 0 when there are clients but none won", () => {
    const stats = buildDashboardStats([client(Stage.LEAD), client(Stage.LOST)], [], NOW);
    assert.equal(stats.wonRate, 0);
    assert.notEqual(stats.wonRate, NaN);
  });

  it("counts only clients created within the current UTC month", () => {
    const stats = buildDashboardStats(
      [
        client(Stage.LEAD, new Date("2026-10-01T00:00:00.000Z")),
        client(Stage.LEAD, THIS_MONTH),
        client(Stage.WON, LAST_MONTH),
        client(Stage.WON, new Date("2026-10-14T23:59:59.999Z")),
      ],
      [],
      NOW,
    );

    assert.equal(stats.totalClients, 4);
    assert.equal(stats.newClientsThisMonth, 3);
  });

  it("treats the first instant of the month as inside the month", () => {
    const stats = buildDashboardStats(
      [client(Stage.LEAD, new Date("2026-10-01T00:00:00.000Z"))],
      [],
      NOW,
    );
    assert.equal(stats.newClientsThisMonth, 1);
  });

  it("projects the associated client name onto each recent contact", () => {
    const stats = buildDashboardStats(
      [client(Stage.LEAD)],
      [contact({ id: "c1", client: { name: "Acme" } }), contact({ id: "c2", client: { name: "Globex" } })],
      NOW,
    );

    assert.deepEqual(
      stats.recentContacts.map((c) => c.clientName),
      ["Acme", "Globex"],
    );
  });

  it("preserves contact fields and null notes", () => {
    const stats = buildDashboardStats(
      [client(Stage.LEAD)],
      [contact({ note: null, clientId: "client-42" })],
      NOW,
    );

    assert.equal(stats.recentContacts.length, 1);
    assert.equal(stats.recentContacts[0]?.note, null);
    assert.equal(stats.recentContacts[0]?.clientId, "client-42");
    assert.equal(stats.recentContacts[0]?.clientName, "Acme");
  });
});