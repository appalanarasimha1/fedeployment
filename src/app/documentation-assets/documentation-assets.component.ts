import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UploadModalComponent } from '../upload-modal/upload-modal.component';
import { NgxMasonryOptions } from 'ngx-masonry';
import { NgxMasonryComponent } from "ngx-masonry";
import { SharedService } from "../services/shared.service";

@Component({
  selector: 'app-documentation-assets',
  templateUrl: './documentation-assets.component.html',
  styleUrls: ['./documentation-assets.component.css']
})
export class DocumentationAssetsComponent implements OnInit {

  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;

  constructor(
    public matDialog: MatDialog,
    public sharedService: SharedService,
  ) { }

  public masonryOptions: NgxMasonryOptions = {
		gutter: 10,
		resize: true,
		initLayout: true,
		fitWidth: true
	};

  masonryImages;
	limit = 15;
	dummyPictures = [
		{
			picture: 'https://source.unsplash.com/433x649/?Uruguay'
		},
		{
			picture: 'https://source.unsplash.com/530x572/?Jamaica'
		},
		{
			picture: 'https://source.unsplash.com/531x430/?Kuwait'
		},
		{
			picture: 'https://source.unsplash.com/586x1073/?Bermuda'
		},
		{
			picture: 'https://source.unsplash.com/500x571/?Ecuador'
		},
		{
			picture: 'https://source.unsplash.com/579x518/?Virgin Islands (British)'
		},
		{
			picture: 'https://source.unsplash.com/503x548/?Angola'
		},
		{
			picture: 'https://source.unsplash.com/511x630/?Mauritania'
		},
		{
			picture: 'https://source.unsplash.com/414x767/?Sri Lanka'
		},
		{
			picture: 'https://source.unsplash.com/443x704/?St. Helena'
		}
	];
  public updateMasonryLayout = false;


  ngOnInit(): void {
    // this.masonryImages = this.dummyPictures.slice(0);
    this.sharedService.getSidebarToggle().subscribe(() => {
      this.updateMasonryLayout = !this.updateMasonryLayout;
    });
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
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
  }

  completeLoadingMasonry(event: any) {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }

}
