import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <span class="eyebrow">Contact us</span>
      <h1>Let’s start with a conversation</h1>
      <p class="lead">If you have a question about counselling or need help choosing a service,
        contact Anam Cara. For appointment requests, the booking page is the quickest place to begin.</p>
    </section>

    <section class="section contact-layout">
      <div class="contact-details">
        <span class="eyebrow">Anam Cara Counselling and Wellness Center</span>
        <h2>We are here when you are ready</h2>
        <p>Please allow time for a response when contacting us during sessions or outside regular
          working hours.</p>
        <div class="contact-item"><span>Phone & WhatsApp</span><a href="tel:+917092787291">+91 70927 87291</a></div>
        <div class="contact-item"><span>Email</span><a href="mailto:anamcarawellnesscentre@gmail.com">anamcarawellnesscentre&#64;gmail.com</a></div>
        <div class="contact-item"><span>Location</span><strong>Chennai, Tamil Nadu</strong></div>
      </div>
      <div class="card contact-card">
        <h2>Request an appointment</h2>
        <p>Choose a counselling service, select online or in-person support, and view the available
          dates and times. Your appointment will be confirmed after payment verification.</p>
        <a routerLink="/appointment" class="btn">Go to Appointment Booking</a>
        <hr>
        <h3>Before your session</h3>
        <p>You do not need to prepare a complete account of what has happened. Begin with whatever
          feels most important or manageable, and the conversation can develop from there.</p>
      </div>
    </section>

    <section class="section notice">
      <h2>Please note</h2>
      <p>Anam Cara provides counselling and wellness support by appointment. This website and its
        services are not an emergency response service or a replacement for urgent medical care.
        If there is immediate danger, contact local emergency services or go to the nearest hospital.</p>
    </section>
  `
})
export class ContactComponent {}
