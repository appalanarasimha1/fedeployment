import { Input, Component, Output, EventEmitter, OnInit, OnChanges, Inject } from '@angular/core';
import { IHeaderSearchCriteria } from '../common/subHeader/interface';
import { constants, localStorageVars } from '../common/constant';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NuxeoService } from '../services/nuxeo.service';
import { apiRoutes } from '../common/config';
import * as moment from 'moment';



@Component({
  selector: 'app-content',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./document.style.css'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './document.template.html'
})
export class DocumentComponent implements OnChanges {
  @Input() documents: object[] = [];
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  images = [];
  videos = [];
  audio = [];
  docs = [];
  private searchCriteria: IHeaderSearchCriteria = {};
  public display = 1;
  imageSliceInput = 9;
  videoSliceInput = 5;
  hideImageShowMoreBtn = true;
  hideVideoShowMoreBtn = true;
  baseUrl = environment.baseUrl;
  showListView = false;
  closeResult = '';
  selectedFile: any; // TODO: add interface, search result entires
  selectedFileUrl: string;
  favourite: boolean;
  active = 1;
  showShadow = true;
  selectedTab;
  showLoader = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    public nuxeo: NuxeoService
  ) { }

  ngOnChanges(changes: any) {
    if (changes.documents.currentValue && changes.documents.currentValue.length) {
      this.showLoader = false;
      this.resetValues();
      this.segregateDocuments(changes.documents.currentValue);
      if (this.imageSliceInput >= this.images.length) {
        this.hideImageShowMoreBtn = true;
      } else {
        this.hideImageShowMoreBtn = false;
      }
      if (this.videoSliceInput >= this.videos.length) {
        this.hideVideoShowMoreBtn = true;
      } else {
        this.hideVideoShowMoreBtn = false;
      }
    }
    return;
  }

  resetValues() {
    this.images = [];
    this.videos = [];
    this.audio = [];
    this.docs = [];
    return;
  }

  segregateDocuments(documents: any[]): void {
    documents.map(item => {
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
      this.searchCriteria['sortOrder'] = 'asc';
    } else {
      delete this.searchCriteria['sortBy'];
      delete this.searchCriteria['sortOrder']
    }
    this.emitData(this.searchCriteria);
  }

  showMore(docType: string) {
    if (docType === constants.IMAGE_SMALL_CASE) {
      this.imageSliceInput += 9;
      if (this.imageSliceInput >= this.images.length) {
        this.hideImageShowMoreBtn = true;
      }
      return;
    }

    if (docType === constants.VIDEO_SMALL_CASE) {
      this.videoSliceInput += 9;
      if (this.videoSliceInput >= this.videos.length) {
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

  viewChange(e: any): void {
    if (e.target.value.toLowerCase() === 'list') {
      this.showListView = true;
      return;
    }
    this.showListView = false;

  }

  // added for modal
  open(content, file) {
    let fileRendition;
    this.selectedFile = file;
    this.getComments();
    this.favourite = file.contextParameters.favorites.isFavorite;
    this.markRecentlyViewed(file);
    file.properties['picture:views'].map(item => {
      if (item.title.toLowerCase().includes('original')) {
        fileRendition = item;
      }
    });
    this.selectedFileUrl = this.getAssetUrl(fileRendition.content.data);
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

  openInfo(data: string) {
    if (this.showShadow || this.selectedTab === data) {
      this.showShadow = !this.showShadow;
    }
    this.selectedTab = data;
  }

  markFavourite(data, favouriteValue) {
    let loading = true;
    let error;
    this.favourite = !this.favourite;
    this.nuxeo.nuxeoClient.request(apiRoutes.MARK_FAVOURITE, { body: { context: 'hello' } })
      .post().then((docs) => {
        console.log(docs.entries[0]);
        loading = false;
      }).catch((err) => {
        console.log('search document error = ', err);
        error = `${error}. `;
        loading = false;
      });
  }

  getDownloadFileEstimation(data: any) {
    return `${(data / 1024) > 1024 ? ((data / 1024) / 1024).toFixed(2) + ' MB' : (data / 1024).toFixed(2) + ' KB'}`;
  }

  getComments() {
    let loading = true;
    let error;
    const queryParams = {pageSize: 10, currentPageIndex: 0};
    const route = apiRoutes.FETCH_COMMENTS.replace('[assetId]', this.selectedFile.uid);
    this.nuxeo.nuxeoClient.request(route, { queryParams })
      .get().then((docs) => {
        console.log(docs.entries[0]);
        loading = false;
      }).catch((err) => {
        console.log('search document error = ', err);
        error = `${error}. `;
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

  getTime(fromDate: Date, showHours: boolean, toDate?: Date) {
    if (!fromDate) { //NOTE: when in development phase, for the notifications which did not have createdOn field
      return showHours ? `yesterday` : `1 day`;
    }
    const today = toDate ? toDate : moment();

    const daysDifference = moment(today).diff(moment(fromDate), 'days');
    if (daysDifference === 0 ) {
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
}
