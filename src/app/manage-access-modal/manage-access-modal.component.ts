import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { IChildAssetACL } from '../common/interfaces';
import { ACCESS, ALLOW } from '../upload-modal/constant';

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
  folderCollaborators = {};
  lockedChildren = [];
  user = "";
  childAssetOwners: IChildAssetACL[];

  confidentiality;
  confidentialityDropdown = [
    {id: "Confidential", name: 'Confidential'},
    {id: "Not Confidential", name: 'Non-confidential'}
  ];
  accessRight;
  accessRightDropdown = [
    {id: "All access", name: 'Public - external collaborators'},
    {id: "Internal access only", name: 'Internal - employees and contractors with NEOM emails'}
  ];
  downloadApproval: boolean = false;
  loading: boolean = false;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ManageAccessModalComponent>,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // this.getfolderAcl();
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

  async getfolderAcl(): Promise<IChildAssetACL[]> {
    const result: any = await this.apiService.get(`/folderACL/${this.selectedFolder.uid}`).toPromise();
    return result;
  }

  async getLockedChild() {
    const payload = {
      params: {},
      context: {},
      input: this.selectedFolder.uid,
    };
    // const res = await this.apiService.post(apiRoutes.GET_CHILD_LOCK_FOLDERS, payload).toPromise();
    const res: IChildAssetACL[] = await this.getfolderAcl();
    this.childAssetOwners = res || [];
    this.lockedChildren = this.childAssetOwners.filter((data: IChildAssetACL) => data.isPrivate === "true");
    this.childAssetOwners.forEach((data: any) => {
      if(this.folderCollaborators[data.creator]) {
        return;
      }
      this.folderCollaborators[data.creator] = this.sharedService.createAdminCollaborator(data);
    })
  }

  async updateRights() {
    // if (!this.makePrivate) return;
    // TODO: check for permission in context-parameter, open only if user if admin i.e permission = 'Everything
    if (this.isPrivate === this.docIsPrivate) {
      this.loading = true;
      this.addUserModal?.saveChanges();
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
    if (res['value'] !== this.apiService.API_RESPONSE_MESSAGE.OK) {
      this.error = res['value'];
    } else  {
      if(this.isPrivate && !this.docIsPrivate) {
        await this.setAccessRights();
      }
      this.dataService.folderPermissionInit(this.docIsPrivate)
      if(this.input_data) {
        this.input_data.properties['dc:isPrivate'] = true;
        this.markIsPrivate.emit(this.input_data);
      } else
        this.closeModal(true);
    }
    
    this?.addUserModal?.saveChanges() || this.closeModal(true);
  }

  async setAccessRights() {
    try {
      const allow = this.accessRight.id === ACCESS.all ? ALLOW.any : ALLOW.internal;
      const payload = {
        "uid": this.selectedFolder.uid,
        "parameters": {
            "sa:access": this.accessRight.id,
            "sa:allow": allow,
            "sa:confidentiality": this.confidentiality.id,
            "sa:copyrightName": null,
            "sa:copyrightYear": null,
            "sa:downloadApproval": this.downloadApproval
        }
      }
      const res = await this.apiService.post(apiRoutes.SET_UNLOCK_ASSET_ACL, payload).toPromise();
      if (res['value'] === this.apiService.API_RESPONSE_MESSAGE.SUCCESS) {
        this.error = res['value'];
      }
    } catch (err) {
      this.sharedService.showSnackbar(
        err?.error?.error?.message,
        5000,
        "top",
        "center",
        "snackBarMiddle")
    }
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

  acknowledgeParent(event: {[id: string]: boolean}) {
    event?.closeModal ? this.closeModal(true) : this.loading = false;
    return;
  }
}
