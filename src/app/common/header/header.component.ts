import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../../upload-modal/upload-modal.component';
import { NuxeoService } from '../../services/nuxeo.service';
import { KeycloakService } from 'keycloak-angular';
import * as $ from 'jquery';
import { DataService } from '../../services/data.service';
import { REPORT_ROLE, TRIGGERED_FROM_SUB_HEADER } from '../constant';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() sendSelectedTab: EventEmitter<any> = new EventEmitter();

  selectedTab: string;
  searchHeader: boolean = true;
  showBrowseHeader = false;
  missingHeader= false;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router,
    public matDialog: MatDialog,
    public dataService: DataService,
    protected readonly keycloak: KeycloakService,
    private sharedService: SharedService
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
      window.scrollTo(0,document.body.scrollHeight);
    }, 0);
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

  logout() {
    this.nuxeo.logout();
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
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
  }

  checkForUserGroup() {
    const expectedRole = REPORT_ROLE;
    return this.sharedService.chekForReportRoles(expectedRole);
  }
}
