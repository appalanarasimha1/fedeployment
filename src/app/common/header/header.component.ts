import { Component, Output, EventEmitter } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() sendSelectedTab: EventEmitter<any> = new EventEmitter();

  selectedTab: string;

  constructor(private nuxeo: NuxeoService) { }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.sendSelectedTab.emit(tab);
    return;
  }

  logout() {
    this.nuxeo.logout();
  }
}
