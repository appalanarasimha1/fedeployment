import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  files: File[] = [];
  showInfo: boolean = false;
  cancleBlock: boolean = false;
  countFile:boolean = true;

  constructor(
    public dialogRef: MatDialogRef<UploadDroneComponent>,
  ) { }

  ngOnInit(): void {
    this.showUpload = false;
  }

  closeModal() {
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

  onSelect(event) {
    console.log(event.addedFiles);
    let type: any = event.addedFiles[0].name.split('.');
    type = type[type.length - 1];
    console.log(type);

    this.files.push(...event.addedFiles);
    this.countFile = false;
  }

  onRemove(event) {
    console.log(event);
    this.files.splice(this.files.indexOf(event), 1);
    this.showInfo = false;
    this.countFile = true;
  }
  gettingInfo(event) {
    event.stopPropagation();
    this.showInfo = !this.showInfo;
  }

  cancleShowHide() {
    this.cancleBlock = !this.cancleBlock;
  }

}
