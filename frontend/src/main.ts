import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/components/home/home.component';
import { AboutComponent } from './app/components/about/about.component';
import { ServicesComponent } from './app/components/services/services.component';
import { ContactComponent } from './app/components/contact/contact.component';
import { AppointmentComponent } from './app/components/appointment/appointment.component';
import { AdminComponent } from './app/components/admin/admin.component';
const routes: Routes = [
  {path:'', component: HomeComponent}, {path:'about', component: AboutComponent}, {path:'services', component: ServicesComponent},
  {path:'appointment', component: AppointmentComponent}, {path:'contact', component: ContactComponent},
  {path:'admin', component: AdminComponent}
];
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled'
    })),
    provideHttpClient()
  ]
}).catch(err => console.error(err));
