import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { DataService } from "src/app/services/data.service";
import { SharedService } from "src/app/services/shared.service";
import { IHeaderSearchCriteria } from "./interface";
import { CarouselModule } from "ngx-owl-carousel-o";
import { OwlOptions } from "ngx-owl-carousel-o";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { unescapeIdentifier } from "@angular/compiler";
import { OWNER_APPROVAL_LABEL } from "./../../upload-modal/constant";
import { concat, Observable, of, Subject } from "rxjs";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "src/app/services/api.service";
import { NuxeoService } from "../../services/nuxeo.service";
import { apiRoutes } from "../config";
import {
  TRIGGERED_FROM_DOCUMENT,
  TRIGGERED_FROM_SUB_HEADER,
} from "../constant";
@Component({
  selector: "app-sub-header",
  // directives: [Search],
  templateUrl: "./subHeader.component.html",
  styleUrls: ["./subHeader.component.css"],
})
export class SubHeaderComponent implements OnInit {
  @Input() tagsMetadata: any;
  @Input() tagsMetadataNew: any;
  @Input() hideSearchBar: boolean = false;
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @ViewChild("content") videoModal: ElementRef;
  // @Input() sectors: string[];
  searchedAdeadData: any;
  searchCriteria: IHeaderSearchCriteria = {};
  sectors: string[] = [];
  searchText: string = "";
  userLoading: boolean = false;
  loadWorkSpace: boolean = false;
  modalOpen: boolean = true;
  hideVideo: boolean = true;
  selectArea: boolean = false;
  modalReference = null;
  modalOption: NgbModalOptions = {}; // not null!
  workspaceList$: Observable<any>;
  userWorkspaceInput$ = new Subject<string>();
  customDownloadApprovalMap: { [key: string]: string | boolean } = {};
  customDownloadApprovalUsersMap: { [key: string]: string } = {};

  // allSectors = ['education', 'energy', 'entertainment', 'food', 'health_well_being_and_biotech', 'manufacturing', 'mobility', 'services', 'sport', 'tourism', 'water', 'design_and_construction'];
  allSectors = [
    { label: "All NEOM sectors", value: "general" },
    { label: "Sports", value: "sport" },
    { label: "Water", value: "water" },
    { label: "Food", value: "food" },
    { label: "Tourism", value: "tourism" },
  ]; // , {label: 'Water', value: 'water'}
  sectorSelected =
    localStorage.getItem("videoSector") || this.allSectors[0].value;
  videoResponse;
  videoId;
  videoLocation;
  callInProgress;
  abortVideoDownload;
  signal;
  modalLoading = false;
  defaultVideoSrc;
  videoCompleted = false;
  searched = false;
  showItemOnlyOnce = true;
  searchPopup: boolean = false;
  tagClicked: boolean = false;
  showRelatedSearch: boolean = false;
  recentSearch: any;
  clearRecent: boolean = false;
  readonly OWNER_APPROVAL_LABEL = OWNER_APPROVAL_LABEL;
  searchTextChanged: Subject<string> = new Subject<string>();
  txtQuery = '';

  constructor(
    public nuxeo: NuxeoService,
    private dataService: DataService,
    public sharedService: SharedService,
    private modalService: NgbModal,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.dataService.sectorChanged$.subscribe((sectors: any) => {
      this.sectors = sectors;
    });

    this.dataService.resetFilter$.subscribe((triggeredFrom: string) => {
      if (TRIGGERED_FROM_DOCUMENT === triggeredFrom) {
        this.searchText = "";
        this.searched = false;
      }
    });

    this.dataService.termSearch$.subscribe((searchTerm: string) => {
      this.searchText = searchTerm;
      this.searched = false;
    });

    this.showItemOnlyOnce = !localStorage.getItem("videoPlayed");
    if (!this.showItemOnlyOnce) this.playPersonalizedVideo();

    this.getRecentSearch();
    this.initSearchBarChange();
    return;
  }

  ngAfterViewInit() {
    // if (!localStorage.getItem("openVideo")) {
    //   // this.openSm(this.videoModal);
    //   localStorage.setItem("openVideo", "1");
    // }
    // return;
  }

  videoPayEnded(event: any) {
    this.videoCompleted = true;
  }

  // sectorSelect(value: string) {
  //   this.sectorSelected = value;
  //   this.dataService.sectorChange(value);
  // }

  getRecentSearch() {
    const user = JSON.parse(localStorage.getItem("user"));

    if(!user) {
      return;
    }

    this.apiService
      .get("/searchTerm/findUserRecentTags?username=" + user.email, {})
      .subscribe((response) => {
        let filteredData = response["data"]
          .map((d: any) => (d._source.isDeleted ? undefined : d._source.query))
          .filter(
            (item: any, i: number, ar: any) =>
              ar.indexOf(item) === i && item !== undefined
          );
        this.recentSearch = filteredData;
      });
  }
  
  dropdownMenu(event: any): void {
    let sortBy = event.target.value;
    if (sortBy) {
      this.searchCriteria["sortBy"] = sortBy;
      this.searchCriteria["sortOrder"] = "asc";
    } else {
      delete this.searchCriteria["sortBy"];
      delete this.searchCriteria["sortOrder"];
    }
    this.emitData(this.searchCriteria);
  }

  searchOutputFn(searchText: string): void {
    if (searchText) {
      this.tagClicked = true;
      this.showRelatedSearch = true;
      this.searchCriteria["ecm_fulltext"] = searchText;
      this.searchCriteria["highlight"] =
        "dc:title.fulltext,ecm:binarytext,dc:description.fulltext,ecm:tag,note:note.fulltext,file:content.name";
    } else {
      delete this.searchCriteria["ecm_fulltext"];
      delete this.searchCriteria["highlight"];
    }
    this.dataService.termSearchForHideInit(searchText);

    this.emitData(this.searchCriteria);
  }

  emitData(data: IHeaderSearchCriteria): void {
    this.searched = false;
    this.searchTextOutput.emit(data);
    return;
  }

  customOptions: OwlOptions = {
    loop: false,
    // mouseDrag: false,
    // touchDrag: false,
    // pullDrag: false,
    dots: false,
    items: 5,
    margin: 15,
    nav: true,
    responsive: {
      991: {
        nav: false,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
      },
      1024: {
        mouseDrag: false,
        touchDrag: false,
        pullDrag: false,
      },
    },
  };

  // slideConfig = {
  //   arrows: true,
  //   dots: false,
  //   infinite: false,
  //   speed: 300,
  //   slidesToShow: 5,
  //   slidesToScroll: 4,
  //   variableWidth: true,
  //   // responsive: [
  //   //   {
  //   //     breakpoint: 991,
  //   //     settings: {
  //   //      arrows: false
  //   //     }
  //   //   }
  //   // ]
  //   responsive: [
  //     {
  //       breakpoint: 1024,
  //       settings: {
  //         slidesToShow: 5,
  //         slidesToScroll: 5,
  //         infinite: false,
  //         dots: false,
  //         arrows: false
  //       }
  //     },
  //     {
  //       breakpoint: 600,
  //       settings: {
  //         arrows: false,
  //         slidesToShow: 3,
  //         slidesToScroll: 1
  //       }
  //     },
  //     {
  //       breakpoint: 480,
  //       settings: {
  //         arrows: false,
  //         slidesToShow: 2,
  //         slidesToScroll: 1
  //       }
  //     }
  //   ]
  // };
  slideConfig = {
    slidesToShow: 5,
    // "slidesToScroll": 1,
    dots: false,
    infinite: false,
    speed: 300,
    centerMode: false,
    variableWidth: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
        },
      },
    ],
  };

  openSm(content) {
    this.modalOpen = true;
    this.hideVideo = true;
    this.selectArea = false;
    // localStorage.removeItem('openVideo');
    this.modalService
      .open(content, {
        windowClass: "custom-modal",
        backdropClass: "remove-backdrop",
        keyboard: false,
        backdrop: "static",
      })
      .result.then(
        (result) => {
          // this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeModal();
          // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  closeModal() {
    this.modalOpen = true;
    this.hideVideo = true;
    this.modalLoading = false;
    this.videoCompleted = false;
    // this.abortVideoDownload.abort();
  }

  clickVideoIcon() {
    this.hideVideo = false;
    this.selectArea = true;
  }

  playPersonalizedVideo() {
    const body = {
      sector: this.sectorSelected,
      username: JSON.parse(localStorage.getItem("user"))["username"]
    };
    localStorage.setItem("videoSector", this.sectorSelected);
    this.videoResponse = false;
    this.modalLoading = true;
    try {
      this.apiService
        .get(
          apiRoutes.FETCH_PERSONALIZED_VIDEO +
            "?sector=" +
            this.sectorSelected +
            "&username=" +
            body.username
        )
        .subscribe((response: any) => {
          this.videoResponse = true;
          this.modalLoading = false;
          if (!response?.error && response.videoId) {
            this.videoId = response.videoId;
            this.videoLocation = response.location || null;
            this.showVideo();
          }
          return;
          // this.apiService.getVideo(apiRoutes.FETCH_PERSONALIZED_VIDEO + '/video').subscribe((vidResponse: any) => {
          //   console.log('vidResponse = ', vidResponse);
          //   // this.videoResponse = vidResponse;
          // });
          // if(response) this.getFavouriteCollection(response.uid);

          // setTimeout(() => {
          // this.loading = false;
          // }, 0);
        });
    } catch (error) {
      console.log("error = ", error);
      this.modalLoading = false;
      // this.loading = false;
      // if (error && error.message) {
      //   if (error.message.toLowerCase() === 'unauthorized') {
      //     this.sharedService.redirectToLogin();
      //   }
      // }
      return;
    }
  }

  showVideo() {
    // this.abortVideoDownload = new AbortController();
    // this.signal = this.abortVideoDownload.signal;
    // this.modalLoading = true;
    // if(!this.count) return;
    const updatedUrl = `${window.location.origin}/nuxeo/api/v1${apiRoutes.FETCH_PERSONALIZED_VIDEO}/video`;
    this.defaultVideoSrc =
      updatedUrl +
      `?sector=${this.sectorSelected}&videoId=${this.videoId}&location=${this.videoLocation}`;
    if (!localStorage.getItem("videoPlayed")) {
      localStorage.setItem("videoPlayed", "true");
    }
    this.showItemOnlyOnce = false;
    //  fetch(updatedUrl + `?sector=sport&videoId=${this.videoId}&location=${this.videoLocation}`, { headers: { 'X-Authentication-Token': localStorage.getItem('token') }, signal: this.signal })
    //     .then(r => {
    //       if (r.status === 401) {
    //         localStorage.removeItem('token');
    //         // this.router.navigate(['login']);

    //         this.modalLoading = false;
    //         return;
    //       }
    //       return r.blob();
    //     })
    //     .then(d => {
    //       event.target.src = window.URL.createObjectURL(d);
    //       // this.count--;

    //       this.modalLoading = false;
    //       return
    //       // event.target.src = new Blob(d);
    //     }
    //     ).catch(e => {
    //       // TODO: add toastr with message 'Invalid token, please login again'

    //         this.modalLoading = false;
    //         console.log(e);
    //       // if(e.contains(`'fetch' on 'Window'`)) {
    //       //   this.router.navigate(['login']);
    //       // }

    //     });
  }

  // onSelectSector(sector: string) {
  //   this.sectorSelected = sector;
  // }

  resetSearch() {
    this.searched = false;
    this.showRelatedSearch = false;
    // this.dataService.searchBarClickInit(false);
    this.searchText = '';
    this.getRecentSearch();
    // this.dataService.resetFilterInit(TRIGGERED_FROM_SUB_HEADER);
    // this.dataService.tagsMetaRealInit([]);
  }

  focusOnSearch() {
    this.searchPopup = true;
    this.tagClicked = false;
  }

  blurOnSearch() {
    console.log("this.searchText", this.searchText);

    if (this.tagClicked) {
    } else {
      setTimeout(() => {
        this.searchPopup = false;
      }, 500);
    }
  }

  inputClicked() {
    this.dataService.searchBarClickInit(true);
    console.log("2222", this.searchText.trim());
    if (this.searchText.trim() !== "") {
      this.loadWorkSpace = true;
    } else {
      this.loadWorkSpace = false;
    }

    this.searchPopup = true;
    this.tagClicked = false;
    this.dataService.showRecent$.subscribe((show: boolean) => {
      this.showRelatedSearch = show;
      this.getRecentSearch();
    });
  }

  deleteRecentTags(e) {
    e.stopPropagation();
    e.preventDefault();
    this.clearRecent = true;
    const user = JSON.parse(localStorage.getItem("user"));
    this.apiService
      .post("/searchTerm/deleteUserRecentTags?username=" + user.email, {})
      .subscribe(() => {
        this.recentSearch = [];
      });
  }
  outClick() {
    console.log("qwertgyhuiop");
  }

  initSearchBarChange() {
    this.searchTextChanged
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(model => {
        this.txtQuery = model;
        this.onSearchBarChange(this.txtQuery);
      });
  }

  handleSearchBarChange(query: string) {
    this.searchTextChanged.next(query);
  }

  onSearchBarChange(e) {
    if (e.trim() !== "") {
      this.loadWorkSpace = true;
    } else {
      this.loadWorkSpace = false;
    }
    this.searchText = e;
    const queryParams = {
      queryParams: e,
    };
    this.userLoading = true;

    this.nuxeo.nuxeoClient
      .request(apiRoutes.DEFAULT_DOCUMENT_SUGGESTION, { queryParams })
      .get()
      .then((res) => {
        const docs = res.entries;
        // const newData = docs?.filter((m) =>
        //   m.title.includes(".")
        //     ? ["jpg", "gif", "png", "mp4","MOV","tif","mov",].indexOf(
        //         m.title.split(".")[m.title.split(".").length - 1]
        //       ) === -1
        //     : true
        // );
        const newData = docs?.filter(
          (m) =>
            ["workspace", "folder", "orderedfolder"].indexOf(
              m.type.toLowerCase()
            ) !== -1
        );
        this.searchedAdeadData = newData;
        this.userLoading = false;
      })
      .catch((error) => {});
  }

  splitStr(str: any) {
    return str.split(" ");
  }

  highlightStr(str: any) {
    return str.toLowerCase().includes(this.searchText.toLowerCase());
  }

  showEverything(){
    this.dataService.showEverythingInit(true);  
  }
}
