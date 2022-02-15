import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../../upload-modal/upload-modal.component';
import { NuxeoService } from '../../services/nuxeo.service';
import { KeycloakService } from 'keycloak-angular';
import * as $ from 'jquery';
import { DataService } from '../../services/data.service';
import { TRIGGERED_FROM_SUB_HEADER } from '../constant';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() sendSelectedTab: EventEmitter<any> = new EventEmitter();

  selectedTab: string;
  searchHeader: boolean;
  showBrowseHeader = false;

  constructor(
    private nuxeo: NuxeoService,
    private router: Router,
    public matDialog: MatDialog,
    public dataService: DataService,
    protected readonly keycloak: KeycloakService,
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        // TODO: will break if we have another url that contains /user.
        if(event.url === '/workspace' || event.url === '/common/terms' || event.url === 'report') {
          this.showBrowseHeader = true;
        } else {
          this.showBrowseHeader = false;
        }
        if (event.url === '/') {
          this.searchHeader = true;
        } else {
          this.searchHeader = false;
        }
      }
    });

    if( window.location.pathname === '/workspace' || window.location.pathname === '/common/terms' || window.location.pathname === '/report') {
      this.showBrowseHeader = true;
    } else {
      this.showBrowseHeader = false;
    }

    if (window.location.pathname === '/') {
      this.searchHeader = true;
    } else {
      this.searchHeader = false;
    }

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
      this.router.navigate(['','#favorites']);
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
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.groups.indexOf('reportAdmin') != -1;
  }
}
