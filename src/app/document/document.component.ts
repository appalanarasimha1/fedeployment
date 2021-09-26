import { Input, Component, Output, EventEmitter, OnInit, OnChanges, Inject } from '@angular/core';
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
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @Output() pageCount: EventEmitter<any> = new EventEmitter();

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
  favourite: boolean;
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

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    public nuxeo: NuxeoService,
    private apiService: ApiService,
    private sharedService: SharedService,
  ) { }

  ngOnInit() {
    this.recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED));
  }

  ngOnChanges(changes: any) {
    this.recentlyViewed = [];
    // this.resetValues();
    if (changes.images) {
      // if(changes.images?.currentValue?.currentPageIndex && changes.images?.currentValue?.currentPageIndex === 0) {
      this.images = changes.images.currentValue;
      // }
      // else if(changes.images?.currentValue?.currentPageIndex > 0) {
      //   this.images.entries.concat(changes.images.currentValue.entries);
      //   this.images.currentPageIndex = changes.images.currentValue.currentPageIndex;
      // }
    }
    if (changes.videos) {
      this.videos = changes.videos.currentValue;
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

  getDataLength(data: any, primaryType: string) {
    if(primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
      if (this.imageSliceInput >= this.images.entries.length) {
        this.hideImageShowMoreBtn = true;
      } else {
        this.hideImageShowMoreBtn = false;
      }
    }
    if(primaryType.toLowerCase() === constants.VIDEO_SMALL_CASE) {
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
      else if(this.imageSliceInput >= this.videos.resultsCount) {
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

  getAssetUrl(url: string): string {
    return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }

  findOriginalUrlFromRenditions(urls: any[]): string {
    if (!urls || !urls.length) {
      return;
    }
    const matchedUrl = urls.find(url => url.name.toLowerCase().includes('original'));
    return this.getAssetUrl(matchedUrl.url);
  }

  findOriginalUrlFromViews(urls: any[]): string {
    if (!urls || !urls.length) {
      return;
    }
    const matchedUrl = urls.find(url => url.title.toLowerCase().includes('original'));
    return this.getAssetUrl(matchedUrl.content.data);
  }

  viewChange(e: any): void {
    if (e.target.value.toLowerCase() === 'list') {
      this.showListView = true;
      return;
    }
    this.showListView = false;

  }

  // added for modal
  open(content, file) {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRendition;
    this.selectedFile = file;
    this.getComments();
    this.favourite = file.contextParameters.favorites.isFavorite;
    this.markRecentlyViewed(file);
    file.contextParameters.renditions.map(item => {
      if (item.url.toLowerCase().includes('original')) {
        fileRendition = item;
      }
    });
    this.selectedFileUrl = this.getAssetUrl(fileRendition.url);
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map(item => {
        if (item.uid === data.uid) {
          found = true;
        }
      });
    }
    if (found) {
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
    let loading = true;
    let error;
    this.favourite = !this.favourite;
    const body = {
      context: {},
      input: this.selectedFile.uid,
      params: {}
    };
    this.apiService.post(apiRoutes.MARK_FAVOURITE, body).subscribe((docs: any) => {
      console.log(docs.entries[0]);
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
    this.nuxeo.nuxeoClient.request(route, { queryParams })
      .get().then((docs) => {
        this.comments = docs.enteries;
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

    // response
    /**
    /* {"entity-type":"comments",
    "totalSize":1,
    "entries":[
      {
        "entity-type":"comment","id":"e343f0bd-75de-4ea3-ad00-3a28acba21e6",
        "parentId":"eef8a0d4-b828-41dc-95bf-a0f310cd6f5e",
        "ancestorIds":["eef8a0d4-b828-41dc-95bf-a0f310cd6f5e"],
        "author":"Administrator",
        "text":"this is a test, need to see how it works",
        "creationDate":"2021-09-17T07:38:32.432Z",
        "modificationDate":"2021-09-17T07:38:32.432Z",
        "entityId":null,
        "origin":null,
        "entity":null,
        "permissions":["Browse","ReadProperties","ReadChildren","ReadLifeCycle","ReviewParticipant",
        "ReadSecurity","WriteProperties","ReadVersion","WriteVersion","Version",
        "Read","AddChildren","RemoveChildren","Remove","ManageWorkflows",
        "WriteLifeCycle","Unlock","ReadRemove","Write","ReadWrite","WriteSecurity",
        "Everything","RestrictedRead","MakeRecord","SetRetention","ManageLegalHold",
        "WriteColdStorage","ReadCanCollect","Comment","Moderate","CanAskForPublishing",
        "DataVisualization"],
        "numberOfReplies":0}
      ]}
    */
  }

  saveComment(comment: string): void {
    const route = apiRoutes.SAVE_COMMENT.replace('[assetId]', this.selectedFile.uid);
    const apiBody = {
      'entity-type': 'comment',
      parentId: this.selectedFile.uid,
      text: comment
    };
    this.apiService.post(route, apiBody).subscribe(response => {
      console.log(response);
    });
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
