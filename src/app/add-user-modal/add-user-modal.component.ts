import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent implements OnInit {
  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
  }

  closeModal() {
    if(this.data?.sectorId) {
      this.dialogRef.close(this.uploadedAsset);
      return;
    }
    this.dialogRef.close(this.selectedFolder);
  }

  getCheckAction(event) {
    if (event.target.checked) {
      this.makePrivate = true;
    } else {
      this.makePrivate = false;
    }
  }

}
