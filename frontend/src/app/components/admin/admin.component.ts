import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../services/appointment.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="section admin-page">
      <h1>Appointment Admin</h1>

      <form *ngIf="!authenticated" (ngSubmit)="login()" class="admin-login">
        <label>Username</label>
        <input name="username" autocomplete="username" required [(ngModel)]="username">
        <label>Password</label>
        <input name="password" type="password" autocomplete="current-password" required [(ngModel)]="password">
        <button type="submit" [disabled]="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
        <p *ngIf="error" class="error">{{ error }}</p>
      </form>

      <div *ngIf="authenticated">
        <div class="admin-actions">
          <p><b>{{ appointments.length }}</b> appointment request(s)</p>
          <button type="button" (click)="load()" [disabled]="loading">Refresh</button>
          <button type="button" class="secondary" (click)="logout()">Sign out</button>
        </div>
        <p *ngIf="error" class="error">{{ error }}</p>
        <div class="table-wrap" *ngIf="appointments.length; else emptyState">
          <table>
            <thead>
              <tr><th>Received</th><th>Client</th><th>Service & type</th><th>Preferred slot</th><th>Payment</th><th>Message</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let appointment of appointments">
                <td>{{ appointment.createdAt | date:'medium' }}</td>
                <td><b>{{ appointment.name }}</b><br>{{ appointment.phone }}<br>{{ appointment.email }}</td>
                <td>{{ appointment.service }}<br><b>{{ appointment.appointmentMode || 'Not specified' }}</b></td>
                <td>{{ appointment.preferredDate || 'Not provided' }}<br>{{ appointment.preferredTime || '' }}</td>
                <td>{{ appointment.paymentMethod || 'Not provided' }} — ₹{{ appointment.paymentAmount || 1000 }}<br><b>Payment ID: {{ appointment.paymentReference || 'Not provided' }}</b><br>Razorpay signature verified before submission</td>
                <td>{{ appointment.message || '—' }}</td>
                <td>
                  <span class="status">{{ appointment.status }}</span>
                  <div class="status-actions" *ngIf="appointment.status === 'PAYMENT_PENDING' || appointment.status === 'NEW'">
                    <button type="button" (click)="setStatus(appointment, 'CONFIRMED')" [disabled]="updatingId === appointment.id">Confirm</button>
                    <button type="button" class="reject" (click)="setStatus(appointment, 'REJECTED')" [disabled]="updatingId === appointment.id">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyState><div class="card">No appointments have been submitted.</div></ng-template>
      </div>
    </section>
  `
})
export class AdminComponent {
  username = '';
  password = '';
  appointments: Appointment[] = [];
  authenticated = false;
  loading = false;
  error = '';
  updatingId = '';

  constructor(private appointmentService: AppointmentService) {}

  login(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.appointmentService.all(this.username, this.password).subscribe({
      next: appointments => {
        this.appointments = appointments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        this.authenticated = true;
        this.loading = false;
      },
      error: response => {
        this.loading = false;
        if (response.status === 401) {
          this.authenticated = false;
          this.error = 'Invalid admin username or password.';
        } else {
          this.error = 'Could not load appointments. Confirm that the backend is running.';
        }
      }
    });
  }

  logout(): void {
    this.username = '';
    this.password = '';
    this.appointments = [];
    this.authenticated = false;
    this.error = '';
  }

  setStatus(appointment: Appointment, status: 'CONFIRMED' | 'REJECTED'): void {
    this.updatingId = appointment.id;
    this.error = '';
    this.appointmentService.updateStatus(appointment.id, status, this.username, this.password).subscribe({
      next: updated => {
        appointment.status = updated.status;
        this.updatingId = '';
      },
      error: () => {
        this.updatingId = '';
        this.error = 'Could not update the appointment. Please try again.';
      }
    });
  }
}
