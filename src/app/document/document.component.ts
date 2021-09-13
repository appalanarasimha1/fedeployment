import { Input, Component, Output, EventEmitter, OnInit, OnChanges, Inject } from '@angular/core';
import { IHeaderSearchCriteria } from '../common/subHeader/interface';
import { constants } from '../common/constant';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-content',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./document.style.css'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './document.template.html'
})
export class DocumentComponent implements OnInit, OnChanges {
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

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnChanges(changes: any) {
    if (changes.documents.currentValue && changes.documents.currentValue.length) {
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
}
