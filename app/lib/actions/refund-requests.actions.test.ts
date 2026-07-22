import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import { createNotification } from "@/app/lib/notifications";
import {
  createRefundRequest,
  acceptRefundRequest,
  refuseRefundRequest,
  escalateToAdmin,
  adminResolveRefundRequest,
  fetchRefundRequestByIdForTeacher,
} from "./refund-requests.actions";

// ─── Stripe mock ──────────────────────────────────────────────────────────────
const { mockRefundsCreate } = vi.hoisted(() => ({
  mockRefundsCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class MockStripe {
    refunds = { create: mockRefundsCreate };
  },
}));

// ─── Infrastructure mocks ─────────────────────────────────────────────────────
vi.mock("@/prisma", () => ({
  default: {
    refundRequest: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    class: { findUnique: vi.fn(), update: vi.fn() },
    user:  { findMany:   vi.fn() },
    studentGameProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    teacherGameProfile: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/auth",                     () => ({ auth:               vi.fn() }));
vi.mock("./users.actions",            () => ({ fetchUserByEmail:   vi.fn() }));
vi.mock("next/navigation",            () => ({ redirect:           vi.fn() }));
vi.mock("next/cache",                 () => ({ revalidatePath:     vi.fn() }));
vi.mock("@/app/lib/notifications",    () => ({ createNotification: vi.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dec = (n: number) => ({
  toNumber: () => n,
  toFixed:  (d: number) => n.toFixed(d),
  toString: () => String(n),
});

const mockSession = { user: { email: "test@test.com" } };

const makeStudent = (ov: Record<string, unknown> = {}) => ({
  id: "student1", role: "student",
  firstName: "Ana", lastName: "Lima", email: "ana@test.com", ...ov,
});
const makeTeacher = (ov: Record<string, unknown> = {}) => ({
  id: "teacher1", role: "teacher",
  firstName: "Alice", lastName: "Smith", email: "alice@test.com", ...ov,
});
const makeAdmin = (ov: Record<string, unknown> = {}) => ({
  id: "admin1", role: "admin",
  firstName: "Admin", lastName: "User", email: "admin@test.com", ...ov,
});

/** Class row as returned when creating a refund request */
const makeClass = (ov: Record<string, unknown> = {}) => ({
  id:            "class1",
  studentId:     "student1",
  teacherId:     "teacher1",
  status:        "completed",
  paid:          true,
  subject:       { name: "Math" },
  teacher:       { firstName: "Alice", lastName: "Smith" },
  payments:      [{ intentId: "pi_test_123" }],
  refundRequest: null,
  gemsAwarded:     0,
  sparksAwarded:   0,
  pointsReversed:  false,
  ...ov,
});

/** RefundRequest row as returned from DB — includes nested class/student/teacher */
const makeRequest = (ov: Record<string, unknown> = {}) => ({
  id:        "req1",
  classId:   "class1",
  studentId: "student1",
  teacherId: "teacher1",
  reason:    "Teacher did not attend.",
  status:    "pending",
  adminNote: null,
  expiresAt: new Date(Date.now() + 5 * 86_400_000),   // 5 days out
  createdAt: new Date("2026-04-28T10:00:00Z"),
  updatedAt: new Date("2026-04-28T10:00:00Z"),
  class: {
    id:             "class1",
    studentId:      "student1",
    teacherId:      "teacher1",
    subject:        { name: "Math" },
    startTime:      new Date("2026-04-01T10:00:00Z"),
    totalPrice:     dec(50),
    payments:       [{ intentId: "pi_test_123" }],
    gemsAwarded:    0,
    sparksAwarded:  0,
    pointsReversed: false,
  },
  student: { firstName: "Ana",   lastName: "Lima",  email: "ana@test.com"   },
  teacher: { firstName: "Alice", lastName: "Smith", email: "alice@test.com" },
  ...ov,
});

const PAST_EXPIRY = new Date(Date.now() - 86_400_000); // yesterday

beforeEach(() => {
  vi.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// createRefundRequest
// ══════════════════════════════════════════════════════════════════════════════
describe("createRefundRequest", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeStudent() as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeClass() as never);
    vi.mocked(prisma.refundRequest.create).mockResolvedValue({} as never);
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await createRefundRequest("class1", "reason")).toEqual({ error: "Not authenticated." });
    expect(prisma.refundRequest.create).not.toHaveBeenCalled();
  });

  it("returns error when the user is not a student", async () => {
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher() as never);
    expect(await createRefundRequest("class1", "reason")).toEqual({ error: "Unauthorised." });
  });

  it("returns error when the class does not exist", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(null);
    expect(await createRefundRequest("class1", "reason")).toEqual({ error: "Class not found." });
  });

  it("returns error when the class belongs to a different student", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeClass({ studentId: "other_student" }) as never,
    );
    expect(await createRefundRequest("class1", "reason")).toEqual({ error: "Unauthorised." });
  });

  it("returns error when the class is not completed", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeClass({ status: "scheduled" }) as never,
    );
    expect(await createRefundRequest("class1", "reason")).toEqual({
      error: "Only completed classes can be reported.",
    });
  });

  it("returns error when the class has not been paid", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeClass({ paid: false }) as never,
    );
    expect(await createRefundRequest("class1", "reason")).toEqual({
      error: "Only paid classes can be reported.",
    });
  });

  it("returns error when a refund request already exists for the class", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeClass({ refundRequest: { id: "existing" } }) as never,
    );
    expect(await createRefundRequest("class1", "reason")).toEqual({
      error: "A refund request already exists for this class.",
    });
  });

  it("returns error when no teacher is assigned", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeClass({ teacherId: null, teacher: null }) as never,
    );
    expect(await createRefundRequest("class1", "reason")).toEqual({
      error: "No teacher assigned to this class.",
    });
  });

  it("returns error when the reason is blank", async () => {
    expect(await createRefundRequest("class1", "   ")).toEqual({
      error: "Please provide a reason.",
    });
    expect(prisma.refundRequest.create).not.toHaveBeenCalled();
  });

  it("creates the request with correct student, teacher, and classId", async () => {
    await createRefundRequest("class1", "Did not show up.");

    expect(prisma.refundRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        classId:   "class1",
        studentId: "student1",
        teacherId: "teacher1",
        reason:    "Did not show up.",
      }),
    });
  });

  it("sets expiresAt approximately 5 days from now", async () => {
    await createRefundRequest("class1", "reason");

    const call = vi.mocked(prisma.refundRequest.create).mock.calls[0][0];
    const expiresAt: Date = (call.data as Record<string, unknown>).expiresAt as Date;
    const msUntilExpiry = expiresAt.getTime() - Date.now();

    // Between 4.9 and 5.1 days
    expect(msUntilExpiry).toBeGreaterThan(4.9 * 86_400_000);
    expect(msUntilExpiry).toBeLessThan(5.1 * 86_400_000);
  });

  it("notifies the teacher about the no-show report", async () => {
    await createRefundRequest("class1", "reason");

    expect(createNotification).toHaveBeenCalledWith(
      "teacher1",
      "refund_requested",
      expect.any(String),
      expect.stringContaining("Math"),
      "/main/teacher/refund-requests",
    );
  });

  it("returns an empty object on success", async () => {
    expect(await createRefundRequest("class1", "reason")).toEqual({});
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// acceptRefundRequest
// ══════════════════════════════════════════════════════════════════════════════
describe("acceptRefundRequest", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher() as never);
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(makeRequest() as never);
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);
    mockRefundsCreate.mockResolvedValue({ id: "re_test" });
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await acceptRefundRequest("req1")).toEqual({ error: "Not authenticated." });
  });

  it("returns error when the request does not exist", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(null);
    expect(await acceptRefundRequest("req1")).toEqual({ error: "Request not found." });
  });

  it("returns error when the request belongs to a different teacher", async () => {
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher({ id: "other_teacher" }) as never);
    expect(await acceptRefundRequest("req1")).toEqual({ error: "Unauthorised." });
  });

  it("returns error when the request is no longer pending", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "refused" }) as never,
    );
    expect(await acceptRefundRequest("req1")).toEqual({
      error: "This request can no longer be actioned.",
    });
    expect(mockRefundsCreate).not.toHaveBeenCalled();
  });

  it("calls Stripe refund with the correct payment intent", async () => {
    await acceptRefundRequest("req1");

    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_test_123" });
  });

  it("updates the request status to accepted", async () => {
    await acceptRefundRequest("req1");

    expect(prisma.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data:  { status: "accepted" },
    });
  });

  it("notifies the student that the refund was approved", async () => {
    await acceptRefundRequest("req1");

    expect(createNotification).toHaveBeenCalledWith(
      "student1",
      "refund_decided",
      expect.stringContaining("Approved"),
      expect.stringContaining("Math"),
      expect.stringContaining("class1"),
    );
  });

  it("returns error and does not update status when Stripe fails", async () => {
    mockRefundsCreate.mockRejectedValue(new Error("Card network error"));

    const result = await acceptRefundRequest("req1");

    expect(result).toEqual({ error: expect.stringContaining("Card network error") });
    expect(prisma.refundRequest.update).not.toHaveBeenCalled();
  });

  it("claws back gems/sparks that were awarded for the class on a successful refund", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({
        class: { ...makeRequest().class, gemsAwarded: 150, sparksAwarded: 70 },
      }) as never,
    );
    vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 200 } as never);
    vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 100 } as never);

    await acceptRefundRequest("req1");

    expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { insightGems: 50 } }), // 200 - 150
    );
    expect(prisma.teacherGameProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { reputationSparks: 30 } }), // 100 - 70
    );
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
    });
  });

  it("does not reverse points a second time if already reversed", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({
        class: { ...makeRequest().class, gemsAwarded: 150, sparksAwarded: 70, pointsReversed: true },
      }) as never,
    );

    await acceptRefundRequest("req1");

    expect(prisma.studentGameProfile.upsert).not.toHaveBeenCalled();
    expect(prisma.teacherGameProfile.upsert).not.toHaveBeenCalled();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("skips Stripe when the class has no payment record", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ class: { ...makeRequest().class, payments: [] } }) as never,
    );

    await acceptRefundRequest("req1");

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(prisma.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "accepted" } }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// refuseRefundRequest
// ══════════════════════════════════════════════════════════════════════════════
describe("refuseRefundRequest", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher() as never);
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(makeRequest() as never);
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await refuseRefundRequest("req1")).toEqual({ error: "Not authenticated." });
  });

  it("returns error when the request is no longer pending", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "accepted" }) as never,
    );
    expect(await refuseRefundRequest("req1")).toEqual({
      error: "This request can no longer be actioned.",
    });
    expect(prisma.refundRequest.update).not.toHaveBeenCalled();
  });

  it("updates the request status to refused", async () => {
    await refuseRefundRequest("req1");

    expect(prisma.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data:  { status: "refused" },
    });
  });

  it("notifies the student and mentions the admin escalation option", async () => {
    await refuseRefundRequest("req1");

    expect(createNotification).toHaveBeenCalledWith(
      "student1",
      "refund_decided",
      expect.any(String),
      expect.stringContaining("escalate"),
      expect.stringContaining("class1"),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// escalateToAdmin
// ══════════════════════════════════════════════════════════════════════════════
describe("escalateToAdmin", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeStudent() as never);
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "refused" }) as never,
    );
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([makeAdmin()] as never);
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await escalateToAdmin("req1")).toEqual({ error: "Not authenticated." });
  });

  it("returns error when the user is not a student", async () => {
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher() as never);
    expect(await escalateToAdmin("req1")).toEqual({ error: "Unauthorised." });
  });

  it("returns error when the request does not belong to the student", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "refused", studentId: "other_student" }) as never,
    );
    expect(await escalateToAdmin("req1")).toEqual({ error: "Unauthorised." });
  });

  it("returns error when status is not refused (e.g. still pending)", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "pending" }) as never,
    );
    expect(await escalateToAdmin("req1")).toEqual({
      error: "Only refused requests can be escalated.",
    });
  });

  it("updates status to admin_review", async () => {
    await escalateToAdmin("req1");

    expect(prisma.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data:  { status: "admin_review" },
    });
  });

  it("notifies every admin account", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      makeAdmin({ id: "admin1" }),
      makeAdmin({ id: "admin2" }),
    ] as never);

    await escalateToAdmin("req1");

    const calls = vi.mocked(createNotification).mock.calls;
    const adminIds = calls.map((c) => c[0]);
    expect(adminIds).toContain("admin1");
    expect(adminIds).toContain("admin2");
  });

  it("still succeeds when there are no admin accounts", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    const result = await escalateToAdmin("req1");

    expect(result).toEqual({});
    expect(prisma.refundRequest.update).toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// adminResolveRefundRequest
// ══════════════════════════════════════════════════════════════════════════════
describe("adminResolveRefundRequest", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeAdmin() as never);
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "admin_review" }) as never,
    );
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);
    mockRefundsCreate.mockResolvedValue({ id: "re_admin" });
  });

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    expect(await adminResolveRefundRequest("req1", "refund")).toEqual({
      error: "Not authenticated.",
    });
  });

  it("returns error when the user is not an admin", async () => {
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeStudent() as never);
    expect(await adminResolveRefundRequest("req1", "refund")).toEqual({
      error: "Unauthorised.",
    });
  });

  it("returns error when status is not admin_review", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({ status: "pending" }) as never,
    );
    expect(await adminResolveRefundRequest("req1", "refund")).toEqual({
      error: "Only escalated requests can be resolved here.",
    });
  });

  it("calls Stripe refund and marks resolved when action is 'refund'", async () => {
    await adminResolveRefundRequest("req1", "refund");

    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_test_123" });
    expect(prisma.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "resolved" }) }),
    );
  });

  it("does NOT call Stripe when action is 'dismiss'", async () => {
    await adminResolveRefundRequest("req1", "dismiss");

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(prisma.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "resolved" }) }),
    );
  });

  it("claws back gems/sparks when resolving with a refund", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({
        status: "admin_review",
        class: { ...makeRequest().class, gemsAwarded: 50, sparksAwarded: 25 },
      }) as never,
    );
    vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 50 } as never);
    vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 25 } as never);

    await adminResolveRefundRequest("req1", "refund");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
    });
  });

  it("does NOT claw back points when action is 'dismiss'", async () => {
    vi.mocked(prisma.refundRequest.findUnique).mockResolvedValue(
      makeRequest({
        status: "admin_review",
        class: { ...makeRequest().class, gemsAwarded: 50, sparksAwarded: 25 },
      }) as never,
    );

    await adminResolveRefundRequest("req1", "dismiss");

    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("persists the admin note when provided", async () => {
    await adminResolveRefundRequest("req1", "dismiss", "Reviewed — teacher confirmed attendance.");

    expect(prisma.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data:  { status: "resolved", adminNote: "Reviewed — teacher confirmed attendance." },
    });
  });

  it("notifies both the student and the teacher after resolution", async () => {
    await adminResolveRefundRequest("req1", "dismiss");

    const notifiedIds = vi.mocked(createNotification).mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("student1");
    expect(notifiedIds).toContain("teacher1");
  });

  it("returns error and does not update when Stripe fails during force refund", async () => {
    mockRefundsCreate.mockRejectedValue(new Error("Stripe timeout"));

    const result = await adminResolveRefundRequest("req1", "refund");

    expect(result).toEqual({ error: expect.stringContaining("Stripe timeout") });
    expect(prisma.refundRequest.update).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Auto-expiry (tested via fetchRefundRequestByIdForTeacher)
// ══════════════════════════════════════════════════════════════════════════════
describe("fetchRefundRequestByIdForTeacher — auto-expiry", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(makeTeacher() as never);
  });

  it("issues a Stripe refund and marks the request expired when past the expiry window", async () => {
    // First call: expireIfNeeded reads the bare request to check status + expiresAt
    vi.mocked(prisma.refundRequest.findUnique)
      .mockResolvedValueOnce({
        id: "req1", status: "pending", expiresAt: PAST_EXPIRY, classId: "class1", studentId: "student1",
      } as never)
      // Second call: the outer function re-fetches with full INCLUDE after expiry
      .mockResolvedValueOnce(makeRequest({ status: "expired", expiresAt: PAST_EXPIRY }) as never);

    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      payments: [{ intentId: "pi_expired_123" }],
    } as never);

    mockRefundsCreate.mockResolvedValue({ id: "re_expired" });
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);

    await fetchRefundRequestByIdForTeacher("req1");

    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_expired_123" });
    expect(prisma.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req1" },
      data:  { status: "expired" },
    });
    expect(createNotification).toHaveBeenCalledWith(
      "student1",
      "refund_decided",
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });

  it("claws back gems/sparks on expiry even though the Stripe call result is ignored either way", async () => {
    vi.mocked(prisma.refundRequest.findUnique)
      .mockResolvedValueOnce({
        id: "req1", status: "pending", expiresAt: PAST_EXPIRY, classId: "class1", studentId: "student1",
      } as never)
      .mockResolvedValueOnce(makeRequest({ status: "expired", expiresAt: PAST_EXPIRY }) as never);

    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      studentId: "student1",
      teacherId: "teacher1",
      payments: [{ intentId: "pi_expired_123" }],
      gemsAwarded: 50,
      sparksAwarded: 25,
      pointsReversed: false,
    } as never);
    vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 50 } as never);
    vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 25 } as never);

    mockRefundsCreate.mockResolvedValue({ id: "re_expired" });
    vi.mocked(prisma.refundRequest.update).mockResolvedValue({} as never);

    await fetchRefundRequestByIdForTeacher("req1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
    });
  });

  it("skips expiry logic entirely when the request is already accepted", async () => {
    vi.mocked(prisma.refundRequest.findUnique)
      .mockResolvedValueOnce({
        id: "req1", status: "accepted", expiresAt: PAST_EXPIRY,
      } as never)
      .mockResolvedValueOnce(makeRequest({ status: "accepted" }) as never);

    await fetchRefundRequestByIdForTeacher("req1");

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(prisma.refundRequest.update).not.toHaveBeenCalled();
  });

  it("does not expire a pending request that is still within the window", async () => {
    const futureExpiry = new Date(Date.now() + 3 * 86_400_000);

    vi.mocked(prisma.refundRequest.findUnique)
      .mockResolvedValueOnce({
        id: "req1", status: "pending", expiresAt: futureExpiry,
      } as never)
      .mockResolvedValueOnce(makeRequest({ expiresAt: futureExpiry }) as never);

    await fetchRefundRequestByIdForTeacher("req1");

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(prisma.refundRequest.update).not.toHaveBeenCalled();
  });
});
