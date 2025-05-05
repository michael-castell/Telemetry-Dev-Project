import { Routes } from '@angular/router';
import { MainDashboardComponent } from '../components/main-dashboard/main-dashboard.component';

export const routes: Routes = [
    {path: 'game-report', component: MainDashboardComponent},
    {path: '**', redirectTo: '/game-report'},
];
