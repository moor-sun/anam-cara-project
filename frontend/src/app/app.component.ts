import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({selector:'app-root', standalone:true, imports:[RouterOutlet, RouterLink, RouterLinkActive], template:`
<nav class="nav">
  <div class="brand">Anam Cara</div>
  <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
  <a routerLink="/about" routerLinkActive="active">About Us</a>
  <a routerLink="/services" routerLinkActive="active">Services</a>
  <a routerLink="/appointment" routerLinkActive="active">Appointment</a>
  <a routerLink="/contact" routerLinkActive="active">Contact</a>
  <a routerLink="/admin" routerLinkActive="active">Admin</a>
</nav>
<router-outlet></router-outlet>
<footer><strong>Anam Cara</strong><span>Counselling and Wellness Center · Chennai</span><small>© 2026 Anam Cara. All rights reserved.</small></footer>`})
export class AppComponent {}
