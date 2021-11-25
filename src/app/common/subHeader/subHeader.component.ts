import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';
import { IHeaderSearchCriteria } from './interface';
 import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { unescapeIdentifier } from '@angular/compiler';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';
import { apiRoutes } from '../config';
@Component({
  selector: 'app-sub-header',
  // directives: [Search],
  templateUrl: './subHeader.component.html',
  styleUrls: ['./subHeader.component.css']
})
export class SubHeaderComponent implements OnInit {
  @Input() tagsMetadata: any;
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  // @Input() sectors: string[];
  searchText: string = '';
  searchCriteria: IHeaderSearchCriteria = {};
  sectors: string[] = [];
  sectorSelected;

  modalOpen: boolean = true;
  hideVideo: boolean = true;
  selectArea: boolean = false;
  modalReference = null; 
  modalOption: NgbModalOptions = {}; // not null!

  constructor(
    private dataService: DataService,
    private sharedService: SharedService,
    private modalService: NgbModal,
    private apiService: ApiService
    ) {}

  ngOnInit() {
    this.dataService.sectorChanged$.subscribe((sectors: any) => {
      this.sectors = sectors;
    });
    return;
  }
  
  sectorSelect(value: string) {
    this.sectorSelected = value;
    this.dataService.sectorChange(value);
  }

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
    this.emitData(this.searchCriteria);
  }

  emitData(data: IHeaderSearchCriteria): void {
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
    this.modalService.open(content, { windowClass: 'custom-modal', backdropClass: 'remove-backdrop', backdrop: 'static', keyboard: false });
  }
  closeModal() {
    this.modalOpen = true;
    this.modalReference.close();
  }

  clickVideoIcon() {
    this.hideVideo = false;
    this.selectArea = true
  }

  videoResponse;
  playPersonalizedVideo() {
    const body = {sector: this.sectorSelected, username: localStorage.getItem('username')};
    try {
      this.apiService.get(apiRoutes.FETCH_PERSONALIZED_VIDEO + '?sector=' + body.sector + '&username=' + body.username)
        .subscribe((response: any) => {
          this.apiService.getVideo(apiRoutes.FETCH_PERSONALIZED_VIDEO + '/video').subscribe((vidResponse: any) => {
            console.log('vidResponse = ', vidResponse);
            this.videoResponse = vidResponse;
          });
          // if(response) this.getFavouriteCollection(response.uid);
          
          // setTimeout(() => {
            // this.loading = false;
          // }, 0);
        });
      } catch(error) {
        console.log('error = ', error);
          // this.loading = false;
          // if (error && error.message) {
          //   if (error.message.toLowerCase() === 'unauthorized') {
          //     this.sharedService.redirectToLogin();
          //   }
          // }
          return;
        }
  }

  onSelectSector(sector: string) {
    this.sectorSelected = sector;
  }
}