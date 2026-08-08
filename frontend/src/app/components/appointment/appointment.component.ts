import { CommonModule } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentService, AvailabilitySlot, RazorpayPayment } from '../../services/appointment.service';

declare const Razorpay: any;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .payment-card { background:#fffaf2; border:1px solid #dfcfad; border-radius:16px; padding:18px; margin:8px 0 20px; }
    .payment-card h2 { color:#5a1724; font-size:22px; margin:0 0 10px; }
    .payment-card p { margin:6px 0; }
    .payment-summary { color:#41382f; font-size:17px; margin:4px 0 !important; }
    .payment-note, .optional { color:#685b50; font-size:14px; }
    .payment-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .razorpay-button { background:#287d3c !important; }
    .whatsapp-button { display:inline-block; margin-top:14px; background:#287d3c !important; }
    .slot-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:10px; margin:8px 0 20px; }
    .slot { border:1px solid #5a1724; background:white !important; color:#5a1724 !important; border-radius:12px; }
    .slot.selected { background:#5a1724 !important; color:white !important; }
    .slot.unavailable { background:#ddd !important; border-color:#bbb; color:#777 !important; cursor:not-allowed; text-decoration:line-through; }
    .slot-message { color:#685b50; margin:8px 0 20px; }
    .form-intro { color:#685b50; margin:-8px 0 22px; }
    .booking-intro { max-width:720px; font-size:18px; color:#514740; margin-bottom:28px; }
    .booking-points { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:720px; margin:0 0 28px; }
    .booking-points span { background:#f5e8d5; border-radius:12px; padding:12px; color:#4d6541; font-size:14px; font-weight:bold; text-align:center; }
    .privacy-note { color:#685b50; font-size:13px; margin-top:18px; }
    .required { color:#9a2638; font-weight:bold; }
    .step-title { color:#5a1724; font-size:20px; margin:24px 0 12px; padding-bottom:7px; border-bottom:1px solid #eadfc9; }
    .continue-hint { background:#f5efe4; color:#685b50; padding:12px 14px; border-radius:10px; margin:4px 0 18px; }
    @media (max-width:600px) { .booking-points { grid-template-columns:1fr; } }
  `],
  template: `
    <section class="section">
      <h1>Book an Appointment</h1>
      <p class="booking-intro">Choose the kind of support you are looking for, select an online or
        in-person session, and reserve an available 60-minute time. The session fee is
        <b>&#8377;{{ paymentAmount | number }}</b>.</p>
      <div class="booking-points">
        <span>1. Share your details</span><span>2. Choose an available slot</span><span>3. Pay securely with Razorpay</span>
      </div>
      <p class="form-intro"><span class="required">*</span> Required fields</p>
      <form (ngSubmit)="submit()" #appointmentForm="ngForm">
        <h2 class="step-title">Your details</h2>
        <label>Name <span class="required">*</span></label><input required [(ngModel)]="form.name" name="name" autocomplete="name">
        <label>Phone <span class="required">*</span></label><input required [(ngModel)]="form.phone" name="phone" inputmode="tel" autocomplete="tel">
        <label>Email <span class="optional">(optional)</span></label><input type="email" [(ngModel)]="form.email" name="email" autocomplete="email">

        <h2 class="step-title">Appointment details</h2>
        <label>Service <span class="required">*</span></label>
        <select required [(ngModel)]="form.service" (ngModelChange)="resetPayment()" name="service">
          <option value="">Select</option><option>Family Counselling</option><option>Career Counselling</option>
          <option>Adolescent Counselling</option><option>School Counselling</option><option>Corporate Wellness</option>
        </select>
        <label>Appointment type <span class="required">*</span></label>
        <select required [(ngModel)]="form.appointmentMode" (ngModelChange)="resetPayment()" name="appointmentMode">
          <option value="">Select online or in person</option><option value="Online">Online</option>
          <option value="In person">In person (offline)</option>
        </select>
        <label>Preferred date <span class="required">*</span></label><input type="date" required [min]="today" [(ngModel)]="form.preferredDate" (ngModelChange)="loadAvailability($event)" name="preferredDate">
        <label>Appointment time <span class="required">*</span> <span class="optional">(60 minutes)</span></label>
        <p class="slot-message" *ngIf="!form.preferredDate">Choose a date to see available times.</p>
        <p class="slot-message" *ngIf="loadingSlots">Loading available times...</p>
        <div class="slot-grid" *ngIf="!loadingSlots && slots.length">
          <button *ngFor="let slot of slots" type="button" class="slot"
            [class.selected]="form.preferredTime === slot.time"
            [class.unavailable]="!slot.available" [disabled]="!slot.available"
            (click)="selectSlot(slot)">{{ formatTime(slot.time) }}</button>
        </div>
        <p class="continue-hint" *ngIf="form.preferredDate && !form.preferredTime">Select an available time to continue to payment.</p>

        <label>Message <span class="optional">(optional)</span></label><textarea rows="4" [(ngModel)]="form.message" name="message" placeholder="Anything you would like us to know"></textarea>

        <div class="payment-card" *ngIf="form.appointmentMode && form.preferredDate && form.preferredTime">
          <h2>Payment</h2>
          <p class="payment-summary">Session fee: <b>&#8377;{{ paymentAmount | number }}</b></p>
          <div class="payment-actions">
            <button type="button" class="razorpay-button" (click)="startPayment()"
              [disabled]="paymentProcessing || paymentVerified">
              {{ paymentVerified ? 'Payment verified' : (paymentProcessing ? 'Opening checkout...' : 'Pay securely') }}
            </button>
          </div>
          <p class="payment-note" *ngIf="paymentMessage" role="status">{{ paymentMessage }}</p>
          <p class="payment-note">Razorpay accepts UPI, cards and other enabled payment methods.</p>
        </div>
        <button type="submit" [disabled]="appointmentForm.invalid || !form.preferredTime || !paymentVerified || submitting">{{ submitting ? 'Submitting...' : 'Submit Appointment Request' }}</button>
        <div class="success" *ngIf="saved">Appointment requested. Your slot will be confirmed after payment verification.</div>
        <a *ngIf="whatsAppUrl" class="btn whatsapp-button" [href]="whatsAppUrl" target="_blank" rel="noopener">Send payment screenshot through WhatsApp</a>
        <div class="error" *ngIf="notificationWarning">{{ notificationWarning }}</div>
        <div class="error" *ngIf="error">{{ error }}</div>
        <p class="privacy-note">The information you provide is used to arrange and manage your
          appointment. Please avoid including highly sensitive details in this form.</p>
      </form>
    </section>`
})
export class AppointmentComponent {
  form = this.emptyForm(); saved = false; submitting = false; error = ''; notificationWarning = ''; whatsAppUrl = '';
  slots: AvailabilitySlot[] = []; loadingSlots = false;
  paymentProcessing = false;
  paymentVerified = false;
  paymentMessage = '';
  readonly paymentAmount = 1000;
  today = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Kolkata'});
  constructor(private service: AppointmentService, private zone: NgZone) {}
  submit(): void {
    if (!this.paymentVerified) {
      this.error = 'Please complete and verify the payment before submitting.';
      return;
    }
    this.saved = false; this.error = ''; this.notificationWarning = ''; this.whatsAppUrl = ''; this.submitting = true;
    const submittedForm = {...this.form};
    this.service.create(this.form).subscribe({
      next: response => {
        this.saved = true; this.submitting = false; this.form = this.emptyForm(); this.slots = [];
        this.paymentVerified = false; this.paymentMessage = '';
        this.whatsAppUrl = this.createWhatsAppUrl(submittedForm);
        if (!response.emailNotificationSent) this.notificationWarning = 'Appointment saved, but the email notification could not be sent. Please check the backend email configuration.';
      },
      error: response => {
        this.submitting = false;
        if (response.status === 409) {
          this.error = 'That 60-minute appointment window has just been booked. Please choose another available time.';
          this.loadAvailability(this.form.preferredDate);
        }
        else if (response.status === 400) this.error = response.error?.message || 'Please choose a valid appointment time.';
        else this.error = 'Could not submit your request. Please try again or contact us directly.';
      }
    });
  }
  loadAvailability(date: string): void {
    this.form.preferredTime = '';
    this.resetPayment();
    this.slots = [];
    if (!date) return;
    this.loadingSlots = true;
    this.service.availability(date).subscribe({
      next: slots => { this.slots = slots; this.loadingSlots = false; },
      error: () => { this.loadingSlots = false; this.error = 'Could not load appointment availability. Please try again.'; }
    });
  }
  selectSlot(slot: AvailabilitySlot): void {
    if (slot.available) {
      this.form.preferredTime = slot.time;
      this.resetPayment();
    }
  }
  formatTime(time: string): string {
    const [hourText, minute] = time.split(':');
    const hour = Number(hourText);
    return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
  }
  startPayment(): void {
    this.error = '';
    this.paymentMessage = '';
    if (typeof Razorpay === 'undefined') {
      this.paymentMessage = 'Payment checkout could not load. Check your connection and try again.';
      return;
    }
    this.paymentProcessing = true;
    const receipt = `ac_${Date.now()}`;
    this.service.createRazorpayOrder(this.paymentAmount * 100, receipt).subscribe({
      next: order => {
        const checkout = new Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'Anam Cara Wellness Centre',
          description: `${this.form.service} appointment`,
          order_id: order.order_id,
          prefill: {
            name: this.form.name,
            email: this.form.email,
            contact: this.form.phone
          },
          theme: {color: '#5a1724'},
          handler: (payment: RazorpayPayment) => {
            this.zone.run(() => this.verifyPayment(payment));
          },
          modal: {
            ondismiss: () => {
              this.zone.run(() => {
                this.paymentProcessing = false;
                if (!this.paymentVerified) this.paymentMessage = 'Payment cancelled. You can try again when ready.';
              });
            }
          }
        });
        checkout.on('payment.failed', (response: any) => {
          this.zone.run(() => {
            this.paymentProcessing = false;
            this.paymentMessage = response?.error?.description || 'Payment failed. Please try again.';
          });
        });
        checkout.open();
      },
      error: response => {
        this.paymentProcessing = false;
        this.paymentMessage = response.error?.message || 'Could not start payment. Please try again.';
      }
    });
  }
  private verifyPayment(payment: RazorpayPayment): void {
    this.paymentMessage = 'Verifying payment...';
    this.service.verifyRazorpayPayment(payment).subscribe({
      next: () => {
        this.paymentProcessing = false;
        this.paymentVerified = true;
        this.form.paymentMethod = 'Razorpay';
        this.form.paymentReference = payment.razorpay_payment_id;
        this.paymentMessage = 'Payment verified. You can now submit your appointment request.';
      },
      error: response => {
        this.paymentProcessing = false;
        this.paymentVerified = false;
        this.form.paymentReference = '';
        this.paymentMessage = response.error?.message || 'Payment verification failed. Please contact us before trying again.';
      }
    });
  }
  resetPayment(): void {
    this.paymentVerified = false;
    this.paymentProcessing = false;
    this.paymentMessage = '';
    this.form.paymentReference = '';
  }
  private emptyForm() {
    return {name:'', phone:'', email:'', service:'', appointmentMode:'', preferredDate:'', preferredTime:'', paymentMethod:'Razorpay', paymentAmount:1000, paymentReference:'', message:''};
  }
  private createWhatsAppUrl(form: any): string {
    const message = [
      'New Anam Cara appointment request',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email || 'Not provided'}`,
      `Service: ${form.service}`,
      `Appointment type: ${form.appointmentMode}`,
      `Preferred date: ${form.preferredDate}`,
      `Preferred time: ${form.preferredTime}`,
      `Razorpay payment ID: ${form.paymentReference || 'Not provided'}`,
      `Message: ${form.message || 'Not provided'}`
    ].join('\n');
    return `https://wa.me/917092787291?text=${encodeURIComponent(message)}`;
  }
}
