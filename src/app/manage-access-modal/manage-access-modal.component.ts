import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { IChildAssetACL } from '../common/interfaces';
import { ACCESS, ALLOW, CONFIDENTIALITY, SPECIFIC_USER_LABEL } from '../upload-modal/constant';
import { concat, Observable, of, Subject } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  map,
  filter,
} from "rxjs/operators";

interface FileByIndex {
  [index: string]: File;
}

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
  loggedInUserName = "";
  childAssetOwners: IChildAssetACL[];
  computedCollaborators = {};

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

  overallConfidentiality: string;
  overallAccess: string;
  access: string;
  allow: string;
  customAccessMap: any = {};
  customConfidentialityMap: any = {};
  customDownloadApprovalUsersMap: any = {};
  customDownloadApprovalMap: any = {};
  overallDownloadApproval: boolean = false;
  filesMap: FileByIndex = {};
  customUsersMap: any = {};
  overallUsers: string[] = [];
  userList$: Observable<any>;
  userLoading: boolean = false;
  userInput$ = new Subject<string>();

  readonly SPECIFIC_USER_LABEL = SPECIFIC_USER_LABEL;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<ManageAccessModalComponent>,
    public sharedService: SharedService,
    public dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // this.getfolderAcl();
    this.loggedInUserName = JSON.parse(localStorage.getItem("user"))["username"];
    this.selectedFolder = this.input_data || this.data.selectedFolder;
    this.isPrivate = this.selectedFolder.properties['dc:isPrivate'] || false;
    this.docIsPrivate = this.isPrivate;
    this.folderStructure = this.input_folder_structure;
    this.folderCollaborators = this.sharedService.getFolderCollaborators(this.selectedFolder) || {};
    
    Object.keys(this.folderCollaborators).forEach((key) => {
      this.updateComputedCollaborators(this.folderCollaborators[key]);
    });
    if (!this.isPrivate) this.getLockedChild();

    this.loadUsers()
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
    this.loading = true;
    if (this.isPrivate === this.docIsPrivate) {
      await this.addUserModal?.saveChanges();
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

    // NOTE: check for classification when unlocking the folder
    if(this.isPrivate && !this.docIsPrivate) {
      if(!this.accessRight?.id || !this.confidentiality?.id) {
        this.sharedService.showSnackbar(
          "Please select classification settings before moving ahead",
          2500,
          "top",
          "center",
          "snackBarMiddle"
        );
        this.loading = false;
        return;
      }
    }
    const res = await this.apiService.post(apiRoutes.UPDATE_FOLDER_RIGHTS, payload).toPromise();
    const responseMessage = JSON.parse(res['value']);
    if (responseMessage?.status !== this.apiService.API_RESPONSE_MESSAGE.OK) {
      this.error = responseMessage?.status;
    } else  {
      if(this.isPrivate && !this.docIsPrivate) {
        await this.setAccessRights();
        await this.removeAllPermission();
        this.sharedService.showSnackbar(
          "Folder unlocked successfully",
          3000,
          "top",
          "center",
          "snackBarMiddle"
        );
        
      }
      this.dataService.folderPermissionInit(this.docIsPrivate);
      if(this.input_data) {
        this.input_data.properties['dc:isPrivate'] = true;
        this.markIsPrivate.emit(this.input_data);
      } else {
        this?.addUserModal?.saveChanges() || this.closeModal(true);
        return;
      }
    }

    
  }

  async removeAllPermission() {
    await this.sharedService.removeAllPermissions(this.computedCollaborators, this.selectedFolder.properties['dc:creator'].id, this.loggedInUserName, this.selectedFolder.uid);
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
            "sa:downloadApproval": this.downloadApproval,
            "sa:downloadApprovalUsers": this.overallUsers
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
  
  updateComputedCollaborators(item) {
    const permission = item.permission;
    const key = item.user;
    if (!this.computedCollaborators[key]) {
      this.computedCollaborators[key] = {...item};
      delete this.computedCollaborators[key].permission;
      this.computedCollaborators[key].permissions = {};
    }
    if (item.notExisted) this.computedCollaborators[key].notExisted = true;
    this.computedCollaborators[key].end = item.end;
    if (item.permissions) {
      this.computedCollaborators[key].permissions = item.permissions;
    }
    if (permission?.includes('CanUpload')) {
      this.computedCollaborators[key].permissions.canUpload = true;
    }
    if (permission?.includes('CanDownload')) {
      this.computedCollaborators[key].permissions.canDownload = true;
    }
    if (permission?.includes('Everything')) {
      this.computedCollaborators[key].permissions.isAdmin = true;
    }
    if (item.user === this.selectedFolder?.properties["dc:creator"]?.id) {
      this.computedCollaborators[key].permissions.isOwner = true;
    }
  }

  checkAccessOptionDisabled(value: {[id: string]: string}) {
    if (!this.confidentiality || this.confidentiality.id === CONFIDENTIALITY.not)
      return false;
    if (value.id === ACCESS.all) {
      return true;
    }
    if (value.id === ALLOW.any) {
      return true;
    }
    return false;
  }

  checkConfidentialityOptionDisabled(value: {[id: string]: string}) {
    // if (!this.confidentiality || this.confidentiality.id === CONFIDENTIALITY.not)
    //   return false;
    if (this.accessRight?.id === ACCESS.all && value.id === CONFIDENTIALITY.confidential) {
      return true;
    }
    // if (value.id === ALLOW.any) {
    //   return true;
    // }
    return false;
  }

  isUserOwner() {
    return this.loggedInUserName === this.selectedFolder?.properties["dc:creator"]?.id; 
  }

  // checkShowUserDropdown(fileIndex?: any) {
  //   const access =
  //     fileIndex == null
  //       ? this.overallAccess
  //       : this.customAccessMap[fileIndex] || this.access;
  //   const confidentiality =
  //     fileIndex == null
  //       ? this.overallConfidentiality
  //       : this.customConfidentialityMap[fileIndex] || this.confidentiality;
  //   if (access === ACCESS.restricted) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  onCheckDownloadApproval(event) {
    this.overallUsers = [this.loggedInUserName];
  }

  getAssetNumber(): number {
    return Object.keys(this.filesMap).length;
  }

  userOverall() {
    const len = Object.keys(this.filesMap).length;
    for (let i = 0; i < len; i++) {
      this.customUsersMap[i] = this.overallUsers;
    }
  }

  trackByFn(item: any) {
    return item.id;
  }
  
  loadUsers() {
    this.userList$ = concat(
      of([]),
      this.userInput$.pipe(
        filter((res) => {
          return res !== null && res.length >= 2;
        }),
        distinctUntilChanged(),
        debounceTime(300),
        tap(() => (this.userLoading = true)),
        switchMap((term) => {
          return this.searchUser(term).pipe(
            catchError(() => of([])),
            tap(() => (this.userLoading = false))
          );
        })
      )
    );
  }
  
  searchUser(term) {
    this.userLoading = true;
    const params = {
      q: term.toLowerCase(),
      currentPageIndex: 0,
    };
    return this.apiService.get(apiRoutes.SEARCH_USER, { params }).pipe(
      map((resp) => {
        return resp["entries"].map((entry) => ({
          id: entry.id,
          fullname: `${entry.properties.firstName || ""} ${
            entry.properties.lastName || ""
          }`.trim(),
        }));
      })
    );
  }


}