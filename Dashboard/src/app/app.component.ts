import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TOKEN } from '../constants/http-constants';
import { MainDashboardComponent } from '../components/main-dashboard/main-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  ngOnInit(): void {
    localStorage.setItem('token', TOKEN);
  }

  
}
