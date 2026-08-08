import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <span class="eyebrow">About Anam Cara</span>
      <h1>A compassionate companion for your journey</h1>
      <p class="lead">“Anam Cara” means “soul friend”—someone with whom you can speak honestly and
        feel accepted. That spirit shapes the way we listen, understand and support each person.</p>
    </section>

    <section class="section two-column">
      <div>
        <span class="eyebrow">Our purpose</span>
        <h2>Care that sees the whole person</h2>
      </div>
      <div class="prose">
        <p>Anam Cara Counselling and Wellness Center supports emotional wellness, self-understanding
          and personal growth. We recognise that every person brings a different history, set of
          relationships and way of experiencing the world.</p>
        <p>Rather than offering quick answers, counselling creates room to explore what is happening,
          recognise helpful and unhelpful patterns, and identify choices that feel meaningful and
          manageable. The work is collaborative, respectful and guided by your needs.</p>
      </div>
    </section>

    <section class="section soft-section">
      <div class="profile-card">
        <div class="profile-mark">MS</div>
        <div>
          <span class="eyebrow">Counsellor</span>
          <h2>Dr. Malini S</h2>
          <p class="credentials">BDS., M.A., B.Ed., P.G. Diploma in Counselling and Psychotherapy</p>
          <p>Dr. Malini offers a calm and considerate setting in which clients can speak openly,
            reflect on their experiences and work towards greater clarity. Her approach centres on
            attentive listening, respect for the individual and practical support suited to the
            client’s circumstances.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <span class="eyebrow">What matters to us</span>
        <h2>Principles that guide every conversation</h2>
      </div>
      <div class="cards values-grid">
        <article class="card"><h3>Respect</h3><p>Your experiences, beliefs, boundaries and pace are treated with care.</p></article>
        <article class="card"><h3>Confidentiality</h3><p>Sessions are approached with discretion so that honest conversations can take place.</p></article>
        <article class="card"><h3>Empathy</h3><p>We seek to understand your experience with care, sensitivity and genuine attention.</p></article>
        <article class="card"><h3>Collaboration</h3><p>Counselling is something we work through together, with goals shaped around you.</p></article>
        <article class="card"><h3>Non-Judgemental</h3><p>You can speak openly in a supportive space where your experiences are received without criticism, labels or assumptions.</p></article>
      </div>
    </section>

    <section class="section callout">
      <div><span class="eyebrow">Ready to begin?</span><h2>Take the first step when it feels right.</h2>
        <p>You can request an online or in-person session through our appointment page.</p></div>
      <a routerLink="/appointment" class="btn">Book an Appointment</a>
    </section>
  `
})
export class AboutComponent {}
