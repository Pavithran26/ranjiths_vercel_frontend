import { signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth, ensureFirebaseInitialized } from "./firebaseClient";

export type AuthUser = {
  id: string;
  name: string;
  fullName: string;
  username: string;
  role: string;
  email?: string;
  phoneNumber?: string;
  designation?: string;
  preferredLanguage?: string;
  profileImage?: string;
  isActive?: boolean;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  token: string;
  expiresAt: string;
  user: AuthUser;
};

export type DashboardSummary = {
  totalLands: number;
  activeWorkers: number;
  dailyHarvest: number;
  totalRevenue: number;
};

export type LandOwner = {
  id: string;
  name: string;
  phoneNumber: string;
  village: string;
  address: string;
};

export type Land = {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  village: string;
  areaAcres: number;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseAmount: number;
  treeCount: number;
  leaseNotes: string;
  isActive: boolean;
  totalPaid: number;
  balanceDue: number;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
};

export type LandLeasePayment = {
  id: string;
  landId: string;
  paymentDate: string;
  amount: number;
  paymentType: "advance" | "emi" | "other";
  notes: string;
};

export type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  role: string;
  department: string;
  designation: string;
  phoneNumber: string;
  email: string;
  dailyWage: number;
  joinedOn: string;
  isActive: boolean;
  notes: string;
};

export type Vehicle = {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  isActive: boolean;
  notes: string;
};

export type WorkLogAssignment = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  taskRole: string;
  unitsCompleted: number;
};

export type WorkLog = {
  id: string;
  workDate: string;
  landId: string;
  landName: string;
  supervisorId: string | null;
  supervisorName: string;
  vehicleId: string | null;
  vehicleName: string;
  coconutCount: number;
  bagCount: number;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  loadType: "lease load" | "Direct Load" | null;
  transportCost: number | null;
  location: string | null;
  notes: string;
  assignments: WorkLogAssignment[];
};

export type Store = {
  id: string;
  name: string;
  location: string;
  currentCoconuts: number;
  currentBags: number;
  isActive: boolean;
  notes: string;
};

export type GRN = {
  id: string;
  storeId: string;
  storeName: string;
  worklogId: string | null;
  receiptDate: string;
  coconutCount: number;
  bagCount: number;
  vehicleId: string | null;
  notes: string;
};

export type Buyer = {
  id: string;
  name: string;
  phoneNumber: string;
  village: string;
  notes: string;
};

export type SalesEntry = {
  id: string;
  buyerId: string;
  buyerName: string;
  landId: string | null;
  landName: string;
  worklogId: string | null;
  saleDate: string;
  quantity: number;
  unitPrice: number;
  transportCost: number;
  grossAmount: number;
  notes: string;
};

export type LandProductionReportItem = {
  id: string;
  name: string;
  village: string;
  ownerName: string;
  treeCount: number;
  totalCoconuts: number;
  totalWorkLogs: number;
};

export type EmployeeWorkReportItem = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  department: string;
  assignmentCount: number;
  unitsCompleted: number;
  workLogCoconuts: number;
};

export type ProfitLossReport = {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  monthlyBreakdown: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
};

export type AttendanceSummary = {
  todayPresent: number;
  lateArrivals: number;
  remoteEmployees: number;
  attendanceRate: number;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  status: "present" | "late" | "remote" | "absent";
  workedHours: number;
  checkIn: string;
  checkOut: string | null;
  notes?: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type LegacyEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const DEV_API_BASE = "http://127.0.0.1:8000/api";
const PROD_API_BASE = "https://source-backend-django.vercel.app/api";

function resolveConfiguredApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  const fallback = process.env.NODE_ENV === "development" ? DEV_API_BASE : PROD_API_BASE;
  let base = raw || fallback;
  // Empty env on Vercel is "" (still set); relative values break fetch (same-origin → Next, often 403/404).
  if (!/^https?:\/\//i.test(base)) {
    base = fallback;
  }
  return base.replace(/\/+$/, "");
}

const configuredBase = resolveConfiguredApiBase();

const legacyApiBaseUrl = configuredBase.endsWith("/api/v1") ? configuredBase.replace(/\/v1$/, "") : configuredBase;
const apiBaseUrl = configuredBase.endsWith("/api/v1")
  ? configuredBase
  : configuredBase.endsWith("/api")
    ? `${configuredBase}/v1`
    : `${configuredBase}/api/v1`;

function parsePayload(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractMessage(payload: unknown, raw: string, status: number) {
  if (payload && typeof payload === "object") {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail;
    }

    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      if (typeof value === "string") {
        return value;
      }
    }
  }

  if (raw.trim().startsWith("<")) {
    return `Request failed (${status})`;
  }

  return raw || `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit, token?: string, useLegacy = false): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const baseUrl = useLegacy ? legacyApiBaseUrl : apiBaseUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  const raw = await response.text();
  const payload = parsePayload(raw);

  if (!response.ok) {
    throw new Error(extractMessage(payload, raw, response.status));
  }

  if (useLegacy) {
    if (!payload || !("data" in payload)) {
      throw new Error("Invalid legacy server response");
    }
    return (payload as LegacyEnvelope<T>).data;
  }

  return payload as T;
}

async function listRequest<T>(path: string, token: string, params?: Record<string, string | number>): Promise<T[]> {
  let urlPath = path;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) searchParams.append(key, String(value));
    }
    const query = searchParams.toString();
    if (query) {
      urlPath += urlPath.includes("?") ? `&${query}` : `?${query}`;
    }
  }

  const payload = await request<PaginatedResponse<T> | T[]>(urlPath, undefined, token);
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
}

function decodeJwtExpiry(token: string): string {
  try {
    const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "";
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    if (payload.exp) {
      return new Date(payload.exp * 1000).toISOString();
    }
  } catch {
    // Fall back to a short-lived session window if token decoding fails.
  }

  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
}

function mapAuthUser(item: Record<string, unknown>): AuthUser {
  const fullName = String(item.fullName ?? item.full_name ?? item.name ?? item.username ?? "");
  return {
    id: String(item.id ?? ""),
    name: fullName,
    fullName,
    username: String(item.username ?? ""),
    role: String(item.role ?? "worker"),
    email: String(item.email ?? ""),
    phoneNumber: String(item.phoneNumber ?? item.phone_number ?? ""),
    designation: String(item.designation ?? ""),
    preferredLanguage: String(item.preferredLanguage ?? item.preferred_language ?? ""),
    profileImage: item.profileImage ? String(item.profileImage) : undefined,
    isActive: Boolean(item.isActive ?? item.is_active ?? true)
  };
}

function mapLandOwner(item: Record<string, unknown>): LandOwner {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    phoneNumber: String(item.phone_number ?? ""),
    village: String(item.village ?? ""),
    address: String(item.address ?? "")
  };
}

function mapLand(item: Record<string, unknown>): Land {
  const owner = (item.owner ?? {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    ownerId: String(owner.id ?? ""),
    ownerName: String(owner.name ?? ""),
    name: String(item.name ?? ""),
    village: String(item.village ?? ""),
    areaAcres: Number(item.area_acres ?? 0),
    leaseStartDate: String(item.lease_start_date ?? ""),
    leaseEndDate: String(item.lease_end_date ?? ""),
    leaseAmount: Number(item.lease_amount ?? 0),
    treeCount: Number(item.tree_count ?? 0),
    leaseNotes: String(item.lease_notes ?? ""),
    isActive: Boolean(item.is_active ?? true),
    totalPaid: Number(item.total_paid ?? 0),
    balanceDue: Number(item.balance_due ?? 0),
    latitude: item.latitude == null ? null : Number(item.latitude),
    longitude: item.longitude == null ? null : Number(item.longitude),
    location: item.location ? String(item.location) : null,
  };
}

function mapLandLeasePayment(item: Record<string, unknown>): LandLeasePayment {
  return {
    id: String(item.id ?? ""),
    landId: String(item.land_id ?? ""),
    paymentDate: String(item.payment_date ?? ""),
    amount: Number(item.amount ?? 0),
    paymentType: (item.payment_type as "advance" | "emi" | "other") ?? "emi",
    notes: String(item.notes ?? "")
  };
}

function mapEmployee(item: Record<string, unknown>): Employee {
  return {
    id: String(item.id ?? ""),
    employeeCode: String(item.employee_code ?? ""),
    fullName: String(item.full_name ?? ""),
    role: String(item.role ?? "worker"),
    department: String(item.department ?? ""),
    designation: String(item.designation ?? ""),
    phoneNumber: String(item.phone_number ?? ""),
    email: String(item.email ?? ""),
    dailyWage: Number(item.daily_wage ?? 0),
    joinedOn: String(item.joined_on ?? ""),
    isActive: Boolean(item.is_active ?? true),
    notes: String(item.notes ?? "")
  };
}

function mapVehicle(item: Record<string, unknown>): Vehicle {
  return {
    id: String(item.id ?? ""),
    registrationNumber: String(item.registration_number ?? ""),
    vehicleType: String(item.vehicle_type ?? ""),
    capacity: Number(item.capacity ?? 0),
    driverName: String(item.driver_name ?? ""),
    driverPhone: String(item.driver_phone ?? ""),
    isActive: Boolean(item.is_active ?? true),
    notes: String(item.notes ?? "")
  };
}

function mapWorkLog(item: Record<string, unknown>): WorkLog {
  const land = (item.land ?? {}) as Record<string, unknown>;
  const supervisor = (item.supervisor ?? {}) as Record<string, unknown>;
  const vehicle = (item.vehicle ?? {}) as Record<string, unknown>;
  const assignments = Array.isArray(item.assignments) ? item.assignments : [];

  return {
    id: String(item.id ?? ""),
    workDate: String(item.work_date ?? ""),
    landId: String(land.id ?? ""),
    landName: String(land.name ?? ""),
    supervisorId: supervisor.id ? String(supervisor.id) : null,
    supervisorName: String(supervisor.full_name ?? ""),
    vehicleId: vehicle.id ? String(vehicle.id) : null,
    vehicleName: String(vehicle.registration_number ?? ""),
    coconutCount: Number(item.coconut_count ?? 0),
    bagCount: Number(item.bag_count ?? 0),
    latitude: item.latitude == null ? null : Number(item.latitude),
    longitude: item.longitude == null ? null : Number(item.longitude),
    startTime: item.start_time ? String(item.start_time) : null,
    endTime: item.end_time ? String(item.end_time) : null,
    loadType: item.load_type ? String(item.load_type) as "lease load" | "Direct Load" : null,
    transportCost: item.transport_cost == null ? null : Number(item.transport_cost),
    location: item.location ? String(item.location) : null,
    notes: String(item.notes ?? ""),
    assignments: assignments.map((assignment) => {
      const entry = assignment as Record<string, unknown>;
      const employee = (entry.employee ?? {}) as Record<string, unknown>;
      return {
        id: String(entry.id ?? ""),
        employeeId: String(employee.id ?? ""),
        employeeName: String(employee.full_name ?? ""),
        employeeCode: String(employee.employee_code ?? ""),
        taskRole: String(entry.task_role ?? ""),
        unitsCompleted: Number(entry.units_completed ?? 0)
      };
    })
  };
}

function mapStore(item: Record<string, unknown>): Store {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    location: String(item.location ?? ""),
    currentCoconuts: Number(item.current_coconuts ?? 0),
    currentBags: Number(item.current_bags ?? 0),
    isActive: Boolean(item.is_active ?? true),
    notes: String(item.notes ?? "")
  };
}

function mapGRN(item: Record<string, unknown>): GRN {
  const store = (item.store ?? {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    storeId: String(store.id ?? ""),
    storeName: String(store.name ?? ""),
    worklogId: item.worklog_id ? String(item.worklog_id) : null,
    receiptDate: String(item.receipt_date ?? ""),
    coconutCount: Number(item.coconut_count ?? 0),
    bagCount: Number(item.bag_count ?? 0),
    vehicleId: item.vehicle_id ? String(item.vehicle_id) : null,
    notes: String(item.notes ?? "")
  };
}

function mapBuyer(item: Record<string, unknown>): Buyer {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    phoneNumber: String(item.phone_number ?? ""),
    village: String(item.village ?? ""),
    notes: String(item.notes ?? "")
  };
}

function mapSalesEntry(item: Record<string, unknown>): SalesEntry {
  const buyer = (item.buyer ?? {}) as Record<string, unknown>;
  const land = (item.land ?? {}) as Record<string, unknown>;
  const worklog = (item.worklog ?? {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    buyerId: String(buyer.id ?? ""),
    buyerName: String(buyer.name ?? ""),
    landId: land.id ? String(land.id) : null,
    landName: String(land.name ?? ""),
    worklogId: worklog.id ? String(worklog.id) : null,
    saleDate: String(item.sale_date ?? ""),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unit_price ?? 0),
    transportCost: Number(item.transport_cost ?? 0),
    grossAmount: Number(item.gross_amount ?? 0),
    notes: String(item.notes ?? "")
  };
}

export const login = async (input: { username: string; password: string }): Promise<LoginResponse> => {
  ensureFirebaseInitialized();
  if (!firebaseAuth) throw new Error("Firebase auth not initialized");

  const userCredential = await signInWithEmailAndPassword(firebaseAuth, input.username, input.password);
  const user = userCredential.user;
  const token = await user.getIdToken();
  const tokenResult = await user.getIdTokenResult();
  
  const authUser: AuthUser = {
    id: user.uid,
    name: user.displayName || input.username,
    fullName: user.displayName || input.username,
    username: input.username,
    role: "admin",
    email: user.email || undefined,
    isActive: true,
  };

  return {
    access: token,
    refresh: user.refreshToken,
    token: token,
    expiresAt: new Date(tokenResult.expirationTime).toISOString(),
    user: authUser
  };
};

export const getSessionUser = async (token: string) => {
  ensureFirebaseInitialized();
  if (firebaseAuth && firebaseAuth.currentUser) {
    const user = firebaseAuth.currentUser;
    return {
      id: user.uid,
      name: user.displayName || user.email || "",
      fullName: user.displayName || user.email || "",
      username: user.email || "",
      role: "admin",
      email: user.email || "",
      isActive: true,
    } as AuthUser;
  }
  
  return {
    id: "session-user",
    name: "Admin User",
    fullName: "Admin User",
    username: "admin",
    role: "admin",
    isActive: true
  } as AuthUser;
};

export const getDashboardSummary = (token: string) => request<DashboardSummary>("/dashboard/summary", undefined, token);

export const getLandProductionReport = (token: string) =>
  request<LandProductionReportItem[]>("/reports/land-production", undefined, token);

export const getEmployeeWorkReport = (token: string) =>
  request<EmployeeWorkReportItem[]>("/reports/employee-work", undefined, token);

export const getProfitLossReport = (token: string) =>
  request<ProfitLossReport>("/reports/profit-loss", undefined, token);

export const getLandOwners = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/land-owners", token)).map(mapLandOwner);

export const getLand = async (token: string, id: string) => {
  const payload = await request<Record<string, unknown>>(`/lands/${id}`, undefined, token);
  return mapLand(payload);
};

export const createLandOwner = async (
  token: string,
  input: Omit<LandOwner, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    "/land-owners",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        phone_number: input.phoneNumber,
        village: input.village,
        address: input.address
      })
    },
    token
  );
  return mapLandOwner(payload);
};

export const getLands = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/lands", token, params)).map(mapLand);

export const createLand = async (
  token: string,
  input: Omit<Land, "id" | "ownerName" | "totalPaid" | "balanceDue">
) => {
  const payload = await request<Record<string, unknown>>(
    "/lands",
    {
      method: "POST",
      body: JSON.stringify({
        owner_id: input.ownerId,
        name: input.name,
        village: input.village,
        area_acres: input.areaAcres,
        lease_start_date: input.leaseStartDate,
        lease_end_date: input.leaseEndDate,
        lease_amount: input.leaseAmount,
        tree_count: input.treeCount,
        lease_notes: input.leaseNotes,
        is_active: input.isActive,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location: input.location ?? null
      })
    },
    token
  );
  return mapLand(payload);
};

export const updateLand = async (
  token: string,
  id: string,
  input: Omit<Land, "id" | "ownerName" | "totalPaid" | "balanceDue">
) => {
  const payload = await request<Record<string, unknown>>(
    `/lands/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        owner_id: input.ownerId,
        name: input.name,
        village: input.village,
        area_acres: input.areaAcres,
        lease_start_date: input.leaseStartDate,
        lease_end_date: input.leaseEndDate,
        lease_amount: input.leaseAmount,
        tree_count: input.treeCount,
        lease_notes: input.leaseNotes,
        is_active: input.isActive,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location: input.location ?? null
      })
    },
    token
  );
  return mapLand(payload);
};

export const getEmployees = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/employees", token, params)).map(mapEmployee);

export const createEmployee = async (
  token: string,
  input: Omit<Employee, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    "/employees",
    {
      method: "POST",
      body: JSON.stringify({
        employee_code: input.employeeCode,
        full_name: input.fullName,
        role: input.role,
        department: input.department,
        designation: input.designation,
        phone_number: input.phoneNumber,
        email: input.email,
        daily_wage: input.dailyWage,
        joined_on: input.joinedOn,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapEmployee(payload);
};

export const getEmployee = async (token: string, id: string) => {
  const payload = await request<Record<string, unknown>>(`/employees/${id}`, undefined, token);
  return mapEmployee(payload);
};

export const updateEmployee = async (token: string, id: string, input: Omit<Employee, "id">) => {
  const payload = await request<Record<string, unknown>>(
    `/employees/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        employee_code: input.employeeCode,
        full_name: input.fullName,
        role: input.role,
        department: input.department,
        designation: input.designation,
        phone_number: input.phoneNumber,
        email: input.email,
        daily_wage: input.dailyWage,
        joined_on: input.joinedOn,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapEmployee(payload);
};

export const deleteEmployee = (token: string, id: string) =>
  request<{ id: string }>(
    `/employees/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const deleteLand = (token: string, id: string) =>
  request<{ id: string }>(
    `/lands/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const getLandPayments = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/land-payments", token, params)).map(mapLandLeasePayment);

export const createLandPayment = async (
  token: string,
  input: Omit<LandLeasePayment, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    "/land-payments",
    {
      method: "POST",
      body: JSON.stringify({
        land_id: input.landId,
        payment_date: input.paymentDate,
        amount: input.amount,
        payment_type: input.paymentType,
        notes: input.notes
      })
    },
    token
  );
  return mapLandLeasePayment(payload);
};

export const deleteLandPayment = (token: string, id: string) =>
  request<{ id: string }>(
    `/land-payments/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const deleteVehicle = (token: string, id: string) =>
  request<{ id: string }>(
    `/vehicles/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const deleteWorkLog = (token: string, id: string) =>
  request<{ id: string }>(
    `/worklogs/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const deleteSalesEntry = (token: string, id: string) =>
  request<{ id: string }>(
    `/sales/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const getVehicles = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/vehicles", token, params)).map(mapVehicle);

export const createVehicle = async (
  token: string,
  input: Omit<Vehicle, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    "/vehicles",
    {
      method: "POST",
      body: JSON.stringify({
        registration_number: input.registrationNumber,
        vehicle_type: input.vehicleType,
        capacity: input.capacity,
        driver_name: input.driverName,
        driver_phone: input.driverPhone,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapVehicle(payload);
};

export const getVehicle = async (token: string, id: string) => {
  const payload = await request<Record<string, unknown>>(`/vehicles/${id}`, undefined, token);
  return mapVehicle(payload);
};

export const updateVehicle = async (
  token: string,
  id: string,
  input: Omit<Vehicle, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    `/vehicles/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        registration_number: input.registrationNumber,
        vehicle_type: input.vehicleType,
        capacity: input.capacity,
        driver_name: input.driverName,
        driver_phone: input.driverPhone,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapVehicle(payload);
};

export const getWorkLogs = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/worklogs", token, params)).map(mapWorkLog);

export const createWorkLog = async (
  token: string,
  input: {
    workDate: string;
    landId: string;
    supervisorId?: string;
    vehicleId?: string;
    coconutCount: number;
    bagCount: number;
    workerIds: string[];
    latitude?: number | null;
    longitude?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    loadType?: "lease load" | "Direct Load" | null;
    transportCost?: number | null;
    location?: string | null;
    notes?: string;
  }
) => {
  const payload = await request<Record<string, unknown>>(
    "/worklogs",
    {
      method: "POST",
      body: JSON.stringify({
        work_date: input.workDate,
        land_id: input.landId,
        supervisor_id: input.supervisorId || null,
        vehicle_id: input.vehicleId || null,
        coconut_count: input.coconutCount,
        bag_count: input.bagCount,
        worker_ids: input.workerIds.map((id) => Number(id)),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        load_type: input.loadType ?? null,
        transport_cost: input.transportCost ?? null,
        location: input.location ?? null,
        notes: input.notes ?? ""
      })
    },
    token
  );
  return mapWorkLog(payload);
};

export const updateWorkLog = async (
  token: string,
  id: string,
  input: {
    workDate: string;
    landId: string;
    supervisorId?: string;
    vehicleId?: string;
    coconutCount: number;
    bagCount: number;
    workerIds: string[];
    latitude?: number | null;
    longitude?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    loadType?: "lease load" | "Direct Load" | null;
    transportCost?: number | null;
    location?: string | null;
    notes?: string;
  }
) => {
  const payload = await request<Record<string, unknown>>(
    `/worklogs/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        work_date: input.workDate,
        land_id: input.landId,
        supervisor_id: input.supervisorId || null,
        vehicle_id: input.vehicleId || null,
        coconut_count: input.coconutCount,
        bag_count: input.bagCount,
        worker_ids: input.workerIds.map((wId) => Number(wId)),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        load_type: input.loadType ?? null,
        transport_cost: input.transportCost ?? null,
        location: input.location ?? null,
        notes: input.notes ?? ""
      })
    },
    token
  );
  return mapWorkLog(payload);
};

export const getWorkLog = async (token: string, id: string) => {
  const payload = await request<Record<string, unknown>>(`/worklogs/${id}`, undefined, token);
  return mapWorkLog(payload);
};

export const getBuyers = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/buyers", token)).map(mapBuyer);

export const createBuyer = async (
  token: string,
  input: Omit<Buyer, "id">
) => {
  const payload = await request<Record<string, unknown>>(
    "/buyers",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        phone_number: input.phoneNumber,
        village: input.village,
        notes: input.notes
      })
    },
    token
  );
  return mapBuyer(payload);
};

export const getSalesEntries = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/sales", token, params)).map(mapSalesEntry);

export const createSalesEntry = async (
  token: string,
  input: {
    buyerId: string;
    landId?: string;
    worklogId?: string;
    saleDate: string;
    quantity: number;
    unitPrice: number;
    transportCost: number;
    notes?: string;
  }
) => {
  const payload = await request<Record<string, unknown>>(
    "/sales",
    {
      method: "POST",
      body: JSON.stringify({
        buyer_id: input.buyerId,
        land_id: input.landId || null,
        worklog_id: input.worklogId || null,
        sale_date: input.saleDate,
        quantity: input.quantity,
        unit_price: input.unitPrice,
        transport_cost: input.transportCost,
        notes: input.notes ?? ""
      })
    },
    token
  );
  return mapSalesEntry(payload);
};

export const getStores = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/stores", token, params)).map(mapStore);

export const createStore = async (
  token: string,
  input: Omit<Store, "id" | "currentCoconuts" | "currentBags">
) => {
  const payload = await request<Record<string, unknown>>(
    "/stores",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        location: input.location,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapStore(payload);
};

export const updateStore = async (token: string, id: string, input: Omit<Store, "id" | "currentCoconuts" | "currentBags">) => {
  const payload = await request<Record<string, unknown>>(
    `/stores/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: input.name,
        location: input.location,
        is_active: input.isActive,
        notes: input.notes
      })
    },
    token
  );
  return mapStore(payload);
};

export const deleteStore = (token: string, id: string) =>
  request<{ id: string }>(
    `/stores/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

export const getGRNs = async (token: string, params?: Record<string, string | number>) =>
  (await listRequest<Record<string, unknown>>("/grns", token, params)).map(mapGRN);

export const createGRN = async (
  token: string,
  input: Omit<GRN, "id" | "storeName">
) => {
  const payload = await request<Record<string, unknown>>(
    "/grns",
    {
      method: "POST",
      body: JSON.stringify({
        store_id: input.storeId,
        worklog_id: input.worklogId || null,
        receipt_date: input.receiptDate,
        coconut_count: input.coconutCount,
        bag_count: input.bagCount,
        vehicle_id: input.vehicleId || null,
        notes: input.notes
      })
    },
    token
  );
  return mapGRN(payload);
};

export const updateGRN = async (token: string, id: string, input: Omit<GRN, "id" | "storeName">) => {
  const payload = await request<Record<string, unknown>>(
    `/grns/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        store_id: input.storeId,
        worklog_id: input.worklogId || null,
        receipt_date: input.receiptDate,
        coconut_count: input.coconutCount,
        bag_count: input.bagCount,
        vehicle_id: input.vehicleId || null,
        notes: input.notes
      })
    },
    token
  );
  return mapGRN(payload);
};

export const deleteGRN = (token: string, id: string) =>
  request<{ id: string }>(
    `/grns/${id}/`,
    {
      method: "DELETE"
    },
    token
  );

// Legacy compatibility while the old attendance workflow remains in the repo.
export const getAttendanceSummary = (token: string) =>
  request<AttendanceSummary>("/attendance/summary", undefined, token, true);

export const getAttendanceRecords = (token: string) =>
  request<AttendanceRecord[]>("/attendance/records", undefined, token, true);

export const createAttendance = (
  token: string,
  input: {
    employeeId: string;
    date: string;
    status: AttendanceRecord["status"];
    checkIn: string;
    checkOut?: string;
    workedHours: number;
    notes?: string;
  }
) =>
  request<AttendanceRecord>(
    "/attendance/mark",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    token,
    true
  );

export const updateProfile = async (token: string, data: { username?: string; password?: string; profileImage?: File }) => {
  const formData = new FormData();
  if (data.username) formData.append("username", data.username);
  if (data.password) formData.append("password", data.password);
  if (data.profileImage) formData.append("profile_image", data.profileImage);

  const payload = await request<Record<string, unknown>>(
    "/auth/me",
    {
      method: "PATCH",
      body: formData
    },
    token
  );
  return mapAuthUser(payload);
};
