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
import { PreviewPopupComponent } from '../preview-popup/preview-popup.component';


@Component({
  selector: 'app-content',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./document.style.css'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './document.template.html'
})
export class DocumentComponent implements OnInit, OnChanges {
  @Input() documents: any;
  @Input() searchTerm: { ecm_fulltext: string };
  @Input() filters: any;
  // @Input() tagsMetadata: any;
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @Output() pageCount: EventEmitter<any> = new EventEmitter();
  @Output() selectDocType: EventEmitter<any> = new EventEmitter();
  @Output() openFilterModal: EventEmitter<any> = new EventEmitter();
  @Output() resetFilterOuput: EventEmitter<any> = new EventEmitter();

  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  @ViewChild('videoPlayer') videoplayer: ElementRef;
  @ViewChild('previewModal') previewModal: PreviewPopupComponent;

  docs = [];
  private searchCriteria: IHeaderSearchCriteria = {};
  public display = 1;
  docSliceInput = 9;
  hideShowMoreBtn = true;
  showListView = false;
  viewType = 'GRID';
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
  recentUpdated = [];
  recentDataShow = [];
  fileSelected = [];
  sortValue = '';
  activeTabs = { comments: false, info: false, timeline: false };

  slideConfig = {
    arrows: true,
    dots: false,
    infinite: false,
    speed: 300,
    slidesToShow: 5,
    centerMode: false,
    variableWidth: true
  };
  selectedView = 'recentUpload';
  selectedType = 'all';

  // /* <!-- sprint12-fixes start --> */
  public myOptions = {
    gutter: 10,
    resize: true
  };
  public updateMasonryLayout = false;
  showRecentlyViewed = true;
  baseUrl = environment.apiServiceBaseUrl;
  tags = [];
  inputTag: string;
  showTagInput = false;
  loading: boolean;
  modalLoading = false;
  sectors: string[] = [];
  sectorSelected;
  favourites = [];

  filtersCount = 0;

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
    this.getRecentlyViewed();
    this.getRecentUpdated();
    this.getFavorites();
    this.showRecentlyViewed = true;
    this.dataService.showHideLoader$.subscribe((value) => {
      this.loading = value;
    });
    // /* <!-- sprint12-fixes start --> */
    this.sharedService.getSidebarToggle().subscribe(() => {
      this.updateMasonryLayout = !this.updateMasonryLayout;
    });

    this.dataService.sectorChanged$.subscribe((sectors: any) => {
      this.sectors = sectors;
    });
    // /* <!-- sprint12-fixes end --> */
    this.filtersCount = this.getFilterCount();
  }

  ngOnChanges(changes: any) {
    this.recentlyViewed = [];
    if (changes.documents) {
      this.documents = changes.documents.currentValue;
    }

    if (this.docSliceInput >= this.documents?.entries.length) {
      this.hideShowMoreBtn = true;
    } else {
      this.hideShowMoreBtn = false;
    }
    this.filtersCount = this.getFilterCount();

    return;
  }

  getRecentlyViewed() {
    this.recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED) || '[]');
    return;
  }


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

  sectorSelect(value: string) {
    this.sectorSelected = value;
    this.dataService.sectorChange(value);
  }

  calculateNoResultScreen() {
    return !this.loading && this.recentDataShow && !this.recentDataShow.length && !this.documents?.entries.length;
  }

  getDataLength(data: any, primaryType: string) {
    if (this.docSliceInput >= this.documents.entries.length) {
      this.hideShowMoreBtn = true;
    } else {
      this.hideShowMoreBtn = false;
    }
    return data.length;
  }

  resetValues() {
    this.documents = [];
    return;
  }

  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
    if (event.checked || event.target?.checked) {
      this.fileSelected.push(file);
    } else {
      if (this.fileSelected.length) {
        let i = -1;
        this.fileSelected.forEach((item, ind) => {
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
    const dataToIterate = !this.documents.length ? this.recentlyViewed : this.documents;
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

  showMore() {
    this.docSliceInput += 9;
    if (this.docSliceInput >= this.documents.entries.length) {
      this.pageCount.emit({ pageNumber: ++this.documents.currentPageIndex });
      this.hideShowMoreBtn = false;
    }
    else if (this.docSliceInput >= this.documents.resultsCount) {
      this.hideShowMoreBtn = true;
    }
    return;
  }

  emitData(data: IHeaderSearchCriteria): void {
    this.searchTextOutput.emit(data);
    return;
  }

  changeDisplay(mode: number): void {
    this.display = mode;
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    if(!url) return '';
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    this.modalLoading = true;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);

          this.modalLoading = false;
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);

    this.modalLoading = false;
        // event.target.src = new Blob(d);
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'

          this.modalLoading = false;
          console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }

  completeLoadingMasonry(event: any) {
    this.masonry?.reloadItems();
    this.masonry?.layout();
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
      this.viewType = 'LIST';
      return;
    }
    this.showListView = false;
    this.viewType = 'GRID';

  }

  // added for modal
  open(file, fileType?: string): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRenditionUrl;
    this.selectedFile = file;
    // if (!fileType) {
      switch (fileType) {
        case 'Picture':
          fileType = 'image';
          break;
        case 'Video':
          fileType = 'video';
          break;
        default:
          fileType = 'file';
          break;
      }
    // }
    if(fileType === 'image') {
      this.markRecentlyViewed(file);

      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
      fileRenditionUrl = url; // file.properties['file:content'].data;
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if(fileType === 'video') {
      fileRenditionUrl = file.properties['vid:transcodedVideos'][0]?.content.data || "";
    } else if (fileType === 'file') {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/pdf`;
      // fileRenditionUrl = `${this.getNuxeoPdfViewerURL()}${encodeURIComponent(url)}`;
      fileRenditionUrl = file.properties['file:content'].data;
      // fileRenditionUrl = url;
    }
    this.selectedFileUrl = fileType === 'image' ? this.getAssetUrl(null, fileRenditionUrl) : fileRenditionUrl;
    // if(fileType === 'file') {
    //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
    // }

    this.previewModal.open();
  }

  onFileProgress(event: any) {
    if(!event.loaded) {
    this.modalLoading = true;
    }
    if(((event.loaded / event.total) * 100) > 1) {
      this.modalLoading = false;
    }
  }

  getNuxeoPdfViewerURL = () => {
    return `${this.baseUrl}/nuxeo/ui//vendor/pdfjs/web/viewer.html?file=`;
  }

  video(event: any) {
    console.log('im Play!');
    event.toElement.play();
  }

  // TODO: move to shared service
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
    this.loading = true;
    this.apiService.post(apiRoutes.MARK_FAVOURITE, body).subscribe((docs: any) => {
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
        this.markRecentlyViewed(data);
      }
      this.loading = false;
    });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {}
    };
    this.loading = true;
    this.apiService.post(apiRoutes.UNMARK_FAVOURITE, body).subscribe((docs: any) => {
      // data.contextParameters.favorites.isFavorite = this.favourite;
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
        this.markRecentlyViewed(data);
      }
      this.loading = false;
    });
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

  selectTab(tab) {
    this.selectedView = tab;
    if (tab === "recentUpload") {
      this.recentDataShow = [...this.recentUpdated];
    } else {
      this.getRecentlyViewed();
      this.recentDataShow = [...this.recentlyViewed];
    }
  }

  selectType(type) {
    this.selectedType = type;
    this.selectDocType.emit(type);
  }

  openAdvancedFilter() {
    this.openFilterModal.emit(this.selectedType);
  }

  count(type?: string) {
    if (!type) {
      let total = 0;
      this.documents.aggregations.system_primaryType_agg.extendedBuckets.forEach(b => {
        total += b.docCount;
      });
      return total;
    }
    const bucket = this.documents.aggregations.system_primaryType_agg.extendedBuckets.find(b => b.key === type);
    return bucket?.docCount || 0;
  }

  checkShowRecent() {
    if (this.documents && this.documents["entity-type"]) return false;
    return true;
  }

  async getRecentUpdated() {
    const query = "SELECT * FROM Document WHERE ecm:mixinType != 'HiddenInNavigation' AND ecm:isProxy = 0 AND ecm:isVersion = 0 AND "
      + "ecm:isTrashed = 0 AND (ecm:primaryType IN ('File') OR ecm:mixinType IN ('Picture', 'Audio', 'Video')) ORDER BY dc:created DESC";
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 20,
      queryParams: query
    };
    const res = await this.apiService.get(apiRoutes.NXQL_SEARCH, {params}).toPromise();
    this.recentUpdated = res["entries"].map(e => e);
    this.recentDataShow = [...this.recentUpdated];
  }

  getFilterCount() {
    let count = 0;
    Object.keys(this.filters).forEach(key => {
      if (["system_primaryType_agg", "sectors", "dublincore_sector_agg", "system_tag_agg"].includes(key)) return;
      const filter = this.filters[key];
      if (Array.isArray(filter) && filter.length > 0) {
        count += filter.length;
      }
    });

    return count;
  }

  clearFilter() {
    this.resetFilterOuput.emit();
  }


}
