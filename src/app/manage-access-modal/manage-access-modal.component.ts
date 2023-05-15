import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
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

  @Input() input_data: any;
  @Input() input_folder_structure: any;
  @Output() markIsPrivate: EventEmitter<any> = new EventEmitter();
  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  docIsPrivate: boolean = false;
  error: string;
  folderStructure:any =[]

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ManageAccessModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.selectedFolder = this.input_data || this.data.selectedFolder;
    this.docIsPrivate = this.selectedFolder.properties['dc:isPrivate'] || false;
    this.folderStructure = this.input_folder_structure
    console.log("sdfg",this.input_folder_structure);
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
    } else  {
      this.dataService.folderPermissionInit(true)
      if(this.input_data) {
        this.input_data.properties['dc:isPrivate'] = true;``
        this.markIsPrivate.emit(this.input_data);
      } else 
        this.closeModal(true);
    }
  }

  getCheckAction(event) {
    if (event.target.checked) {
      this.makePrivate = true;
    } else {
      this.makePrivate = false;
    }
  }

}
