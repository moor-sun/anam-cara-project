import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  appointmentMode: string;
  preferredDate: string;
  preferredTime: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentReference: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AppointmentCreationResponse {
  appointment: Appointment;
  emailNotificationSent: boolean;
  whatsAppNotificationSent: boolean;
}
export interface AvailabilitySlot {
  time: string;
  available: boolean;
}
export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}
export interface RazorpayPayment {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

@Injectable({providedIn:'root'})
export class AppointmentService {
  private apiBase = (window as any).__ANAM_CARA_API_URL__ || 'http://localhost:8080';
  private api = `${this.apiBase}/api/appointments`;
  constructor(private http: HttpClient) {}
  create(data:any){ return this.http.post<AppointmentCreationResponse>(this.api, data); }
  createRazorpayOrder(amount: number, receipt: string) {
    return this.http.post<RazorpayOrder>(`${this.apiBase}/api/create-order`, {amount, currency: 'INR', receipt});
  }
  verifyRazorpayPayment(payment: RazorpayPayment) {
    return this.http.post<{success: boolean}>(`${this.apiBase}/api/verify-payment`, payment);
  }
  availability(date: string) {
    return this.http.get<AvailabilitySlot[]>(`${this.api}/availability`, {params: {date}});
  }
  all(username: string, password: string) {
    const authorization = `Basic ${btoa(`${username}:${password}`)}`;
    return this.http.get<Appointment[]>(this.api, {
      headers: new HttpHeaders({Authorization: authorization})
    });
  }
  updateStatus(id: string, status: 'CONFIRMED' | 'REJECTED', username: string, password: string) {
    const authorization = `Basic ${btoa(`${username}:${password}`)}`;
    return this.http.put<Appointment>(`${this.api}/${id}/status`, {status}, {
      headers: new HttpHeaders({Authorization: authorization})
    });
  }

  deleteAppointment(id: string, username: string, password: string) {
    const authorization = `Basic ${btoa(`${username}:${password}`)}`;
    return this.http.delete<void>(`${this.api}/${id}`, {headers: new HttpHeaders({Authorization: authorization})});
  }
  updateAppointment(id: string, appointment: Appointment, username: string, password: string) {
    const authorization = `Basic ${btoa(`${username}:${password}`)}`;
    return this.http.put<Appointment>(`${this.apiBase}/api/admin/appointments/${id}`, appointment, {
      headers: new HttpHeaders({Authorization: authorization})
    });
  }
}