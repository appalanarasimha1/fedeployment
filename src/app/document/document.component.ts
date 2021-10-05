import { Input, Component, Output, EventEmitter, OnInit, OnChanges, Inject, ViewChild, ElementRef } from '@angular/core';
import { IHeaderSearchCriteria } from '../common/subHeader/interface';
import { constants, localStorageVars } from '../common/constant';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NuxeoService } from '../services/nuxeo.service';
import { apiRoutes } from '../common/config';
import * as moment from 'moment';
import { ApiService } from '../services/api.service';
import { SharedService } from '../services/shared.service';
import { Router } from '@angular/router';
import { NgxMasonryComponent } from 'ngx-masonry';
import { DataService } from '../services/data.service';
@Component({
  selector: 'app-content',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./document.style.css'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './document.template.html'
})
export class DocumentComponent implements OnInit, OnChanges {
  @Input() images: any;
  @Input() videos: any;
  @Input() audio: any;
  @Input() searchTerm: { ecm_fulltext: string };
  // @Input() tagsMetadata: any;
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @Output() pageCount: EventEmitter<any> = new EventEmitter();

  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  @ViewChild('videoPlayer') videoplayer: ElementRef;

  // images = [];
  // videos = [];
  // audio = [];
  docs = [];
  private searchCriteria: IHeaderSearchCriteria = {};
  public display = 1;
  imageSliceInput = 9;
  videoSliceInput = 6;
  hideImageShowMoreBtn = true;
  hideVideoShowMoreBtn = true;
  redirectBaseUrl = environment.redirectBaseUrl;
  showListView = false;
  closeResult = '';
  selectedFile: any; // TODO: add interface, search result entires
  selectedFileUrl: string;
  // favourite: boolean;
  active = 1;
  showShadow = false;
  selectedTab;
  showLoader = false;
  comments = [];
  commentText: string;
  recentlyViewed = [];
  fileSelected = [];
  sortValue = '';
  activeTabs = { comments: false, info: false, timeline: false };
  loading = false;
  public myOptions = {
    gutter: 10,
    // itemSelector: "#fileId",
    // columnWidth: "#fileId",
    // horizontalOrder: true,
    // fitWidth: true,
    percentPosition: true,
    animations: {
    //   show: [
    //   style({opacity: 0}),
    //   animate('400ms ease-in', style({opacity: 1})),
    // ],
    // hide: [
    //   style({opacity: '*'}),
    //   animate('400ms ease-in', style({opacity: 0})),
    // ]
  }
  };
  showRecentlyViewed = true;
  baseUrl = environment.baseUrl;
  tags = [];
  inputTag: string;
  showTagInput = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    public nuxeo: NuxeoService,
    private apiService: ApiService,
    private sharedService: SharedService,
    private router: Router,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED) || '[]');
    this.showRecentlyViewed = true;
    this.dataService.showHideLoader$.subscribe((value) => {
      this.loading = value;
    });
  }

  ngOnChanges(changes: any) {
    this.recentlyViewed = [];
    // console.log('metaDataTags = ', this.tagsMetadata);
    // this.resetValues();
    if (changes.images) {
      // if(changes.images?.currentValue?.currentPageIndex && changes.images?.currentValue?.currentPageIndex === 0) {
      this.images = changes.images.currentValue;
      if (!this.images.length) this.showRecentlyViewed = false;
      // }
      // else if(changes.images?.currentValue?.currentPageIndex > 0) {
      //   this.images.entries.concat(changes.images.currentValue.entries);
      //   this.images.currentPageIndex = changes.images.currentValue.currentPageIndex;
      // }
    }
    if (changes.videos) {
      this.videos = changes.videos.currentValue;
      if (!this.videos.length) this.showRecentlyViewed = false;
    }
    if (changes.audio) {
      this.audio = changes.audio.currentValue;
    }
    // this.resetValues();
    // this.segregateDocuments(changes.documents.currentValue);
    if (this.imageSliceInput >= this.images.entries.length) {
      this.hideImageShowMoreBtn = true;
    } else {
      this.hideImageShowMoreBtn = false;
    }
    if (this.videoSliceInput >= this.videos.entries.length) {
      this.hideVideoShowMoreBtn = true;
    } else {
      this.hideVideoShowMoreBtn = false;
    }

    return;
  }

  calculateNoResultScreen() {
    return !this.loading && this.showRecentlyViewed && !this.recentlyViewed.length && !this.videos.entries.length && !this.images.entries.length && !this.docs.length;
  }

  getDataLength(data: any, primaryType: string) {
    if (primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
      if (this.imageSliceInput >= this.images.entries.length) {
        this.hideImageShowMoreBtn = true;
      } else {
        this.hideImageShowMoreBtn = false;
      }
    }
    if (primaryType.toLowerCase() === constants.VIDEO_SMALL_CASE) {
      if (this.videoSliceInput >= this.videos.entries.length) {
        this.hideVideoShowMoreBtn = true;
      } else {
        this.hideVideoShowMoreBtn = false;
      }
    }
    return data.length;
  }

  resetValues() {
    this.images = [];
    this.videos = [];
    this.audio = [];
    this.docs = [];
    return;
  }

  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
    if (event.target.checked) {
      // if (isRecent) {
      // file['isChecked'] = true;
      // } else {
      //   file['isChecked'] = true;
      // }
      this.fileSelected.push(file);
    } else {
      if (this.fileSelected.length) {
        let i = -1;
        // if (isRecent) {
        // file['isChecked'] = false;
        // } else {
        //   file['isChecked'] = false;
        // }
        this.fileSelected.map((item, ind) => {
          if (item.uid === file.uid) {
            i = ind;
          }
        });
        if (i !== -1) {
          this.fileSelected.splice(i, 1); // remove the file from selected files
        }
      }
    }
  }

  clearSelected() {
    const dataToIterate = !this.images.length ? this.recentlyViewed : this.images;
    for (let i = 0; i < this.fileSelected.length; i++) {
      for (let j = 0; j < dataToIterate.length; j++) {
        if (dataToIterate[j].uid === this.fileSelected[i].uid) {
          dataToIterate[j]['isSelected'] = false;
        }
      }
    }
    this.fileSelected = [];
    return;
  }

  segregateDocuments(documents: any[]): void {
    documents.map(item => {
      item['isSelected'] = false;
      switch (item.type.toLowerCase()) {
        case constants.AUDIO_SMALL_CASE:
          this.audio.push(item);
          break;
        case constants.PICTURE_SMALL_CASE:
          this.images.push(item);
          break;
        case constants.VIDEO_SMALL_CASE:
          this.videos.push(item);
          break;
        default:
          this.docs.push(item);
      }
    });
  }

  dropdownMenu(event: any): void {
    const sortBy = event.target.value;
    if (sortBy) {
      this.searchCriteria['sortBy'] = sortBy;
      this.searchCriteria['sortOrder'] = 'desc';
    } else {
      delete this.searchCriteria['sortBy'];
      delete this.searchCriteria['sortOrder']
    }
    this.emitData(this.searchCriteria);
  }

  showMore(docType: string) {

    if (docType === constants.IMAGE_SMALL_CASE) {
      this.imageSliceInput += 9;

      if (this.imageSliceInput >= this.images.entries.length) {
        this.pageCount.emit({ pageNumber: ++this.images.currentPageIndex, primaryType: 'Picture' });
        this.hideImageShowMoreBtn = true;
      }
      else if (this.imageSliceInput >= this.images.resultsCount) {
        this.hideImageShowMoreBtn = false;
      }
      return;
    }

    if (docType === constants.VIDEO_SMALL_CASE) {
      this.videoSliceInput += 9;
      if (this.videoSliceInput >= this.videos.entries.length) {
        this.pageCount.emit({ pageNumber: ++this.videos.currentPageIndex, primaryType: 'Video' });
        this.hideVideoShowMoreBtn = false;
      }
      else if (this.imageSliceInput >= this.videos.resultsCount) {
        this.hideVideoShowMoreBtn = true;
      }
      return;
    }
  }

  emitData(data: IHeaderSearchCriteria): void {
    this.searchTextOutput.emit(data);
    return;
  }

  changeDisplay(mode: number): void {
    this.display = mode;
  }

  getAssetUrl(event: any, url: string): string {
    if (!event) {
      return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
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
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'
        console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   
        //   this.router.navigate(['login']);
        // }

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }

  completeLoadingMasonry(event: any) {
    this.masonry.layout();
  }

  findOriginalUrlFromRenditions(event: any, urls: any[]): string {
    if (!urls || !urls.length) {
      return;
    }
    const matchedUrl = urls.find(url => url.name.toLowerCase().includes('original'));
    return this.getAssetUrl(null, matchedUrl.content.name);
  }

  findOriginalUrlFromViews(urls: any[]): string {
    if (!urls || !urls.length) {
      return;
    }
    const matchedUrl = urls.find(url => url.title.toLowerCase().includes('original'));
    return this.getAssetUrl(null, matchedUrl.content.data);
  }


  viewChange(e: any): void {
    if (e.target.value.toLowerCase() === 'list') {
      this.showListView = true;
      return;
    }
    this.showListView = false;

  }

  // added for modal
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
      this.markRecentlyViewed(file);

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
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  getTags() {
    this.tags = this.selectedFile.contextParameters["tags"]?.map(tag => tag) || [];
  }

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
      this.inputTag = "";
    });
  }

  video(event: any) {
    console.log('im Play!');
    event.toElement.play();
  }

  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed[index] = data;
        }
      });
    }
    if (found) {
      localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
      return;
    }

    data['isSelected'] = false;
    recentlyViewed.push(data);
    localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
    return;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openInfo(tabName: string) {
    if (!this.showShadow || this.selectedTab === tabName) {
      this.showShadow = !this.showShadow;
    }
    this.selectedTab = tabName;
    this.activeTabs[tabName] = this.showShadow;
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
        this.markRecentlyViewed(data);
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
        this.markRecentlyViewed(data);
      }
      loading = false;
    });
  }

  getDownloadFileEstimation(data: any) {
    return `${(data / 1024) > 1024 ? ((data / 1024) / 1024).toFixed(2) + ' MB' : (data / 1024).toFixed(2) + ' KB'}`;
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

  // saveComment(comment: string): void {
  //   if(!comment.trim()) {
  //     return;
  //   }
  //   let error;
  //   const route = apiRoutes.SAVE_COMMENT.replace('[assetId]', this.selectedFile.uid);
  //   const postData = {
  //     'entity-type': 'comment',
  //     parentId: this.selectedFile.uid,
  //     text: comment
  //   };
  //   this.nuxeo.nuxeoClient.request(route).post({ body: postData }).then((doc) => {
  //     this.commentText = '';
  //     this.comments.unshift(doc);
  //     this.loading = false;
  //   }).catch((err) => {
  //     console.log('search document error = ', err);
  //     error = `${error}. `;
  //     if (error && error.message) {
  //       if (error.message.toLowerCase() === 'unauthorized') {
  //         this.sharedService.redirectToLogin();
  //       }
  //     }
  //     this.loading = false;
  //   });
  // }

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
    if (!fromDate) { //NOTE: when in development phase, for the notifications which did not have createdOn field
      return showHours ? `yesterday` : `1 day`;
    }
    const today = toDate ? toDate : moment();

    const daysDifference = moment(today).diff(moment(fromDate), 'days');
    if (daysDifference === 0) {
      let output = `${this.getDoubleDigit(new Date(fromDate).getUTCHours() + 3)}:${this.getDoubleDigit(new Date(fromDate).getUTCMinutes())}`;
      if (!showHours) {
        output = `${moment(today).diff(moment(fromDate), 'hours')} hours`;
      }
      return output;
    } else if (daysDifference === 1) {
      return showHours ? 'yesterday' : `1 day`;
    } else {
      return showHours ? `${daysDifference} days ago` : `${daysDifference} days`;
    }
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

  toDateString(date: string): string {
    return `${new Date(date).toDateString()}`;
  }

  getNames(users: any) {
    let result = '';
    users.map(user => {
      result += user.id + ', ';
    });
    return result;
  }

  clearRecentlyViewed() {
    localStorage.removeItem(localStorageVars.RECENTLY_VIEWED);
    this.recentlyViewed = [];
    return;
  }

  // activeClass(tabName: string): void {
  //   switch (tabName) {
  //     case 'timeLine':
  //       this.activeTabs.timeLine = true;
  //       this.activeTabs.info = false;
  //       this.activeTabs.comments = false;
  //       break;

  //     case 'comments':
  //       this.activeTabs.timeLine = false;
  //       this.activeTabs.info = false;
  //       this.activeTabs.comments = true;
  //       break;

  //     case 'info':
  //       this.activeTabs.timeLine = false;
  //       this.activeTabs.info = true;
  //       this.activeTabs.comments = false;
  //       break;
  //   }
  // }
}
