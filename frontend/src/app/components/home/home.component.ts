import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div>
        <span class="eyebrow">Counselling & emotional wellness</span>
        <h1>ANAM CARA</h1>
        <h2>The Soul Friend</h2>
        <p class="lead">A thoughtful space to pause, feel heard and find a way forward. We offer warm,
          confidential counselling support for individuals, families, adolescents, students and
          professionals.</p>
        <div class="hero-actions">
          <a routerLink="/appointment" class="btn">Book an Appointment</a>
          <a routerLink="/services" class="text-link">Explore our services →</a>
        </div>
      </div>
      <img src="anam-cara-board.jpeg" alt="Anam Cara Counselling and Wellness Center">
    </section>

    <section class="section intro-section">
      <div class="section-heading">
        <span class="eyebrow">You do not have to work through everything alone</span>
        <h2>Support for the season you are in</h2>
        <p>People seek counselling for many reasons—relationship strain, difficult decisions,
          academic pressure, workplace stress or simply the feeling that life has become too much.
          You do not need to have everything figured out before reaching out.</p>
      </div>
      <div class="feature-grid">
        <article class="feature">
          <span class="feature-number">01</span>
          <h3>A space to be heard</h3>
          <p>Share what is on your mind at your own pace, without judgement or pressure.</p>
        </article>
        <article class="feature">
          <span class="feature-number">02</span>
          <h3>Clarity and perspective</h3>
          <p>Understand patterns, emotions and choices with calm, structured guidance.</p>
        </article>
        <article class="feature">
          <span class="feature-number">03</span>
          <h3>Practical next steps</h3>
          <p>Develop realistic ways to communicate, cope and move forward with confidence.</p>
        </article>
      </div>
    </section>

    <section class="section soft-section">
      <div class="section-heading">
        <span class="eyebrow">How we can help</span>
        <h2>Counselling for different stages of life</h2>
      </div>
      <div class="cards">
        <article class="card">
          <h3>Family Counselling</h3>
          <p>Support for communication difficulties, parenting concerns, recurring conflict and
            rebuilding understanding within the family.</p>
          <a routerLink="/services" fragment="family-counselling" class="text-link">Learn more →</a>
        </article>
        <article class="card">
          <h3>Career Counselling</h3>
          <p>Guidance for students and adults navigating interests, opportunities, uncertainty and
            important education or career decisions.</p>
          <a routerLink="/services" fragment="career-counselling" class="text-link">Learn more →</a>
        </article>
        <article class="card">
          <h3>Adolescent Counselling</h3>
          <p>An age-appropriate space for young people to talk about emotions, identity, friendships,
            family relationships and academic pressure.</p>
          <a routerLink="/services" fragment="adolescent-counselling" class="text-link">Learn more →</a>
        </article>
        <article class="card">
          <h3>School & Corporate Wellness</h3>
          <p>Context-sensitive wellbeing sessions that encourage healthier communication, stress
            awareness and emotionally supportive environments.</p>
          <div class="card-links">
            <a routerLink="/services" fragment="school-counselling" class="text-link">School support →</a>
            <a routerLink="/services" fragment="corporate-wellness" class="text-link">Corporate support →</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section process-section">
      <div class="section-heading">
        <span class="eyebrow">Getting started</span>
        <h2>A simple path to your first session</h2>
      </div>
      <div class="steps">
        <div class="step"><b>1</b><div><h3>Choose your support</h3><p>Select the service that best matches your present concern.</p></div></div>
        <div class="step"><b>2</b><div><h3>Request a time</h3><p>Choose an available online or in-person appointment slot.</p></div></div>
        <div class="step"><b>3</b><div><h3>Receive confirmation</h3><p>Your appointment is confirmed after the request and payment are verified.</p></div></div>
      </div>
      <div class="centered-action"><a routerLink="/appointment" class="btn">Request Your Session</a></div>
    </section>
  `
})
export class HomeComponent {}
