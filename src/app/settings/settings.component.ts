import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiService } from "../services/api.service";
import { apiRoutes } from "src/app/common/config";
import { SharedService } from "src/app/services/shared.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    public sharedService: SharedService,)
  { }

  managedUsers = [];
  managedUsersMap = {};
  loading = false;
  showUserSettingPage = false;
  showUserAccessPage = false;
  currentEditingUser = null;
  currentUserFolderList = [];


  ngOnInit(): void {
    this.managedUsers = [];
  }

  async fetchManagedExternalUsers() {
    this.backToUserList();
    const body = {
      context: {},
      params: {},
    };
    this.loading = true;
    const res = await this.apiService.post(apiRoutes.GET_MANAGED_EXT_USERS, body).toPromise();
    this.managedUsersMap = res['value'] || {};
    this.loading = false;
    this.showUserSettingPage = true;
    if (this.managedUsersMap) {
      this.managedUsers = Object.keys(this.managedUsersMap);
    }
  }

  openEditUserAccess(user) {
    this.showUserSettingPage = false;
    this.showUserAccessPage = true;
    this.currentEditingUser = user;
    this.currentUserFolderList = this.managedUsersMap[user] || [];
  }

  backToUserList() {
    this.showUserSettingPage = true;
    this.showUserAccessPage = false;
    this.currentEditingUser = null;
    this.currentUserFolderList = [];
  }

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

}
