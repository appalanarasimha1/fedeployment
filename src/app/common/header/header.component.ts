import { Component } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(private nuxeo: NuxeoService) { }

  logout() {
    this.nuxeo.logout();
  }
}
