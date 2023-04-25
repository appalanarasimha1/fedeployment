import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';

@Component({
  selector: 'app-manage-access-modal',
  templateUrl: './manage-access-modal.component.html',
  styleUrls: ['./manage-access-modal.component.css']
})
export class ManageAccessModalComponent implements OnInit {

  @Input() input_data: any;
  @Input() input_folder_structure: any;
  @Output() markIsPrivate: EventEmitter<any> = new EventEmitter();
  @ViewChild('addUserModal') addUserModal: AddUserModalComponent;

  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  docIsPrivate: boolean = false;
  isPrivate: boolean = false;
  error: string;
  folderStructure:any =[];
  lockInfo: boolean;
  peopleInviteInput: string = "";
  selectedCity: any;
  folderCollaborators = {};
  lockedChilds = [];
  user = "";

  confidentiality = [
    {id: 1, name: 'Confidential'},
    {id: 2, name: 'Non-confidential'}
  ];
  accessRight = [
    {id: 1, name: 'Public - external collaborators'},
    {id: 2, name: 'Internal - employees and contractors with NEOM emails'}
  ];

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ManageAccessModalComponent>,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem("user"))["username"];
    this.selectedFolder = this.input_data || this.data.selectedFolder;
    this.isPrivate = this.selectedFolder.properties['dc:isPrivate'] || false;
    this.docIsPrivate = this.isPrivate;
    this.folderStructure = this.input_folder_structure;
    this.folderCollaborators = this.sharedService.getFolderCollaborators(this.selectedFolder) || {};
    if (!this.isPrivate) this.getLockedChild();
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
    const result = await this.apiService.get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended`,
      {headers: { "fetch-document": "properties"}}).toPromise();
    return result;
  }

  async getLockedChild() {
    const payload = {
      params: {},
      context: {},
      input: this.selectedFolder.uid,
    };
    const res = await this.apiService.post(apiRoutes.GET_CHILD_LOCK_FOLDERS, payload).toPromise();
    const locked = res['value'] || [];
    this.lockedChilds = locked.filter(data => data[1] !== this.user);
  }

  async updateRights() {
    // if (!this.makePrivate) return;
    if (this.isPrivate === this.docIsPrivate) {
      this.addUserModal.saveChanges();
      this.closeModal(true);
      return;
    }
    const params = {
      isPrivate: this.docIsPrivate
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
        this.input_data.properties['dc:isPrivate'] = true;
        this.markIsPrivate.emit(this.input_data);
      } else
        this.closeModal(true);
    }

    this.addUserModal.saveChanges();
  }

  getCheckAction(event) {
    if (event.target.checked) {
      this.makePrivate = true;
    } else {
      this.makePrivate = false;
    }
  }

  togglerUserActivated(event) {
    this.docIsPrivate = !this.docIsPrivate;
  }

  removeWorkspacesFromString(value: string) {
    return this.sharedService.removeWorkspacesFromString(value);
  }
}
