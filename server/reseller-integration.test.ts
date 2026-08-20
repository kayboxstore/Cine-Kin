/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Integration harness: a small stateful in-memory fake for getDb(). Only the
// drizzle query *helpers* (eq/and/gte/sql/desc) are mocked so the fake can
// interpret conditions; the schema (real mysqlTable columns) and the crypto
// (real scrypt) are untouched, so these tests exercise the actual resolver
// logic — credit deduction, hashing, per-reseller filtering, password change.
// ---------------------------------------------------------------------------

const shared = vi.hoisted(() => {
  // A real HS256 secret so reseller.login can sign a session on success.
  process.env.APP_SECRET = "test-app-secret-0123456789-abcdefghij";
  return {
    store: {
      resellers: [] as any[],
      activations: [] as any[],
      appClients: [] as any[],
      playlists: [] as any[],
      creditLedger: [] as any[],
    },
    seq: { v: 0 },
  };
});

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ __c: "eq", col, val }),
    inArray: (col: unknown, vals: unknown[]) => ({ __c: "inArray", col, vals }),
    isNull: (col: unknown) => ({ __c: "isNull", col }),
    gte: (col: unknown, val: unknown) => ({ __c: "gte", col, val }),
    and: (...conds: unknown[]) => ({ __c: "and", conds }),
    desc: (col: unknown) => ({ __c: "desc", col }),
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      __c: "sql",
      values,
      expression: strings.join("?"),
    }),
  };
});

vi.mock("./queries/connection", async () => {
  const { getTableName } = await import("drizzle-orm");
  const store = shared.store;
  const seq = shared.seq;

  const arrFor = (t: any): any[] => {
    switch (getTableName(t)) {
      case "resellers":
        return store.resellers;
      case "activations":
        return store.activations;
      case "app_clients":
        return store.appClients;
      case "playlists":
        return store.playlists;
      case "reseller_credit_ledger":
        return store.creditLedger;
      default:
        throw new Error("unknown table: " + getTableName(t));
    }
  };
  const keyOf = (t: any, col: unknown): string =>
    Object.keys(t).find(k => t[k] === col) as string;
  const matches = (t: any, row: any, cond: any): boolean => {
    if (!cond) return true;
    switch (cond.__c) {
      case "and":
        return cond.conds.every((c: any) => matches(t, row, c));
      case "eq":
        return row[keyOf(t, cond.col)] === cond.val;
      case "inArray":
        return cond.vals.includes(row[keyOf(t, cond.col)]);
      case "isNull":
        return row[keyOf(t, cond.col)] == null;
      case "gte":
        return row[keyOf(t, cond.col)] >= cond.val;
      default:
        return true;
    }
  };
  const applySet = (t: any, row: any, setObj: any) => {
    for (const [k, v] of Object.entries<any>(setObj)) {
      if (v && typeof v === "object" && v.__c === "sql") {
        const [col, amount] = v.values;
        const current = row[keyOf(t, col)];
        row[keyOf(t, col)] = v.expression.includes("+")
          ? current + amount
          : current - amount;
      } else {
        row[k] = v;
      }
    }
  };

  const makeSelect = (projection?: any) => {
    const st: any = { table: null, conds: [], limit: null };
    const b: any = {
      from(t: any) {
        st.table = t;
        return b;
      },
      where(c: any) {
        st.conds.push(c);
        return b;
      },
      leftJoin() {
        return b;
      },
      orderBy() {
        return b;
      },
      limit(n: number) {
        st.limit = n;
        return b;
      },
      for() {
        return b;
      },
      then(res: any, rej: any) {
        try {
          let rows = arrFor(st.table).filter(r =>
            st.conds.every((c: any) => matches(st.table, r, c))
          );
          if (st.limit != null) rows = rows.slice(0, st.limit);
          const out = rows.map(r => {
            if (!projection) return { ...r };
            const o: any = {};
            for (const [alias, col] of Object.entries(projection))
              o[alias] = r[keyOf(st.table, col)];
            return o;
          });
          return Promise.resolve(out).then(res, rej);
        } catch (e) {
          return Promise.reject(e).then(res, rej);
        }
      },
    };
    return b;
  };

  const makeUpdate = (t: any) => {
    const st: any = { table: t, set: null, conds: [] };
    const b: any = {
      set(o: any) {
        st.set = o;
        return b;
      },
      where(c: any) {
        st.conds.push(c);
        return b;
      },
      then(res: any, rej: any) {
        let affected = 0;
        for (const row of arrFor(st.table)) {
          if (st.conds.every((c: any) => matches(st.table, row, c))) {
            applySet(st.table, row, st.set);
            affected++;
          }
        }
        return Promise.resolve([{ affectedRows: affected }]).then(res, rej);
      },
    };
    return b;
  };

  const makeInsert = (t: any) => {
    const st: any = { table: t, values: null };
    const doInsert = () => {
      const id = ++seq.v;
      arrFor(st.table).push({ id, ...st.values });
      return [{ id }];
    };
    const b: any = {
      values(v: any) {
        st.values = v;
        return b;
      },
      $returningId() {
        return Promise.resolve(doInsert());
      },
      then(res: any, rej: any) {
        return Promise.resolve(doInsert()).then(res, rej);
      },
    };
    return b;
  };

  const api: any = {
    select: (projection?: any) => makeSelect(projection),
    update: (t: any) => makeUpdate(t),
    insert: (t: any) => makeInsert(t),
    async transaction(cb: any) {
      const snap = structuredClone(store);
      try {
        return await cb(api);
      } catch (e) {
        store.resellers = snap.resellers;
        store.activations = snap.activations;
        store.appClients = snap.appClients;
        store.playlists = snap.playlists;
        store.creditLedger = snap.creditLedger;
        throw e;
      }
    },
  };

  return { getDb: () => api };
});

// Real modules (schema + crypto are NOT mocked).
import { appRouter } from "./router";
import { createCallerFactory } from "./middleware";
import { hashSecret, verifySecret } from "./lib/crypto";
import { normalizeClaimCode } from "./lib/app-license";
import type { TrpcContext } from "./context";
import type { AppClient, User, Reseller } from "@db/schema";

const createCaller = createCallerFactory(appRouter);

function makeCtx(over?: Partial<TrpcContext>): TrpcContext {
  return {
    req: new Request("http://localhost/api/trpc"),
    resHeaders: new Headers(),
    ...over,
  };
}

const adminUser: User = {
  id: 1,
  unionId: "union-admin",
  name: "Admin",
  email: null,
  avatar: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

function makeReseller(over: Partial<Reseller> = {}): Reseller {
  return {
    id: 1,
    name: "Reseller",
    contact: null,
    username: "reseller",
    passwordHash: hashSecret("password"),
    credits: 0,
    createdAt: new Date(),
    ...over,
  };
}

function makeAppClient(over: Partial<AppClient> = {}): AppClient {
  return {
    id: 100,
    mac: "aa:bb:cc:dd:ee:ff",
    pinHash: hashSecret("123456"),
    claimCodeHash: null,
    claimCodeExpiresAt: null,
    claimedAt: new Date(),
    name: "Salon",
    email: "salon@example.com",
    licenseType: "12_months",
    activatedByType: "reseller",
    activatedByResellerId: 1,
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1_000_000),
    parentalControlPinHash: null,
    createdAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  shared.store.resellers = [];
  shared.store.activations = [];
  shared.store.appClients = [];
  shared.store.playlists = [];
  shared.store.creditLedger = [];
  shared.seq.v = 0;
});

// 1. Credit guard ----------------------------------------------------------

describe("reseller.activate — credit guard", () => {
  it("refuses when the cost exceeds the balance and leaves the balance untouched", async () => {
    const reseller = makeReseller({ id: 1, credits: 1 }); // 1 credit
    shared.store.resellers.push(reseller);
    const caller = createCaller(makeCtx({ reseller }));

    // 'unlimited' costs 2 credits > balance of 1.
    await expect(
      caller.reseller.activate({
        mac: "aa:bb:cc:dd:ee:ff",
        licenseType: "unlimited",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // Nothing was deducted and no side effects were committed (rolled back).
    expect(shared.store.resellers[0].credits).toBe(1);
    expect(shared.store.appClients).toHaveLength(0);
    expect(shared.store.activations).toHaveLength(0);
    expect(shared.store.creditLedger).toHaveLength(0);
  });

  it("never drives the balance negative across repeated spends", async () => {
    const reseller = makeReseller({ id: 1, credits: 1 });
    shared.store.resellers.push(reseller);
    const caller = createCaller(makeCtx({ reseller }));

    // First 12-month activation succeeds and drains the single credit.
    await expect(
      caller.reseller.activate({
        mac: "aa:bb:cc:dd:ee:01",
        licenseType: "12_months",
      })
    ).resolves.toMatchObject({ remainingCredits: 0 });

    // Second is refused — the atomic guard prevents going negative.
    await expect(
      caller.reseller.activate({
        mac: "aa:bb:cc:dd:ee:02",
        licenseType: "12_months",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(shared.store.resellers[0].credits).toBe(0);
    expect(shared.store.creditLedger).toHaveLength(1);
    expect(shared.store.creditLedger[0]).toMatchObject({
      resellerId: 1,
      delta: -1,
      balanceAfter: 0,
      entryType: "activation",
    });
  });
});

describe("reseller.activate — renewal integrity", () => {
  it("extends from the existing expiry and records the debit in the same ledger", async () => {
    const reseller = makeReseller({ id: 1, credits: 3 });
    const existingExpiry = new Date("2027-01-15T12:00:00Z");
    shared.store.resellers.push(reseller);
    shared.store.appClients.push(
      makeAppClient({
        id: 10,
        mac: "aa:bb:cc:dd:ee:10",
        expiresAt: existingExpiry,
      })
    );

    const result = await createCaller(makeCtx({ reseller })).reseller.activate({
      mac: "AA-BB-CC-DD-EE-10",
      licenseType: "12_months",
    });

    expect(result.action).toBe("renewed");
    expect(result.remainingCredits).toBe(2);
    expect(result.expiresAt).toEqual(new Date("2028-01-15T12:00:00Z"));
    expect(shared.store.appClients[0].expiresAt).toEqual(
      new Date("2028-01-15T12:00:00Z")
    );
    expect(shared.store.creditLedger[0]).toMatchObject({
      delta: -1,
      balanceAfter: 2,
      entryType: "activation",
      activationId: expect.any(Number),
    });
  });

  it("does not charge an already-unlimited device", async () => {
    const reseller = makeReseller({ id: 1, credits: 5 });
    shared.store.resellers.push(reseller);
    shared.store.appClients.push(
      makeAppClient({
        mac: "aa:bb:cc:dd:ee:11",
        licenseType: "unlimited",
        expiresAt: null,
      })
    );

    await expect(
      createCaller(makeCtx({ reseller })).reseller.activate({
        mac: "aa:bb:cc:dd:ee:11",
        licenseType: "unlimited",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(shared.store.resellers[0].credits).toBe(5);
    expect(shared.store.creditLedger).toHaveLength(0);
  });

  it("prevents one reseller from taking over another reseller's licence", async () => {
    const reseller = makeReseller({ id: 20, username: "outsider", credits: 5 });
    shared.store.resellers.push(reseller);
    shared.store.appClients.push(
      makeAppClient({
        id: 12,
        mac: "aa:bb:cc:dd:ee:12",
        activatedByResellerId: 10,
        expiresAt: new Date("2026-01-01T00:00:00Z"),
      })
    );

    await expect(
      createCaller(makeCtx({ reseller })).reseller.activate({
        mac: "aa:bb:cc:dd:ee:12",
        licenseType: "12_months",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(shared.store.resellers[0].credits).toBe(5);
    expect(shared.store.appClients[0].activatedByResellerId).toBe(10);
    expect(shared.store.creditLedger).toHaveLength(0);
  });
});

describe("device claim — proof of possession", () => {
  it("stores only a claim-code hash and consumes the code atomically", async () => {
    const reseller = makeReseller({ id: 1, credits: 2 });
    shared.store.resellers.push(reseller);
    const caller = createCaller(makeCtx({ reseller }));

    const activation = await caller.reseller.activate({
      mac: "aa:bb:cc:dd:ee:22",
      licenseType: "12_months",
    });
    expect(activation.claimCode).toMatch(
      /^CK-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/
    );

    const stored = shared.store.appClients[0];
    expect(stored.pinHash).toBeUndefined();
    expect(stored.claimCodeHash).not.toBe(activation.claimCode);
    expect(
      verifySecret(
        normalizeClaimCode(activation.claimCode!),
        stored.claimCodeHash
      )
    ).toBe(true);

    const anonymous = createCaller(makeCtx());
    await expect(
      anonymous.app.registerDevice({
        mac: "aa:bb:cc:dd:ee:22",
        pin: "654321",
        claimCode: "CK-AAAAA-AAAAA",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(stored.pinHash).toBeUndefined();

    await expect(
      anonymous.app.registerDevice({
        mac: "aa:bb:cc:dd:ee:22",
        pin: "654321",
        claimCode: activation.claimCode!,
      })
    ).resolves.toMatchObject({
      registered: true,
      activated: true,
      alreadyKnown: true,
    });

    expect(verifySecret("654321", stored.pinHash)).toBe(true);
    expect(stored.claimCodeHash).toBeNull();
    expect(stored.claimCodeExpiresAt).toBeNull();
    expect(stored.claimedAt).toBeInstanceOf(Date);
  });

  it("neutralises a PIN planted before the legitimate activation", async () => {
    const anonymous = createCaller(makeCtx());
    await anonymous.app.registerDevice({
      mac: "aa:bb:cc:dd:ee:33",
      pin: "111111",
    });
    expect(shared.store.appClients[0]).toMatchObject({
      pinHash: expect.any(String),
      claimedAt: null,
    });
    expect(shared.store.appClients[0].licenseType).toBeUndefined();

    await expect(
      anonymous.clientPortal.login({
        mac: "aa:bb:cc:dd:ee:33",
        pin: "111111",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const reseller = makeReseller({ id: 1, credits: 1 });
    shared.store.resellers.push(reseller);
    const activation = await createCaller(
      makeCtx({ reseller })
    ).reseller.activate({
      mac: "aa:bb:cc:dd:ee:33",
      licenseType: "12_months",
    });

    expect(activation.claimCode).toBeTruthy();
    expect(shared.store.appClients[0].pinHash).toBeNull();

    await expect(
      anonymous.app.registerDevice({ mac: "aa:bb:cc:dd:ee:33", pin: "111111" })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    await expect(
      anonymous.app.registerDevice({
        mac: "aa:bb:cc:dd:ee:33",
        pin: "222222",
        claimCode: activation.claimCode!,
      })
    ).resolves.toMatchObject({ verificationRequired: false, activated: true });
    expect(verifySecret("222222", shared.store.appClients[0].pinHash)).toBe(
      true
    );
    expect(verifySecret("111111", shared.store.appClients[0].pinHash)).toBe(
      false
    );
    await expect(
      anonymous.clientPortal.login({
        mac: "aa:bb:cc:dd:ee:33",
        pin: "222222",
      })
    ).resolves.toEqual({ success: true });
  });
});

// 2. Password never leaked -------------------------------------------------

describe("admin.resellerCreate — password confidentiality", () => {
  it("never returns the plaintext password; only a scrypt hash is stored", async () => {
    const caller = createCaller(makeCtx({ user: adminUser }));

    const res = await caller.admin.resellerCreate({
      name: "Reseller",
      contact: "wa:+243...",
      username: "newreseller",
      password: "S3cret-Pw!2026",
      initialCredits: 3,
    });

    // Response exposes only id + username — no password/hash.
    expect(res).toEqual({ id: expect.any(Number), username: "newreseller" });
    expect(JSON.stringify(res)).not.toContain("S3cret-Pw!2026");

    // Stored row holds a hash (not the clear value), which verifies correctly.
    const stored = shared.store.resellers.find(
      r => r.username === "newreseller"
    );
    expect(stored.passwordHash).not.toBe("S3cret-Pw!2026");
    expect(stored.passwordHash.startsWith("scrypt$")).toBe(true);
    expect(verifySecret("S3cret-Pw!2026", stored.passwordHash)).toBe(true);

    // A subsequent admin.resellerList never exposes the hash either.
    const list = await caller.admin.resellerList();
    const row = list.find(r => r.username === "newreseller");
    expect(row).toBeDefined();
    expect(row).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(list)).not.toContain(stored.passwordHash);

    expect(shared.store.creditLedger).toHaveLength(1);
    expect(shared.store.creditLedger[0]).toMatchObject({
      resellerId: stored.id,
      delta: 3,
      balanceAfter: 3,
      entryType: "initial_grant",
      actorType: "admin",
    });
  });
});

describe("admin.resellerAddCredits — atomic balance and ledger", () => {
  it("increments the stored balance and records who added it and why", async () => {
    shared.store.resellers.push(makeReseller({ id: 7, credits: 4 }));
    const result = await createCaller(
      makeCtx({ user: adminUser })
    ).admin.resellerAddCredits({
      resellerId: 7,
      amount: 6,
      reason: "Recharge payée par M-Pesa",
    });

    expect(result).toEqual({ success: true, credits: 10 });
    expect(shared.store.resellers[0].credits).toBe(10);
    expect(shared.store.creditLedger[0]).toMatchObject({
      resellerId: 7,
      delta: 6,
      balanceAfter: 10,
      entryType: "admin_grant",
      actorType: "admin",
      actorUserId: adminUser.id,
      reason: "Recharge payée par M-Pesa",
    });
  });
});

describe("admin.appClientList — client secret confidentiality", () => {
  it("returns an explicit public projection without login or parental PIN hashes", async () => {
    shared.store.appClients.push(
      makeAppClient({
        id: 99,
        activatedByType: "admin",
        activatedByResellerId: null,
        parentalControlPinHash: hashSecret("4321"),
        claimCodeHash: hashSecret("CKAAAAABBBBB"),
      })
    );

    const list = await createCaller(
      makeCtx({ user: adminUser })
    ).admin.appClientList();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: 99,
      mac: "aa:bb:cc:dd:ee:ff",
      name: "Salon",
    });
    expect(list[0]).not.toHaveProperty("pinHash");
    expect(list[0]).not.toHaveProperty("parentalControlPinHash");
    expect(list[0]).not.toHaveProperty("claimCodeHash");
  });
});

describe("admin.appClientRenew — transaction and paid-time preservation", () => {
  it("extends an active client from the existing expiry", async () => {
    const existingExpiry = new Date("2027-03-10T00:00:00Z");
    shared.store.appClients.push(
      makeAppClient({
        id: 55,
        expiresAt: existingExpiry,
        activatedByType: "admin",
      })
    );

    const result = await createCaller(
      makeCtx({ user: adminUser })
    ).admin.appClientRenew({
      appClientId: 55,
      licenseType: "12_months",
    });

    expect(result.expiresAt).toEqual(new Date("2028-03-10T00:00:00Z"));
    expect(shared.store.appClients[0].expiresAt).toEqual(
      new Date("2028-03-10T00:00:00Z")
    );
    expect(shared.store.activations).toHaveLength(1);
  });

  it("refuses to downgrade an active unlimited licence", async () => {
    shared.store.appClients.push(
      makeAppClient({ id: 56, licenseType: "unlimited", expiresAt: null })
    );
    await expect(
      createCaller(makeCtx({ user: adminUser })).admin.appClientRenew({
        appClientId: 56,
        licenseType: "12_months",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(shared.store.appClients[0].licenseType).toBe("unlimited");
    expect(shared.store.activations).toHaveLength(0);
  });
});

// 3. Per-reseller isolation ------------------------------------------------

describe("reseller.myActivations — tenant isolation", () => {
  it("returns only the authenticated reseller's activations", async () => {
    const rA = makeReseller({ id: 10, username: "a" });
    const rB = makeReseller({ id: 20, username: "b" });
    shared.store.resellers.push(rA, rB);
    shared.store.activations.push(
      {
        id: 1,
        appClientId: 1,
        mac: "m1",
        licenseType: "12_months",
        creditsCharged: 1,
        activatedByType: "reseller",
        activatedByResellerId: 10,
        createdAt: new Date(),
      },
      {
        id: 2,
        appClientId: 2,
        mac: "m2",
        licenseType: "unlimited",
        creditsCharged: 2,
        activatedByType: "reseller",
        activatedByResellerId: 20,
        createdAt: new Date(),
      },
      {
        id: 3,
        appClientId: 3,
        mac: "m3",
        licenseType: "12_months",
        creditsCharged: 1,
        activatedByType: "reseller",
        activatedByResellerId: 10,
        createdAt: new Date(),
      }
    );

    const listA = await createCaller(
      makeCtx({ reseller: rA })
    ).reseller.myActivations();
    expect(listA.map((a: any) => a.id).sort()).toEqual([1, 3]);
    expect(listA.every((a: any) => a.activatedByResellerId === 10)).toBe(true);

    const listB = await createCaller(
      makeCtx({ reseller: rB })
    ).reseller.myActivations();
    expect(listB.map((a: any) => a.id)).toEqual([2]);
  });

  it("returns only the authenticated reseller's credit ledger", async () => {
    const rA = makeReseller({ id: 10, username: "a" });
    const rB = makeReseller({ id: 20, username: "b" });
    shared.store.creditLedger.push(
      {
        id: 1,
        resellerId: 10,
        delta: 5,
        balanceAfter: 5,
        entryType: "admin_grant",
        actorType: "admin",
        reason: "A",
        createdAt: new Date(),
      },
      {
        id: 2,
        resellerId: 20,
        delta: 9,
        balanceAfter: 9,
        entryType: "admin_grant",
        actorType: "admin",
        reason: "B",
        createdAt: new Date(),
      }
    );

    const listA = await createCaller(
      makeCtx({ reseller: rA })
    ).reseller.creditHistory();
    const listB = await createCaller(
      makeCtx({ reseller: rB })
    ).reseller.creditHistory();
    expect(listA.map((entry: any) => entry.id)).toEqual([1]);
    expect(listB.map((entry: any) => entry.id)).toEqual([2]);
  });
});

describe("reseller.issueClaimCode — ownership", () => {
  it("allows only the reseller who activated the device to reissue its code", async () => {
    const owner = makeReseller({ id: 10, username: "owner" });
    const outsider = makeReseller({ id: 20, username: "outsider" });
    shared.store.appClients.push(
      makeAppClient({
        id: 77,
        pinHash: null,
        claimedAt: null,
        activatedByResellerId: owner.id,
      })
    );

    await expect(
      createCaller(makeCtx({ reseller: outsider })).reseller.issueClaimCode({
        appClientId: 77,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const result = await createCaller(
      makeCtx({ reseller: owner })
    ).reseller.issueClaimCode({
      appClientId: 77,
    });
    expect(result.claimCode).toMatch(/^CK-/);
    expect(shared.store.appClients[0].claimCodeHash).toBeTruthy();
  });
});

// 4. Password change invalidates the old password --------------------------

describe("reseller.changePassword", () => {
  it("makes a login with the old password fail afterwards", async () => {
    const oldPw = "old-password-123";
    const newPw = "new-password-456";
    const reseller = makeReseller({
      id: 1,
      username: "chp",
      passwordHash: hashSecret(oldPw),
    });
    shared.store.resellers.push(reseller);

    // The session context carries the current (old) hash.
    const authed = createCaller(makeCtx({ reseller: { ...reseller } }));
    await expect(
      authed.reseller.changePassword({
        currentPassword: oldPw,
        newPassword: newPw,
      })
    ).resolves.toEqual({ success: true });

    // The stored hash now matches only the new password.
    expect(verifySecret(newPw, shared.store.resellers[0].passwordHash)).toBe(
      true
    );
    expect(verifySecret(oldPw, shared.store.resellers[0].passwordHash)).toBe(
      false
    );

    const anon = createCaller(makeCtx());
    await expect(
      anon.reseller.login({ username: "chp", password: oldPw })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      anon.reseller.login({ username: "chp", password: newPw })
    ).resolves.toEqual({ success: true });
  });
});
