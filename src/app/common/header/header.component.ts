import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
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

  constructor(
    private nuxeo: NuxeoService,
    private router: Router
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        // TODO: will break if we have another url that contains /user.
        if (event.url === '/') {
          this.searchHeader = false;
        } else {
          this.searchHeader = true;
        }
      }
    });

    if (window.location.pathname === '/') {
      this.searchHeader = false;
    } else {
      this.searchHeader = true;
    }
  }

  ngOnInit() {
    $(window).on( 'scroll', () => {
      const scroll = $(window).scrollTop();
      if (scroll >= 80 && scroll <= 9000) {
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
  }

  logout() {
    this.nuxeo.logout();
  }
}
