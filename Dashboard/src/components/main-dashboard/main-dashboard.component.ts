import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GAMES_URL, SEASON_URL, TOKEN } from '../../constants/http-constants';
import { MatInputModule } from '@angular/material/input';
import * as XLSX from 'xlsx';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [MatSelectModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatTableModule, RouterModule],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.css',
  providers: [HttpClientModule, HttpService]
})
export class MainDashboardComponent implements OnInit {
  filtersForm = new FormGroup({
    team: new FormControl(''),
    season: new FormControl('', Validators.required),
    week: new FormControl(''),
    games: new FormControl([])
  });

  displayedColumns: string[] = ['play_id', 'offense', 'defense', 'yardline', 'yards_to_go', 'down'];
  dataSource: gameData[] = [];
  teams: any = [];
  data: any = {};
  weeks: any = [];
  loading: boolean = false;
  opponent: string = '';
  team: string = '';
  game_id: string = '';
  canExport: boolean = true;
  fullData: Object = {};
  gameReports: boolean = true;
  player_id: string = '';
  play_id: string = '';
  playerData: any = [];

  constructor(private http: HttpClient) {

  }

  ngOnInit(): void {
  }

  getGamesBySeason(season: string) {
    const url = SEASON_URL;
    const body = { "season": season };
    const headers = { "Authorization": `Bearer ${TOKEN}` };
    this.loading = true;
    this.http.get(url, { headers: headers, params: body }).subscribe((data) => {
      if (data) {
        this.teams = Object.values(data).map((team: any) => {
          return { name: team.team };
        });
        this.data = data;
        console.log(this.data);
      } else {
        alert('No teams found for this season. Please try another year.');
      }
      this.loading = false;
    })
  }

  getGamesByGame(game: string) {
    const url = GAMES_URL;
    const body = { "game_id": game };
    const headers = { "Authorization": `Bearer ${TOKEN}` };
    this.loading = true;
    this.http.get(url, { headers: headers, params: body }).subscribe((data) => {
      console.log(data);
      this.fullData = data;
      this.dataSource = Object.values(data).map((row) => {
        return {
          play_id: row.play_id,
          offense: row.offense,
          defense: row.defense,
          yardline: row.yardline,
          yards_to_go: row.yards_to_go,
          down: row.down
        };
      })
      this.canExport = false;
      this.loading = false;
    })
  }

  onGameIDChange($event: any) {
    this.game_id = $event.target.value;
  }

  onPlayerIDChange($event: any) {
    this.player_id = $event.target.value;
  }

  onPlayIDChange($event: any) {
    this.play_id = $event.target.value;
  }

  getPlayerStatsByGameAndID() {
    this.playerData = [];
    if (this.game_id !== '') {
      const url = GAMES_URL;
      const body = { "game_id": this.game_id };
      const headers = { "Authorization": `Bearer ${TOKEN}` };
      this.loading = true;
      this.http.get(url, { headers: headers, params: body }).subscribe((data) => {
        if (this.player_id !== '' && this.play_id !== '') {
          this.playerData.push(this.recursiveSearch(data, 'player_id', this.player_id));
        } else if (this.play_id !== '') {
          this.playerData = Object.values(data).find((row: any) => row.play_id === Number(this.play_id));
        } else if (this.player_id !== '') {
          for (let row of Object.values(data)) {
            let result = this.recursiveSearch(row, 'player_id', this.player_id);
            if (result !== undefined) {
              this.playerData.push(row);
            }
          }
        } else {
          this.playerData.push(data);
        }
        console.log(this.playerData);
        this.loading = false;
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(JSON.parse(JSON.stringify(Object(this.playerData))));
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, `${this.game_id}.xlsx`);
      });
    } else {
      alert('Game ID is required to fetch player stats.');
    }
  }

  onYearChange($event: any) {
    this.getGamesBySeason($event.target.value);
  }

  onTeamChange($event: any) {
    this.team = $event.target.innerText;
    const teamObject = Object.values(this.data).find((t: any) => t.team === this.team);
    this.weeks = Object(teamObject).games.map((game: any) => {
      return { week: game.home_team === this.team ? game.visitor_team : game.home_team, game_id: game.game_id };
    });
  }

  onOpponentChange($event: any) {
    this.opponent = $event.target.innerText;
    this.game_id = Object(Object.values(this.weeks).find((w: any) => w.week === this.opponent)).game_id;
    console.log(this.game_id, this.opponent);
    this.getGamesByGame(this.game_id);
  }

  onSubmitPlayer() {
    this.getPlayerStatsByGameAndID();
  }

  onSubmit() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(JSON.parse(JSON.stringify(this.fullData)));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${this.team}-${this.opponent}-${this.game_id}.xlsx`);
  }

  toggleReports() {
    this.gameReports = !this.gameReports;
  }

  recursiveSearch(obj: any, keyToFind: string, valueToFind: any): Object | undefined {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }

    if (obj.hasOwnProperty(keyToFind) && obj[keyToFind] === valueToFind) {
      return obj;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = this.recursiveSearch(obj[key], keyToFind, valueToFind);
        if (result) {
          return result;
        }
      }
    }
    return undefined;
  }
}

export interface gameData {
  play_id: string;
  offense: string;
  defense: string;
  yardline: string;
  yards_to_go: string;
  down: string;
}
