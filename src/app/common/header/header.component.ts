import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { NuxeoService } from '../../services/nuxeo.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() sendSelectedTab: EventEmitter<any> = new EventEmitter();

  selectedTab: string;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router
  ) { }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.sendSelectedTab.emit(tab);
    if (tab === 'search') {
      this.router.navigate(['search']);
    }
  }

  logout() {
    this.nuxeo.logout();
  }
}
