import { Component, Output, EventEmitter, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../../upload-modal/upload-modal.component';
import { NuxeoService } from '../../services/nuxeo.service';
import { KeycloakService } from 'keycloak-angular';
import * as $ from 'jquery';
import { DataService } from '../../services/data.service';
import { REPORT_ROLE, TRIGGERED_FROM_SUB_HEADER } from '../constant';
import { SharedService } from 'src/app/services/shared.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';
import { apiRoutes } from '../config';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() sendSelectedTab: EventEmitter<any> = new EventEmitter();
  // @ViewChild('videoPlayer') player: ElementRef;

  selectedTab: string;
  searchHeader: boolean = true;
  showBrowseHeader = false;
  missingHeader= false;

  modalOpen: boolean = true;
  hideVideo: boolean = true;
  selectArea: boolean = false;

  modalOption: NgbModalOptions = {}; // not null!
  // allSectors = ['education', 'energy', 'entertainment', 'food', 'health_well_being_and_biotech', 'manufacturing', 'mobility', 'services', 'sport', 'tourism', 'water', 'design_and_construction'];
  allSectors = [
    {label: 'All NEOM sectors', value: 'general'},
    {label: 'Food', value: 'food'},
    {label: 'Sports', value: 'sport'},
    { label: "Tourism", value: "tourism" },
    {label: 'Water', value: 'water'},
    {label: 'Mobility', value: 'mobility'},
    {label: 'Manufacturing', value: 'manufacturing'}
   ];
  sectorSelected = localStorage.getItem('videoSector') || this.allSectors[0].value;
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
    private nuxeo: NuxeoService,
    private router: Router,
    public matDialog: MatDialog,
    public dataService: DataService,
    protected readonly keycloak: KeycloakService,
    private sharedService: SharedService,
    private modalService: NgbModal,
    private apiService: ApiService,
  ) {
    router.events.forEach((event: any) => {
      if (event.url) {
        // TODO: will break if we have another url that contains /user.
        if(event.url.includes('/workspace') || event.url.includes('/common/terms') || event.url.includes('/report')) {
          this.showBrowseHeader = true;
        } else {
          this.showBrowseHeader = false;
        }
        if (event.url === '/' || event.url.includes('/#favorites')) {
          localStorage.removeItem('workspaceState');
          this.searchHeader = true;
        } else {
          this.searchHeader = false;
        }
        if (event.url.includes('/404')) {
          this.missingHeader = true;
        } else {
          this.missingHeader = false;
        }
        
      }
    });

    // if( window.location.pathname === '/workspace' || window.location.pathname === '/common/terms' || window.location.pathname === '/report') {
    //   this.showBrowseHeader = true;
    // } else {
    //   this.showBrowseHeader = false;
    // }

    // if (window.location.pathname === '/') {
    //   this.searchHeader = true;
    // } else {
    //   this.searchHeader = false;
    // }
    // if (window.location.pathname === '/404') {
    //   this.missingHeader = true;
    // } else {
    //   this.missingHeader = false;
    // }

  }

  ngOnInit() {
    $(window).on('scroll', () => {
      const scroll = $(window).scrollTop();
      if (scroll >= 80 && scroll <= 20000) {
        $('.searchHeading').addClass('fixedHeader');
      } else {
        if( window.location.pathname !== '/workspace' && window.location.pathname !== '/common/terms' &&  window.location.pathname !== '/report') {
          $('.searchHeading').removeClass('fixedHeader');
        }
      }
    });

    this.showItemOnlyOnce = !localStorage.getItem('videoPlayed');
    if(!this.showItemOnlyOnce) this.playPersonalizedVideo();
    // this.openOnboardingModal(this.onboarding);
    return;
  }

  showHeaderElements() {
    if(window.location.pathname === '/common/terms' && !this.nuxeo.isAuthenticated()) {
      return false;
    }
    return true;
  }

  resetFilter() {
    this.dataService.resetFilterInit(TRIGGERED_FROM_SUB_HEADER);
  }

  toFavouriteSection() {
    setTimeout(() => {
      // window.scrollTo(0,document.body.scrollHeight);
      $('#favorites').animate({scrollTop: document.body.scrollHeight},"slow");
    }, 300);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.sendSelectedTab.emit(tab);
    if (tab === 'search') {
      this.router.navigate(['']);
      return;
    }
    if (tab === 'workspace' ||tab === 'report') {
      this.router.navigate(['workspace']);
      return;
    }
    if(tab === 'favourite') {
      this.dataService.resetFilterInit(TRIGGERED_FROM_SUB_HEADER);
      // this.router.navigate(['/','#favorites']);
    }
  }

  async logout() {
    await this.nuxeo.logout();
    this.keycloak.logout(window.location.origin + '/login');
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px"
    dialogConfig.width = "650px";
    dialogConfig.disableClose = true;
    const workspaceState = JSON.parse(localStorage.getItem("workspaceState"));
    if(workspaceState) {
      dialogConfig.data = workspaceState;
    }
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
  }

  checkForUserGroup() {
    const expectedRole = REPORT_ROLE;
    return this.sharedService.chekForReportRoles(expectedRole);
  }

  openSm(content) {
    this.modalOpen = true;
    this.hideVideo = true;
    this.selectArea = false;
    // localStorage.removeItem('openVideo');
    this.modalService.open(content, { windowClass: 'custom-modal', backdropClass: 'remove-backdrop', keyboard: false, backdrop: 'static' }).result.then((result) => {
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
  }

  clickVideoIcon() {
    this.hideVideo = false;
    this.selectArea = true
  }

  videoPayEnded(event: any) {
    this.videoCompleted = true;
  }

  playPersonalizedVideo() {
    const body = {sector: this.sectorSelected, username: localStorage.getItem('username')};
    localStorage.setItem('videoSector', this.sectorSelected);
    this.videoResponse = false;
    this.modalLoading = true;
    try {
      this.apiService.get(apiRoutes.FETCH_PERSONALIZED_VIDEO + '?sector=' + this.sectorSelected + '&username=' + body.username)
        .subscribe((response: any) => {
          this.videoResponse = true;
          this.modalLoading = false;
          if(!response?.error && response.videoId) {
            this.videoId = response.videoId;
            this.videoLocation = response.location || null;
            this.showVideo();
          }
          return;
        });
      } catch(error) {
        console.log('error = ', error);
        this.modalLoading = false;
          return;
        }
  }
  
  showVideo() {
    const updatedUrl = `${window.location.origin}/nuxeo/api/v1${apiRoutes.FETCH_PERSONALIZED_VIDEO}/video`;
    this.defaultVideoSrc = updatedUrl + `?sector=${this.sectorSelected}&videoId=${this.videoId}&location=${this.videoLocation}`;
    if(!localStorage.getItem('videoPlayed')) {
      localStorage.setItem('videoPlayed', 'true');
    }
    this.showItemOnlyOnce = false;
  }

  searchPopup: boolean = false;
  focusOnSearch() {
    this.searchPopup = true;
  }
  
  blurOnSearch() {
    this.searchPopup = false;
  }
}
