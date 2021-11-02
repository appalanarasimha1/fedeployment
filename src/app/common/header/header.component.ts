import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../../upload-modal/upload-modal.component';
import { NuxeoService } from '../../services/nuxeo.service';
import * as $ from 'jquery';

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
    public matDialog: MatDialog
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        // TODO: will break if we have another url that contains /user.
        if(event.url === '/browse') {
          this.showBrowseHeader = true;
        } else {
          this.showBrowseHeader = false;
        }
        if (event.url === '/') {
          this.searchHeader = false;
        } else {
          this.searchHeader = true;
        }
      }
    });

    if( window.location.pathname === '/browse') {
      this.showBrowseHeader = true;
    } else {
      this.showBrowseHeader = false;
    }

    if (window.location.pathname === '/') {
      this.searchHeader = false;
    } else {
      this.searchHeader = true;
    }

  }

  ngOnInit() {
    $(window).on('scroll', () => {
      const scroll = $(window).scrollTop();
      if (scroll >= 80 && scroll <= 4000) {
        $('.searchHeading').addClass('fixedHeader');
      } else {
        $('.searchHeading').removeClass('fixedHeader');
      }
    });
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.sendSelectedTab.emit(tab);
    if (tab === 'search') {
      this.router.navigate(['search']);
    }
    if (tab === 'browse') {
      this.router.navigate(['browse']);
    }
  }

  logout() {
    this.nuxeo.logout();
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px"
    dialogConfig.width = "650px";
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
  }
}
