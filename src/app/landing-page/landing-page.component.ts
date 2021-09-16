import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../services/nuxeo.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
active = 1;
  constructor(private nuxeo: NuxeoService) { }

  ngOnInit(): void {
    this.getFavorites();
  }

  getFavorites() {
    this.nuxeo.nuxeoClient.request('automation/Favorite.Fetch', {context: {}, params: {}}).post()
    .then((response) => {})
    .catch((error) => {});
  }

}
