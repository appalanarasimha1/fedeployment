import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { apiRoutes } from '../common/config';
import { ApiService } from '../services/api.service';
import { NuxeoService } from '../services/nuxeo.service';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  tasks = [];
  collections = [];
  recentEdited = [];
  recentlyViewed = [];
  active = 1;
  loading = false;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private apiService: ApiService) { }

  ngOnInit(): void {
    if (!this.nuxeo.nuxeoClient || !localStorage.getItem('token')) {
      this.sharedService.redirectToLogin();
      return;
    }
    this.loading = true;
    this.getFavorites();
    this.getTasks();
    this.getCollections();
    this.getEdited();
    this.recentlyViewed = JSON.parse(localStorage.getItem('Administrator-default-nuxeo-recent-documents'));
    // this.getUserProfile();
  }

  getFavorites() {
    this.nuxeo.nuxeoClient.request(apiRoutes.FAVORITE_FETCH).post({ body: { context: {}, params: {} } })
      .then((response) => {
        setTimeout(() => {
          this.loading = false;
        }, 0);
      })
      .catch((error) => {
        this.loading = false;
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      });
  }

  getTasks() {
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 16, userId: 'Administrator' };
    const headers = { 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_TASKS, { queryParams, headers }).get()
      .then((response) => {
        this.tasks = response.entries;
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }).catch((error) => {
        this.loading = false;
        console.error('error while fetching tasks on landing page = ', error);
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      });
  }

  getCollections() {
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, sortBy: 'dc:modified', sortOrder: 'desc', searchTerm: '%', user: '%currentUser' };
    const headers = { 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_COLLECTIONS, { queryParams, headers }).get()
      .then((response) => {
        this.collections = response.entries;
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }).catch((error) => {
        this.loading = false;
        console.error('error while fetching collections on landing page = ', error);
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      });
  }

  getEdited() {
    const queryParams = { currentPageIndex: 0, offset: 10, pageSize: 16, queryParams: '/' };
    const headers = { 'enrichers-document': ['thumbnail'], 'fetch-task': 'actors' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_RECENT_EDITED, { queryParams, headers }).get()
      .then((response) => {
        this.recentEdited = response.entries;
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }).catch((error) => {
        this.loading = false;
        console.error('error while fetching recent edited on landing page = ', error);
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      });
  }

  getUserProfile() {
    const queryParams = {};
    const headers = { 'enrichers-document': ['thumbnail'], 'enrichers.user': 'userprofile' };
    this.nuxeo.nuxeoClient.request(apiRoutes.USER_PROFILE, { queryParams, headers }).get()
      .then((response) => {
        localStorage.setItem('user', response);
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }).catch((error) => {
        this.loading = false;
        console.error('error while fetching recent edited on landing page = ', error);
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      });
  }

  getAssetUrl(url: string) {

    return `https://tomcat-groundx.neom.com:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // let result = '';
    // const src = `https://tomcat-groundx.neom.com:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // const options = {
    //   headers: {
    //     'Access-Control-Allow-Origin': '*',
    //     'Access-Control-Allow-Methods': 'PUT,DELETE,POST,GET,OPTIONS',
    //     // 'enrichers.document': 'thumbnail,permissions,preview',
    //     Cookie: 'X-Authentication-Token=' + localStorage.getItem('token'),
    //     // properties: '*',
    //     // 'CSRF-Token': 'defaults'
    //   }
    // };

    // fetch(src, options)
    //   .then(res => res.blob())
    //   .then(blob => {
    //     result = URL.createObjectURL(blob);
    //   });

    // return `https://tomcat-groundx.neom.com:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // this.apiService.get(src, options).subscribe(res => {
    //   const blob = res.blob();
    //   result = URL.createObjectURL(blob);
    // });
  }

  dateFormat(dateString: string): string {
    const date = new Date(dateString);
    return `${date.toDateString()} at ${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}: ${date.getMinutes()} ${date.getHours() > 12 ? 'PM' : 'AM'} `;
  }

  titleCaseSplit(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

}
