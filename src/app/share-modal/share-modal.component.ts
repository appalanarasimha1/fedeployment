import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";

@Component({
  selector: 'app-share-modal',
  templateUrl: './share-modal.component.html',
  styleUrls: ['./share-modal.component.css']
})
export class ShareModalComponent implements OnInit {

  @Input() input_data: any;
  @Input() input_folder_structure: any;
  @Output() markIsPrivate: EventEmitter<any> = new EventEmitter();
  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  docIsPrivate: boolean = false;
  error: string;
  folderStructure:any =[];
  lockInfo:boolean;
  peopleInviteInput: string = "";
  copiedString;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ShareModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    
  }

  async closeModal(isUpdated = false) {
    this.dialogRef.close();
  }

  async updateRights() {
    this.closeModal(true);
  }

  copyLink() {
    console.log(', this.doc = ');
  }
}
