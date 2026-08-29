import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ContentService, SiteContent } from '../../services/content.service';

@Component({standalone:true, imports:[CommonModule], styles:[`
  .testimonial-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:start}
  .testimonial-card{background:#fff;border:1px solid #eadfc9;border-radius:22px;padding:26px;overflow:hidden;box-shadow:0 10px 24px #00000010}
  .testimonial-card img,.testimonial-card video{display:block;width:100%;height:220px;object-fit:cover;border-radius:16px;margin-bottom:20px;background:#211}
  .testimonial-card blockquote{color:#5a1724;font-size:20px;line-height:1.55;margin:0 0 20px}
  .testimonial-author{display:flex;flex-direction:column;color:#4d6541;margin:0}.testimonial-author span{font-size:14px}
  @media(max-width:600px){.testimonial-grid{grid-template-columns:1fr}.testimonial-card img,.testimonial-card video{height:200px}}
`], template:`
  <section class="page-hero"><span class="eyebrow">Shared experiences</span><h1>Testimonials</h1><p class="lead">Reflections shared by people and organisations we have supported.</p></section>
  <section class="section testimonial-grid" *ngIf="items.length; else empty">
    <article class="testimonial-card" *ngFor="let item of items">
      <img *ngIf="item.mediaType === 'IMAGE'" [src]="media(item)" [alt]="item.name">
      <video *ngIf="item.mediaType === 'VIDEO'" [src]="media(item)" controls preload="metadata"></video>
      <blockquote>“{{ item.testimonial }}”</blockquote>
      <p class="testimonial-author"><strong>{{ item.name }}</strong><span *ngIf="item.company">{{ item.company }}</span></p>
    </article>
  </section>
  <ng-template #empty><section class="section"><div class="card">Testimonials will appear here soon.</div></section></ng-template>
`})
export class TestimonialsComponent implements OnInit {
  items: SiteContent[] = [];
  constructor(private content: ContentService) {}
  ngOnInit() { this.content.all().subscribe({next: items => this.items = items.filter(item => item.contentType === 'TESTIMONIAL')}); }
  media(item: SiteContent) { return this.content.mediaUrl(item.mediaUrl); }
}
