import { Component, Output, EventEmitter, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../../upload-modal/upload-modal.component';
import { UploadDroneComponent } from "../../upload-drone/upload-drone.component";
import { NuxeoService } from '../../services/nuxeo.service';
import { KeycloakService } from 'keycloak-angular';
import * as $ from 'jquery';
import { DataService } from '../../services/data.service';
import { REPORT_ROLE, TRIGGERED_FROM_SUB_HEADER, EXTERNAL_GROUP_GLOBAL, DRONE_UPLOADER, EXTERNAL_USER } from '../constant';
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
  showFooter: boolean = false;

  modalOption: NgbModalOptions = {}; // not null!
  // allSectors = ['education', 'energy', 'entertainment', 'food', 'health_well_being_and_biotech', 'manufacturing', 'mobility', 'services', 'sport', 'tourism', 'water', 'design_and_construction'];
  allSectors = [
    {label: 'All NEOM sectors', value: 'general'},
    {label: 'Entertainment and culture', value:'entertainment_and_culture'},
    {label: 'Energy', value:'energy'},
    {label: 'Healthcare wellbeing & biotech', value:'healthcare_wellbeing_and_biotech'},
    {label: 'Financial services', value: 'financial_services'},
    {label: 'Food', value: 'food'},
    {label: 'Manufacturing', value: 'manufacturing'},
    {label: 'Mobility', value: 'mobility'},
    {label: 'Sports', value: 'sport'},
    { label: 'Tourism', value: 'tourism' },
    {label: 'Water', value: 'water'},
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
  showItemOnlyOnce = false;
  readonly adminEmail: string = "groundxfeedback@neom.com";
  notifications: any[];
  thisWeekNoti: any[];
  earlierNoti: any[];
  rejectComment = "";
  showRejectForm = {};
  requestSent = {};
  isApproved = {};
  isDroneUploadPage = false;
  isDroneUploader = false;
  isExternalUSer = false;
  isGlobalExternalUser = false;

  loading = false;
  showCreateFolderPopup: boolean = false;
  generateVideo:boolean = false;
  videoResponseShow:boolean = false;
  changeSectorShow : boolean = false;
  isInAccessListOfRegion = false;

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
        if (event.url.includes('documentation-assets') || event.url.includes('construction')) {
          this.isDroneUploadPage = true;
          this.showFooter = true;
        } else {
          this.isDroneUploadPage = false;
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
    this.getNotifications();
    this.showRejectForm = {};
    this.requestSent = {};
    this.isApproved = {};

    // this.showItemOnlyOnce = !localStorage.getItem('videoPlayed');
    if(!this.showItemOnlyOnce) this.playPersonalizedVideo();
    // this.openOnboardingModal(this.onboarding);
    this.dataService.showFooter$.subscribe((data)=>this.showFooter= data)
    this.fetchUserData();
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
    $('.nav.nav-tabs').find('li').removeClass('active');
    $('#favoritesHome').addClass('active');

    if($("#favoritesHome").hasClass("active")){
      $('.tab-content').find('#recentlyViewed').removeClass('active');
      $('.tab-content').find('#recentlyUploaded').removeClass('active');
      $('.tab-content').find('#yourFavourites').addClass('active');
    }
    if($('div').hasClass("filterMenuRow")){
      this.dataService.resetFilterInit(TRIGGERED_FROM_SUB_HEADER);
    }

    setTimeout(() => {
      $('#favorites').animate({scrollTop: document.body.scrollHeight},"slow");
    }, 0);

    $('html, body').animate({
      scrollTop: $('#favorites').offset().top
    }, 'slow');
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.sendSelectedTab.emit(tab);
    if (tab === 'search') {
      if (this.isDroneUploader && !this.isGlobalExternalUser) {
        this.router.navigate(['/', 'construction']);
        return;
      }
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
    this.loading = true;
    await this.nuxeo.logout();
    this.loading = false;
    this.keycloak.logout(window.location.origin + '/login');
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    // dialogConfig.minHeight = "350px";
    // dialogConfig.height = "100%";
    // dialogConfig.maxHeight = "92vh"
    // dialogConfig.width = "80vw";
    // dialogConfig.maxWidth = "80vw";
    dialogConfig.panelClass = 'custom-modalbox';
    dialogConfig.disableClose = true;
    const workspaceState = JSON.parse(localStorage.getItem("workspaceState"));
    if(workspaceState) {
      dialogConfig.data = workspaceState;
    }
    // https://material.angular.io/components/dialog/overview
    if (!this.isDroneUploadPage && !this.isDroneUploader) {
      const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
    } else {
      const modalDialog = this.matDialog.open(UploadDroneComponent, dialogConfig);
    }
  }

  checkForUserGroup() {
    const expectedRole = REPORT_ROLE;
    return this.sharedService.chekForReportRoles(expectedRole);
  }

  openSm(content) {
    this.modalOpen = true;
    this.hideVideo = true;
    this.selectArea = false;
    this.videoResponseShow = false;
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

  userData:any;
  checkExternalUser(excludeGlobal = false) {
    if (excludeGlobal) {
      if (!this.sharedService.checkExternalUser()) return false; // normal user
      const user = JSON.parse(localStorage.getItem('user'));
      this.userData = user;
      return !user?.groups.includes(EXTERNAL_GROUP_GLOBAL);
    } else {
      return this.sharedService.checkExternalUser();
    }
  }

  get isUploadButtonVisible() {
    if (this.isDroneUploader) {
      return true
    }
    const user = JSON.parse(localStorage.getItem('user'));
    this.userData = user;
    if (user?.groups?.includes(EXTERNAL_GROUP_GLOBAL) || user?.groups?.includes(REPORT_ROLE)) {
      return true
    }
    return false;
  }

  checkNeomUser() {
    if (!this.userData) return !this.checkExternalUser();
    return this.userData.email?.includes('@neom.com') || this.userData.email?.match('@.*neom.com');
  }
  sectorChange: boolean = false;
  playPersonalizedVideo() {
    const body = {sector: this.sectorSelected, user: JSON.parse(localStorage.getItem('user'))};
    localStorage.setItem('videoSector', this.sectorSelected);
    this.videoResponse = false;
    // this.modalLoading = true;
    this.sectorChange = true;
    try {
      this.apiService.get(apiRoutes.FETCH_PERSONALIZED_VIDEO + '?sector=' + this.sectorSelected + '&username=' + body.user.email)
        .subscribe((response: any) => {
          this.videoResponse = true;
          this.modalLoading = false;
          this.sectorChange = false;
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
        this.sectorChange = false;
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

  async getNotifications() {
    const payload = {
      params: {},
      context: {},
    };
    const res = await this.apiService.post(apiRoutes.GET_NOTIFICATIONS, payload).toPromise();
    this.notifications = res['value'];
    this.thisWeekNoti = [];
    this.earlierNoti = [];
    this.computeDuplicateRequestDownloadNoti();
    this.computeNotifications();
    this.storeRequestDownloadNotification();
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    // if (!event) {
    //   return `${window.location.origin}/nuxeo${url}`;
    // }

    return this.sharedService.getAssetUrl(event, url, document, type);
  }

  downloadAssetFromNotification(UUID: string) {
    return `${window.location.origin}/nuxeo/nxfile/default/${UUID}`;
  }


  computeDuplicateRequestDownloadNoti() {
    this.notifications = this.notifications.sort((a, b) => {
      if (a.id > b.id) return -1;
      else return 1;
    });
    this.notifications = this.notifications.filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.docUUID === value.docUUID && t.eventDate === value.eventDate
      ))
    );
  }

  computeNotifications() {
    let i = 0;
    for (i; i < this.notifications.length; i++) {
      if (!this.sharedService.isInThisWeek(this.notifications[i].eventDate)) break;
      this.thisWeekNoti.push(this.notifications[i]);
    }
    this.earlierNoti = this.notifications.slice(i);
  }

  storeRequestDownloadNotification() {
    const processedDownloadRequest = this.notifications.filter(noti => noti.extended.type === 'requestDownloadResponse');
    localStorage.setItem("processedDownloadRequest", JSON.stringify(processedDownloadRequest));
  }

  buildRenameNotificationTitle(notification) {
    const extended = notification.extended;
    const isAsset = ['Picture', 'File', 'Video', 'Audio'].includes(notification.docType);
    return `${extended.updatedBy} renamed ${isAsset ? '' : 'folder '} "${extended.oldTitle}" to "${extended.title}"`;
  }

  buildRequestDownloadNotificationTitle(notification) {
    const extended = notification.extended;
    return `${extended.requestedBy} requests to download an asset.`;
  }

  buildRequestDownloadResponseNotificationTitle(notification) {
    const extended = notification.extended;
    return extended.isApproved ? `${extended.processedBy} has approved your download request.`
      : `${extended.processedBy} has rejected your download request.`
  }

  getNotificationSince(notification) {
    return this.sharedService.timeSince(new Date(notification.eventDate));
  }

  buildNotificationIcon(notification) {
    const isAsset = ['Picture', 'File', 'Video', 'Audio'].includes(notification.docType);
    if (!isAsset) return '../../../assets/images/folder-delete-icon.svg';
    return `${window.location.origin}/nuxeo/api/v1/repo/default/id/${notification.docUUID}/@rendition/thumbnail`;
  }

  goToNotificationLink(notification) {
    // this.loading = true;
    // debugger;
    let folderName = notification?.docPath?.split("/")[1]
    const isAsset = ['Picture', 'File', 'Video', 'Audio'].includes(notification.docType);
    if (isAsset) this.router.navigate(['asset-view'], {queryParams : {assetId: notification.docUUID}});
    else this.router.navigate([`workspace/${folderName}/${notification?.docUUID}`]);
  }

  async processDownloadRequest(notification, isApproved) {
    const body = {
      context: {},
      input: notification.docUUID,
      params: {
        rejectComment: this.rejectComment,
        requestedBy: notification.extended.requestedBy,
        isApproved,
      },
    };
    await this.apiService.post(apiRoutes.PROCESS_REQUEST_DOWNLOAD, body).toPromise();
    this.requestSent[notification.id] = true;
    this.isApproved[notification.id] = isApproved;
  }

  allNotifactionOpen(allNotifactionContent) {
    this.modalOpen = true;
    this.modalService.open(allNotifactionContent, { windowClass: 'custom-modal-notifaction', backdropClass: 'remove-backdrop', keyboard: false, backdrop: 'static' }).result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });
  }

  getImageName(){
    let {userData} = this
    let splittedUser = userData?.email.split(".")
    let name = splittedUser?.[0]?.[0] + splittedUser?.[1]?.[0]
    return isNaN(name) && !splittedUser?.length ? "":name?.toUpperCase()
  }

  async checkInAccessListOfRegion() {
    try {
      this.isInAccessListOfRegion = await this.sharedService.checkInAccessListOfRegion()      
    } catch (error) {}
  }

  async checkUserGroup(groups) {
    await this.checkInAccessListOfRegion()
    if (groups.includes(DRONE_UPLOADER)) {
      this.isDroneUploader = true;
    }
    if (groups.includes(EXTERNAL_GROUP_GLOBAL)) {
      this.isGlobalExternalUser = true;
    }
    if (groups.includes(EXTERNAL_USER)) {
      this.isExternalUSer = true;
    }
  }

  async fetchUserData() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      this.userData = user;
      const groups = user.groups;
      this.checkUserGroup(groups);
    }
    if (this.nuxeo.nuxeoClient) {
      const res = await this.nuxeo.nuxeoClient.connect();
      localStorage.setItem("user", JSON.stringify(res.user.properties));
      // const user = JSON.parse(localStorage.getItem('user'));
      this.userData = res.user.properties;
      const groups = res.user.properties.groups;
      this.checkUserGroup(groups);
    }
  }
  onActivate() {
    $("#favorites").animate({ scrollTop: 0 }, "slow");
  }

  async deleteNotiFication(notification?:any){
    let url = '/automation/Scry.UpdateNotification'
    let payload = {
      "params":{
        "action":"delete",
        "notificationId":notification.id
      }
    }
    const res = await this.apiService.post(url, payload).toPromise();
    this.getNotifications()
    
  }
  checkSetingsActive(){
    if (window.location.href.includes(`${window.location.origin}/settings`)) {
      return true
    }
  }
  checkFavoritesActive(){
    if (window.location.href.includes(`${window.location.origin}/#favorites`) || window.location.href.includes(`${window.location.origin}/favorites`)) {
      return true
    }
  }
  checkDataApiActive(){
    if (window.location.href.includes(`${window.location.origin}/data-api`)) {
      return true
    }
  }
  checkReportActive(){
    if (window.location.href.includes(`${window.location.origin}/report`)) {
      return true
    }
  }
  checkUsePolicyActive() {
    if (window.location.href.includes(`${window.location.origin}/common/terms`)) {
      return true
    }
  }
  notifactionClick () {
    this.showCreateFolderPopup = true;
    
    $(".notifactionClickAction").on("click", function (e) {
      $(".notificationExpandarea").show();
      $(".notifactionClickAction").addClass("createNewFolderClick");
      e.stopPropagation();
    });
    $(".notifactionClickAction.createNewFolderClick").on("click", function (e) {
      $(".notificationExpandarea").hide();
      $(".notifactionClickAction").removeClass("createNewFolderClick");
      e.stopPropagation();
    });

    $(document).click(function () {
      $(".notificationExpandarea").hide();
      $(".notifactionClickAction").removeClass("createNewFolderClick");
    });
  }

  get isHomeUrlActive() { 
    const url = this.router.url;
    return (url === '/' || url.includes('/?') || url.includes('/#') || url.includes('/construction')) 
  }

  checkShowTabSelection() {
    // let isOtherPage = false;
    // if (this.documentsView) {
    //   isOtherPage = !!this.documentsView.checkShowDetailview()
    // }
    if(this.isGlobalExternalUser) { 
      return true
    }
    if (this.isDroneUploader) {
      return false;
    }
    return !this.isDroneUploader && this.checkNeomUser();
  }

  generateVideoPlay() {
    this.generateVideo = true;
    this.videoResponseShow = true;
    this.generateVideo = false;
  }

  changeSectorClick() {
    this.changeSectorShow = !this.changeSectorShow;
  }

  getAiName(){
    let {userData} = this
    let splittedUser = userData?.email.split(".")
    let name = splittedUser?.[0]
    return isNaN(name) && !splittedUser?.length ? "":name
  }
}
