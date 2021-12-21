import { Component, Output, EventEmitter, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';
import { IHeaderSearchCriteria } from './interface';
 import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { unescapeIdentifier } from '@angular/compiler';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';
import { apiRoutes } from '../config';
import { TRIGGERED_FROM_DOCUMENT, TRIGGERED_FROM_SUB_HEADER } from '../constant';
@Component({
  selector: 'app-sub-header',
  // directives: [Search],
  templateUrl: './subHeader.component.html',
  styleUrls: ['./subHeader.component.css']
})
export class SubHeaderComponent implements OnInit {
  @Input() tagsMetadata: any;
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @ViewChild('content') videoModal: ElementRef;
  // @Input() sectors: string[];
  searchText: string = '';
  searchCriteria: IHeaderSearchCriteria = {};
  sectors: string[] = [];

  modalOpen: boolean = true;
  hideVideo: boolean = true;
  selectArea: boolean = false;
  modalReference = null; 
  modalOption: NgbModalOptions = {}; // not null!
  // allSectors = ['education', 'energy', 'entertainment', 'food', 'health_well_being_and_biotech', 'manufacturing', 'mobility', 'services', 'sport', 'tourism', 'water', 'design_and_construction'];
  allSectors = [{label: 'All NEOM sectors', value: 'default'}, {label: 'Water', value: 'water'}];
  sectorSelected = this.allSectors[0].value;
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

  constructor(
    private dataService: DataService,
    private sharedService: SharedService,
    private modalService: NgbModal,
    private apiService: ApiService
    ) {
    }

  ngOnInit() {
    this.dataService.sectorChanged$.subscribe((sectors: any) => {
      this.sectors = sectors;
    });

    this.dataService.resetFilter$.subscribe((triggeredFrom: string) => {
      if(TRIGGERED_FROM_DOCUMENT === triggeredFrom) {
        this.searchText = '';
        this.searched = false;
      }
    });
    this.showItemOnlyOnce = !localStorage.getItem('videoPlayed');
    if(!this.showItemOnlyOnce) this.playPersonalizedVideo();
    return;
  }

  ngAfterViewInit() {
    if(!localStorage.getItem('openVideo')) {
      this.openSm(this.videoModal);
      localStorage.setItem('openVideo', '1');
    }
    return;  
  }

  videoPayEnded(event: any) {
    this.videoCompleted = true;
  }
  
  // sectorSelect(value: string) {
  //   this.sectorSelected = value;
  //   this.dataService.sectorChange(value);
  // }

  dropdownMenu(event: any): void {
    let sortBy = event.target.value;
    if(sortBy) {
      this.searchCriteria['sortBy'] = sortBy;
      this.searchCriteria['sortOrder'] = 'asc';
    } else {
      delete this.searchCriteria['sortBy'];
      delete this.searchCriteria['sortOrder']
    }
    this.emitData(this.searchCriteria);
  }

  searchOutputFn(searchText: string): void {
    if(searchText) {
      this.searchCriteria['ecm_fulltext'] = searchText;
      this.searchCriteria['highlight'] = 'dc:title.fulltext,ecm:binarytext,dc:description.fulltext,ecm:tag,note:note.fulltext,file:content.name';
    } else {
      delete this.searchCriteria['ecm_fulltext'];
      delete this.searchCriteria['highlight'];
    }
    // this.dataService.termSearchInit(searchText);
    this.emitData(this.searchCriteria);
  }

  emitData(data: IHeaderSearchCriteria): void {
    this.searched = true;
    this.searchTextOutput.emit(data);
    return;
  }

  customOptions: OwlOptions = {
    loop: false,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    autoWidth:true,
    items: 6,
    margin: 10,
    navText: ['<img src="../../../assets/images/leftArrow.svg">', '<img src="../../../assets/images/rightArrow.svg">'],

    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 6
      },
      740: {
        items: 6
      },
      940: {
        items:6,
      }
    },
    nav: true
  }

  openSm(content) {
    this.modalOpen = false;
    this.hideVideo = true;
    this.selectArea = false;
    // localStorage.removeItem('openVideo');
    this.modalService.open(content, { windowClass: 'custom-modal', backdropClass: 'remove-backdrop', keyboard: false }).result.then((result) => {
      // this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeModal();
      // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });;
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
    this.selectArea = true
  }

  playPersonalizedVideo() {
    const body = {sector: this.sectorSelected, username: localStorage.getItem('username')};
    this.videoResponse = false;
    this.modalLoading = true;
    try {
      this.apiService.get(apiRoutes.FETCH_PERSONALIZED_VIDEO + '?sector=' + 'sport' + '&username=' + body.username)  //TODO: this.sectorSelected
        .subscribe((response: any) => {
          this.videoResponse = true;
          this.modalLoading = false;
          if(!response?.error && response.videoId) {
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
      } catch(error) {
        console.log('error = ', error);
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
    this.defaultVideoSrc = updatedUrl + `?sector=sport&videoId=${this.videoId}&location=${this.videoLocation}`; //TODO: this.sectorSelected
    if(!localStorage.getItem('videoPlayed')) {
      localStorage.setItem('videoPlayed', 'true');
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
    this.dataService.resetFilterInit(TRIGGERED_FROM_SUB_HEADER);
  }
}