import { Component, OnInit} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from './upload-modal/upload-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'groundx';
  showHeader = false;
  showAddButton = false;

  constructor(private router: Router, public matDialog: MatDialog) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        // TODO: will break if we have another url that contains /user.
        if (event.url.includes('/login')) {
          this.showHeader = false;
          this.showAddButton = false;
        } else {
          this.showHeader = true;
          this.showAddButton = true;
        }
      }
    });
  }

  ngOnInit() {
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
}
