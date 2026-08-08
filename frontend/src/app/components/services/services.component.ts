import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <span class="eyebrow">Our services</span>
      <h1>Support shaped around real-life concerns</h1>
      <p class="lead">Counselling offers time and space to understand what you are experiencing,
        strengthen your resources and make considered choices. Explore the areas in which Anam Cara
        can support you.</p>
    </section>

    <section class="section service-list">
      <article class="service-detail" id="family-counselling">
        <div class="service-index">01</div>
        <div><h2>Family Counselling</h2>
          <p>Families can care deeply for one another and still become caught in patterns of conflict,
            silence or misunderstanding. Counselling provides a structured space to hear different
            perspectives and work towards healthier ways of relating.</p>
          <h3>Areas we can explore</h3>
          <ul><li>Communication gaps and recurring conflict</li><li>Parenting concerns and changing family roles</li>
            <li>Relationship strain and emotional distance</li><li>Adjusting to transitions or stressful events</li></ul>
        </div>
      </article>
      <article class="service-detail" id="career-counselling">
        <div class="service-index">02</div>
        <div><h2>Career Counselling</h2>
          <p>Education and career choices can feel overwhelming when interests, expectations and
            opportunities pull in different directions. Career counselling helps you examine the
            decision with greater clarity and confidence.</p>
          <h3>Areas we can explore</h3>
          <ul><li>Understanding interests, strengths and priorities</li><li>Course and career direction</li>
            <li>Decision-making uncertainty</li><li>Confidence during education or career transitions</li></ul>
        </div>
      </article>
      <article class="service-detail" id="adolescent-counselling">
        <div class="service-index">03</div>
        <div><h2>Adolescent Counselling</h2>
          <p>Adolescence brings rapid emotional, social and academic change. A supportive counselling
            space can help young people express difficult feelings, understand themselves and develop
            healthier ways to handle challenges.</p>
          <h3>Areas we can explore</h3>
          <ul><li>Academic pressure and motivation</li><li>Self-esteem, identity and emotional changes</li>
            <li>Friendships, family relationships and communication</li><li>Stress, worry and coping skills</li></ul>
        </div>
      </article>
      <article class="service-detail" id="school-counselling">
        <div class="service-index">04</div>
        <div><h2>School Counselling</h2>
          <p>Emotionally supportive learning environments help students participate, connect and grow.
            School-focused support can bring together student wellbeing, educator awareness and
            constructive parent communication.</p>
          <h3>Possible areas of support</h3>
          <ul><li>Student wellbeing and awareness sessions</li><li>Academic and peer-related stress</li>
            <li>Parent and teacher guidance</li><li>Age-appropriate emotional wellness programmes</li></ul>
        </div>
      </article>
      <article class="service-detail" id="corporate-wellness">
        <div class="service-index">05</div>
        <div><h2>Corporate Wellness</h2>
          <p>Workplace demands can affect concentration, communication and overall wellbeing.
            Corporate wellness sessions encourage greater awareness of stress and more sustainable
            ways of working and relating.</p>
          <h3>Possible areas of support</h3>
          <ul><li>Stress awareness and management</li><li>Workplace communication and emotional wellbeing</li>
            <li>Balancing professional and personal demands</li><li>Employee wellness sessions</li></ul>
        </div>
      </article>
    </section>

    <section class="section session-note">
      <div><span class="eyebrow">Session options</span><h2>Meet online or in person</h2>
        <p>Choose the format that is practical and comfortable for you. Available dates and
          60-minute time slots are shown while booking.</p></div>
      <a routerLink="/appointment" class="btn">View Available Times</a>
    </section>
  `
})
export class ServicesComponent {}
