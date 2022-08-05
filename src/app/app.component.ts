import { Component, OnInit} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from './upload-modal/upload-modal.component';
import { DataService } from './services/data.service';
import { NuxeoService } from './services/nuxeo.service';
import { fadeAnimation } from './animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent implements OnInit{
  title = 'groundx';
  showHeader = false;
  showAddButton = false;
  showFooter = false;

  constructor(
    private router: Router,
    public matDialog: MatDialog,
    private dataService: DataService,
    private nuxeoService: NuxeoService) {

      router.events.forEach((event: any) => {
        // if(event.urlAfterRedirects === '/login') {
        //   this.showFooter = true;
        //   this.showHeader = false;
        // }
        if (event.url && event instanceof NavigationStart) {
          // TODO: will break if we have another url that contains /user.
          if (event.url.includes('/login') || event.url.includes('/signup') || event.url.includes('/forgot-password')) {
            this.showHeader = false;
            this.showAddButton = false;
            setTimeout(()=>{
              this.showFooter = true;
            }, 500);
          } else if(event.url.includes('/404')){
            this.showHeader = true;
            this.showAddButton = false;
            setTimeout(()=>{
              this.showFooter = true;
            }, 500);
          }  else if(event.url.includes('/asset-not-accessed')){
            this.showHeader = false;
            this.showAddButton = false;
            setTimeout(()=>{
              this.showFooter = true;
            }, 500);
          } else {
            this.showHeader = true;
            setTimeout(()=>{
              this.showFooter = true;
            }, 500);
            this.showAddButton = true;
          }
          console.log('this.showHeader = ', this.showHeader);
        }

      });
  }

  ngOnInit() {
    // if(!this.nuxeoService.isAuthenticated()) {
    //   this.showHeader = false;
    //   this.showFooter = true;
    //   return;
    // }
  }

  checkSelectedTab(tab: string) {
    // if(tab.toLowerCase() === 'search') {
    //   this.showHeader =
    // }
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
  onActivate() {
    $("body").animate({ scrollTop: 0 }, "slow");
    // window.scroll(0,0);
  }
}

