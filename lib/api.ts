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
  notes: string;
  assignments: WorkLogAssignment[];
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

const configuredBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://source-backend-django.vercel.app/api");

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

async function listRequest<T>(path: string, token: string): Promise<T[]> {
  const payload = await request<PaginatedResponse<T> | T[]>(path, undefined, token);
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
    isActive: Boolean(item.is_active ?? true)
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
  const payload = await request<{ access: string; refresh: string; user: Record<string, unknown> }>("/auth/token", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return {
    access: payload.access,
    refresh: payload.refresh,
    token: payload.access,
    expiresAt: decodeJwtExpiry(payload.access),
    user: mapAuthUser(payload.user)
  };
};

export const getSessionUser = async (token: string) => {
  const payload = await request<Record<string, unknown>>("/auth/me", undefined, token);
  return mapAuthUser(payload);
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

export const getLands = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/lands", token)).map(mapLand);

export const createLand = async (
  token: string,
  input: Omit<Land, "id" | "ownerName">
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
        is_active: input.isActive
      })
    },
    token
  );
  return mapLand(payload);
};

export const getEmployees = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/employees", token)).map(mapEmployee);

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
    `/employees/${id}`,
    {
      method: "DELETE"
    },
    token
  );

export const getVehicles = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/vehicles", token)).map(mapVehicle);

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

export const getWorkLogs = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/worklogs", token)).map(mapWorkLog);

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
        notes: input.notes ?? ""
      })
    },
    token
  );
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

export const getSalesEntries = async (token: string) =>
  (await listRequest<Record<string, unknown>>("/sales", token)).map(mapSalesEntry);

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
