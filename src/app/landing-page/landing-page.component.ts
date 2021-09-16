import { Component, OnInit } from '@angular/core';
import { apiRoutes } from '../common/config';
import { NuxeoService } from '../services/nuxeo.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  tasks = [];

  active = 1;
  constructor(private nuxeo: NuxeoService) { }

  ngOnInit(): void {
    this.getFavorites();
    this.getTasks();
  }

  getFavorites() {
    this.nuxeo.nuxeoClient.request(apiRoutes.FAVORITE_FETCH).post({ context: {}, params: {} })
      .then((response) => { })
      .catch((error) => { });
  }

  getTasks() {
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 16, userId: 'Administrator' };
    const headers = { 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_TASKS, { queryParams, headers }).get()
      .then((response) => {
        this.tasks = response.entries;
      }).catch((error) => {
        console.error('error while fetching tasks on landing page = ', error);
        return;
      });
  }

  getCollections() {
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, sortBy: 'dc:modified', sortOrder: 'desc', searchTerm: '%', user: '%currentUser' };
    const headers = { 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_TASKS, { queryParams, headers }).get()
      .then((response) => {
        this.tasks = response.entries;
      }).catch((error) => {
        console.error('error while fetching tasks on landing page = ', error);
        return;
      });
  }

}
