import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";

@Component({
  selector: 'app-manage-access-modal',
  templateUrl: './manage-access-modal.component.html',
  styleUrls: ['./manage-access-modal.component.css']
})
export class ManageAccessModalComponent implements OnInit {

  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  docIsPrivate: boolean = false;
  error: string;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ManageAccessModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.selectedFolder = this.data.selectedFolder;
    this.docIsPrivate = this.selectedFolder.properties['dc:isPrivate'] || false;
  }

  async closeModal(isUpdated = false) {
    if (isUpdated) {
      this.selectedFolder = await this.fetchFolder(this.selectedFolder.uid);
      this.dialogRef.close(this.selectedFolder);
      return;
    }
    this.dialogRef.close();
  }

  async fetchFolder(id) {
    const result = await this.apiService.get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended&depth=children`,
      {headers: { "fetch-document": "properties"}}).toPromise();
    return result;
  }

  async updateRights() {
    if (!this.makePrivate) return;
    this.dataService.folderPermissionInit(true)
    const params = {
      isPrivate: !this.docIsPrivate
    };
    const payload = {
      params,
      context: {},
      input: this.selectedFolder.uid,
    };
    const res = await this.apiService.post(apiRoutes.UPDATE_FOLDER_RIGHTS, payload).toPromise();
    if (res['value'] !== 'OK') {
      this.error = res['value'];
    } else this.closeModal(true);
  }

  getCheckAction(event) {
    if (event.target.checked) {
      this.makePrivate = true;
    } else {
      this.makePrivate = false;
    }
  }

}
