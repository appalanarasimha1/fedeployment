import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { apiRoutes } from '../common/config';
import { constants, localStorageVars } from '../common/constant';
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
  favourites = [];
  active = 1;
  loading = false;
  // baseUrl = environment.baseUrl;
  showShadow = false;
  activeTabs = { comments: false, info: false, timeline: false };
  selectedFile: any; // TODO: add interface, search result entires
  selectedFileUrl: string;
  showTagInput = false;
  tags = [];
  comments = [];
  inputTag: string;
  selectedTab;
  commentText: string;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private apiService: ApiService,
    private modalService: NgbModal) { }

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
    this.recentlyViewed = JSON.parse(localStorage.getItem('Administrator-default-nuxeo-recent-documents') || '[]');
    // this.getUserProfile();
  }

  // getFavorites() {
  //   this.nuxeo.nuxeoClient.request(apiRoutes.FAVORITE_FETCH).post({ body: { context: {}, params: {} } })
  //     .then((response) => {
  //       if(response) this.getFavouriteCollection(response.uid);

  //       setTimeout(() => {
  //         this.loading = false;
  //       }, 0);
  //     })
  //     .catch((error) => {
  //       this.loading = false;
  //       if (error && error.message) {
  //         if (error.message.toLowerCase() === 'unauthorized') {
  //           this.sharedService.redirectToLogin();
  //         }
  //       }
  //       return;
  //     });
  // }

  getFavorites() {
    try {
    this.apiService.post(apiRoutes.FAVORITE_FETCH, { context: {}, params: {} })
      .subscribe((response: any) => {
        if(response) this.getFavouriteCollection(response.uid);

        setTimeout(() => {
          this.loading = false;
        }, 0);
      });
    } catch(error) {
        this.loading = false;
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        return;
      }
  }

  getFavouriteCollection(favouriteUid: string) {
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 16, queryParams: favouriteUid };
    const headers = { 'enrichers-document': ['thumbnail', 'renditions', 'favorites', 'tags'], 'fetch.document': 'properties', properties: '*' };
    this.nuxeo.nuxeoClient.request(apiRoutes.GET_FAVOURITE_COLLECTION, { queryParams, headers}).get()
      .then((response) => {
        if(response) this.favourites = response?.entries;
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
    const headers = { 'enrichers-document': ['thumbnail', 'renditions', 'favorites', 'tags'], 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
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
    const headers = { 'enrichers-document': ['thumbnail', 'renditions', 'favorites'], 'fetch-task': 'targetDocumentIds,actors', properties: 'dublincore,common,file,uid' };
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
    const queryParams = { currentPageIndex: 0, offset: 10, pageSize: 16, queryParams: '/', system_primaryType_agg: `["Picture"]` };
    const headers = { 'enrichers-document': ['thumbnail', 'renditions', 'favorites', 'tags'], 'fetch.document': 'properties', properties: '*', 'fetch-task': 'actors' };
    this.nuxeo.nuxeoClient.request(apiRoutes.FETCH_RECENT_EDITED, { queryParams, headers }).get()
      .then((response) => {
        this.recentEdited = response.entries.filter(entry => entry.type.toLowerCase() === constants.PICTURE_SMALL_CASE);
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

  getAssetUrl(event: any, url: string) {
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);
      })
      .catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'
        console.log(e);
      });
  }

  open(content, file, fileType: string): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRenditionUrl;
    this.selectedFile = file;
    if(fileType === 'image') {
      this.getComments();
      this.getTags();
      this.sharedService.markRecentlyViewed(file);

      file.contextParameters.renditions.map(item => {
        if (item.url.toLowerCase().includes('original')) {
          fileRenditionUrl = item.url;
        }
      });
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if(fileType === 'video') {
      fileRenditionUrl = file.properties['file:content'].data;
    }
    this.selectedFileUrl = this.getAssetUrl(null, fileRenditionUrl);
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      // this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.showTagInput = false;
      // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  getComments() {
    let loading = true;
    let error;
    const queryParams = { pageSize: 10, currentPageIndex: 0 };
    const route = apiRoutes.FETCH_COMMENTS.replace('[assetId]', this.selectedFile.uid);
    this.nuxeo.nuxeoClient.request(route, { queryParams, headers: { 'enrichers.user': 'userprofile' } })
      .get().then((docs) => {
        this.comments = docs.entries;
        loading = false;
      }).catch((err) => {
        console.log('search document error = ', err);
        error = `${error}. `;
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        loading = false;
      });
  }

  getTags() {
    this.tags = this.selectedFile.contextParameters["tags"]?.map(tag => tag) || [];
  }

  // markRecentlyViewed(data: any) {
  //   let found = false;
  //   // tslint:disable-next-line:prefer-const
  //   let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
  //   if (recentlyViewed.length) {
  //     recentlyViewed.map((item: any, index: number) => {
  //       if (item.uid === data.uid) {
  //         found = true;
  //         recentlyViewed[index] = data;
  //       }
  //     });
  //   }
  //   if (found) {
  //     localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
  //     return;
  //   }

  //   data['isSelected'] = false;
  //   recentlyViewed.push(data);
  //   localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
  //   return;
  // }

  addTag(inputTag: string): void {
    if (!inputTag) return;
    const route = apiRoutes.ADD_TAG;
    const apiBody = {
      input: this.selectedFile.uid,
      params: {
        tags: inputTag
      }
    };
    this.apiService.post(route, apiBody).subscribe(response => {
      this.tags.push(inputTag);
      this.selectedFile.contextParameters["tags"].push(inputTag);
      this.inputTag = "";
    });
  }

  openInfo(tabName: string) {
    if (!this.showShadow || this.selectedTab === tabName) {
      this.showShadow = !this.showShadow;
    }
    this.selectedTab = tabName;
    this.activeTabs[tabName] = this.showShadow;
  }

  getDownloadFileEstimation(data: any) {
    return `${(data / 1024) > 1024 ? ((data / 1024) / 1024).toFixed(2) + ' MB' : (data / 1024).toFixed(2) + ' KB'}`;
  }

  getNames(users: any) {
    let result = '';
    users.map(user => {
      result += user.id + ', ';
    });
    return result;
  }

  toDateString(date: string): string {
    return `${new Date(date).toDateString()}`;
  }

  saveComment(comment: string): void {
    if(!comment.trim()) {
      return;
    }
    let error;
    const route = apiRoutes.SAVE_COMMENT.replace('[assetId]', this.selectedFile.uid);
    const postData = {
      'entity-type': 'comment',
      parentId: this.selectedFile.uid,
      text: comment
    };
    try{
    this.apiService.post(route, postData)
    .subscribe((doc) => {
      this.commentText = '';
      this.comments.unshift(doc);
      this.loading = false;
    });
  } catch(err) {
      console.log('search document error = ', err);
      error = `${error}. `;
      if (error && error.message) {
        if (error.message.toLowerCase() === 'unauthorized') {
          this.sharedService.redirectToLogin();
        }
      }
      this.loading = false;
    }
  }

  getTime(fromDate: Date, showHours: boolean, toDate?: Date) {
    return this.sharedService.returnDaysAgoFromTodayDate(fromDate, showHours, toDate);
  }

  getDoubleDigit(value: number) {
    if (value < 10) {
      return '0' + value;
    }
    return value;
  }

  getEventString(event: string): string {
    let result = event;
    switch (event) {
      case 'download':
        result = 'downloaded';
        break;
      case 'documentCreated':
        result = 'created document';
        break;
    }
    return result;
  }

  markFavourite(data, favouriteValue) {
    // this.favourite = !this.favourite;
    if(data.contextParameters.favorites.isFavorite) {
      this.unmarkFavourite(data, favouriteValue);
      return;
    }
    const body = {
      context: {},
      input: data.uid,
      params: {}
    };
    let loading = true;
    this.apiService.post(apiRoutes.MARK_FAVOURITE, body).subscribe((docs: any) => {
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
        this.sharedService.markRecentlyViewed(data);
      }
      loading = false;
    });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {}
    };
    let loading = true;
    this.apiService.post(apiRoutes.UNMARK_FAVOURITE, body).subscribe((docs: any) => {
      // data.contextParameters.favorites.isFavorite = this.favourite;
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
        this.sharedService.markRecentlyViewed(data);
      }
      loading = false;
    });
  }

  dateFormat(dateString: string): string {
    const date = new Date(dateString);
    return `${date.toDateString()} at ${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}: ${date.getMinutes()} ${date.getHours() > 12 ? 'PM' : 'AM'} `;
  }

  titleCaseSplit(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

}
