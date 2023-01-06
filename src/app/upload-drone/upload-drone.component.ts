import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { concat, Observable, of, Subject } from "rxjs";

@Component({
  selector: 'app-upload-drone',
  templateUrl: './upload-drone.component.html',
  styleUrls: ['./upload-drone.component.css']
})
export class UploadDroneComponent implements OnInit {

  userWorkspaceInput$ = new Subject<string>();

  searchPopup: boolean = false;
  tagClicked: boolean = false;
  searchText: string = "";
  showUpload: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UploadDroneComponent>,
  ) { }

  ngOnInit(): void {
  }

  openBrowseRoute() {
    this.dialogRef.close();
  }

  onSearchBarChange(e) {
    
  }
  blurOnSearch() {
    console.log("this.searchText", this.searchText);

    if (this.tagClicked) {
    } else {
      setTimeout(() => {
        this.searchPopup = false;
      }, 500);
    }
  }

  inputClicked() {
    this.searchPopup = true;
    this.tagClicked = false;
  }

  outClick() {
    console.log("qwertgyhuiop");
  }

  showUploadBlock() {
    this.showUpload = !this.showUpload;
  }

}
