import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from "@angular/router";
import { ApiService } from "../services/api.service";
import { apiRoutes } from "src/app/common/config";
import { SharedService } from "src/app/services/shared.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AddUserPrivateFolderModalComponent } from '../add-user-private-folder-modal/add-user-private-folder-modal.component';
import { REPORT_ROLE } from '../common/constant';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    public sharedService: SharedService,
    public matDialog: MatDialog,
    private router: Router,
    )
  { }

  managedUsers = [];
  managedUsersBackUp=[];
  managedUsersMap = {};
  loading = false;
  showUserSettingPage = false;
  showUserAccessPage = false;
  currentEditingUser = null;
  currentUserFolderList = [];

  showUserManageSuppliers: boolean = false;
  showUserManageLocations: boolean = false;


  ngOnInit(): void {
    if (this.sharedService.checkExternalUser()) this.router.navigate(['workspace']);
    this.managedUsers = [];
    this.managedUsersBackUp=[];
    // this.fetchManagedExternalUsers()
  }

  // async fetchManagedExternalUsers() {
  //   this.backToUserList();
  //   const body = {
  //     context: {},
  //     params: {},
  //   };
  //   this.loading = true;
  //   const res = await this.apiService.post(apiRoutes.GET_MANAGED_EXT_USERS, body).toPromise();
  //   this.managedUsersMap = res['value'] || {};
  //   this.loading = false;
  //   this.showUserSettingPage = true;
  //   this.showUserManageSuppliers = false;
  //   this.showUserManageLocations = false;
  //   if (this.managedUsersMap) {
  //     this.managedUsers = Object.keys(this.managedUsersMap);
  //     this.managedUsersBackUp = Object.keys(this.managedUsersMap);
  //   }
  // }

  openEditUserAccess(user) {
    this.showUserSettingPage = false;
    this.showUserAccessPage = true;
    this.currentEditingUser = user;
    this.currentUserFolderList = this.managedUsersMap[user] || [];
    this.showUserManageSuppliers = false;
    this.showUserManageLocations = false;
  }

  // backToUserList() {
  //   this.showUserSettingPage = true;
  //   this.showUserAccessPage = false;
  //   this.currentEditingUser = null;
  //   this.currentUserFolderList = [];
  //   this.managedUsers = this.managedUsersBackUp;
  //   this.showUserManageSuppliers = false;
  //   this.showUserManageLocations = false;
  //   this.showUserAccessPage = false;
  // }

  async removeAllAccess(user) {
    const folders = this.managedUsersMap[user] || [];
    const promiseCall = [];
    this.loading = true;
    folders.forEach(folder => {
      promiseCall.push(this.removeFolderPermission(folder));
    });
    await Promise.all(promiseCall);
    delete this.managedUsersMap[user];
    this.managedUsers = Object.keys(this.managedUsersMap);
    this.loading = false;
  }

  async removePermission(folder, index) {
    this.loading = true;
    await this.removeFolderPermission(folder);
    this.currentUserFolderList.splice(index, 1);
    this.loading = false;
  }

  async onEndDateChange(value, folder, index) {
    if (!value) return;
    folder.end = value.getTime();
    this.loading = true;
    await this.updateFolderPermission(folder);
    this.updateFolderEndDate(value, index);
    this.sharedService.showSnackbar(
      'Access expiry has been set',
      5000,
      "top",
      "center",
      "snackBarMiddle",
    );
    this.loading = false;
  }

  updateFolderEndDate(end, index) {
    this.currentUserFolderList[index].end = end.getTime();
  }

  calculateEndDate(end) {
    return new FormControl(new Date(parseInt(end)));
  }

  updateFolderPermission(folder) {
    const params = {
      permission: "Read",
      comment: "",
      id: folder.permissionId,
      username: this.currentEditingUser,
      end: new Date(parseInt(folder.end)),
    };
    if (folder.permissionId.includes("transient/")) {
      params['username'] = 'transient/' + this.currentEditingUser;
    }
    const payload = {
      params,
      context: {},
      input: folder.id,
    };
    return this.apiService.post(apiRoutes.REPLACE_PERMISSION, payload).toPromise();
  }

  removeFolderPermission(folder) {
    const params = {
      acl: "local",
      id: folder.permissionId,
    };
    const payload = {
      params,
      context: {},
      input: folder.id,
    };
    return this.apiService.post(apiRoutes.REMOVE_PERMISSION, payload).toPromise();
  }

  async openAddUserPrivateFolderModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "640px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    // dialogConfig.data = {
    //   selectedFolder: this.selectedFolder,
    //   folderId: this.selectedFolder.uid,
    // }

    const modalDialog = this.matDialog.open(AddUserPrivateFolderModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {

      }
    });
  }

  searchUser(e){
    e.target.value ?
      this.managedUsers = this.managedUsersBackUp.filter(user => user.toLowerCase().includes(e.target?.value?.toLowerCase().trim())):
      this.managedUsers = this.managedUsersBackUp
  }

  fetchManagedSuppliers() {
    this.loading = true;
    this.showUserSettingPage = false;
    this.showUserAccessPage = false;
    this.showUserManageSuppliers = true;
    this.showUserManageLocations = false;
    this.loading = false;
  }
  // fetchManagedLocations() {
  //   this.showUserManageLocations = true;
  //   this.loading = true;
  //   this.showUserSettingPage = false;
  //   this.showUserAccessPage = false;
  //   this.showUserManageSuppliers = false;
  //   this.loading = false;
  // }

  checkReportRole() {
    const expectedRole = REPORT_ROLE;
    return this.sharedService.chekForReportRoles(expectedRole);
  }
}
