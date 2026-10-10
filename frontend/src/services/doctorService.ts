import type { DoctorCustomer, DoctorOrder, DoctorPrescription } from '@/types/doctor';
import type { HealthReport } from '@/types/report';
import { authenticatedApiRequest } from './authTokenManager';

const customerPath = (userId: string) =>
  `/api/doctor/customers/${encodeURIComponent(userId)}`;

export function searchCustomers(query: string): Promise<DoctorCustomer[]> {
  const q = encodeURIComponent(query.trim());
  return authenticatedApiRequest<DoctorCustomer[]>(`/api/doctor/customers?q=${q}`);
}

export function fetchDoctorCustomer(userId: string): Promise<DoctorCustomer> {
  return authenticatedApiRequest<DoctorCustomer>(customerPath(userId));
}

export function fetchDoctorOrders(userId: string): Promise<DoctorOrder[]> {
  return authenticatedApiRequest<DoctorOrder[]>(`${customerPath(userId)}/orders`);
}

export function fetchDoctorPrescriptions(userId: string): Promise<DoctorPrescription[]> {
  return authenticatedApiRequest<DoctorPrescription[]>(`${customerPath(userId)}/prescriptions`);
}

export function fetchDoctorReports(userId: string): Promise<HealthReport[]> {
  return authenticatedApiRequest<HealthReport[]>(`${customerPath(userId)}/reports`);
}
