import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
import { EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER } from "../common/constant";
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';

import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { EditAccessComponent } from '../edit-access/edit-access.component';

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent implements OnInit {
  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  userList$: Observable<any>;
  userList = [];
  userInput$ = new Subject<string>();
  userLoading = false;
  folderCollaborators = {};
  internalCollaborators = {};
  externalCollaborators = {};
  selectedCollaborator: any;
  addedCollaborators: {};
  addedExternalUsers: {};
  removedCollaborators: {};
  updatedCollaborators: {};
  invitedCollaborators: {};
  selectedExternalUser: any;
  folderId: string;
  folderUpdated: any;
  closeResult: string;
  userInputText = "";
  selectedMonth;
  month = [
    {id: 1, name: '1 month'},
    {id: 2, name: '2 month'},
    {id: 3, name: '3 month'},
    {id: 4, name: '4 month'},
    {id: 5, name: '5 month'}
  ];
  listExternalUser: string[] = [];
  listExternalUserGlobal: string[] = [];
  isGlobal = false;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private modalService: NgbModal,
    public matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.getExternalGroupUser();
    this.getExternalGlobalGroupUser();
    this.selectedFolder = this.data.selectedFolder;
    this.folderId = this.data.folderId;
    this.folderCollaborators = this.data.folderCollaborators || {};
    this.addedCollaborators = {};
    this.addedExternalUsers = {};
    this.removedCollaborators = {};
    this.updatedCollaborators = {};
    this.invitedCollaborators = {};
    this.listExternalUser = [];
    this.listExternalUserGlobal = [];
    this.computeCollaborators();
    this.loadUsers();
  }

  closeModal() {
    this.dialogRef.close(this.folderUpdated);
  }

  computeCollaborators() {
    this.externalCollaborators = {};
    this.internalCollaborators = {};
    Object.keys(this.folderCollaborators).forEach(key => {
      if ((this.folderCollaborators[key].externalUser
        || this.listExternalUser.includes(key)) && !this.checkTransientNeomEmail(key)) {
        this.externalCollaborators[key] = this.folderCollaborators[key];
      } else {
        this.internalCollaborators[key] = this.folderCollaborators[key];
      }
    });
  }

  selectChange(item) {
    this.userInputText = null;
    this.selectedCollaborator = null;
    const isExist = this.folderCollaborators[item.id];
    if (isExist) return;
    else if (this.listExternalUser.includes(item.id)) {
      const end = new Date();
      end.setMonth(new Date().getMonth() + 1);
      this.addedExternalUsers[item.id] = {
        end,
        user: {
          id: item.id,
          fullname: item.fullname
        },
        permission: "Read",
        duration: 1,
      }
    } else {
      this.addedCollaborators[item.id] = {
        user: {
          id: item.id,
          fullname: item.fullname
        },
        permission: "ReadWrite"
      }
    }
  }

  canSave() {
    return Object.keys(this.addedCollaborators).length > 0
    || Object.keys(this.removedCollaborators).length > 0
    || Object.keys(this.updatedCollaborators).length > 0
    || Object.keys(this.invitedCollaborators).length > 0
    || Object.keys(this.addedExternalUsers).length > 0;
  }

  removeUser(userId, type) {
    if (type === 'added') {
      delete this.addedCollaborators[userId];
      delete this.addedExternalUsers[userId];
    } else if (type === 'removed') {
      this.removedCollaborators[userId] = this.folderCollaborators[userId];
      delete this.folderCollaborators[userId];
      delete this.updatedCollaborators[userId];
      this.computeCollaborators();
    } else if (type === 'invited') {
      delete this.invitedCollaborators[userId];
    }
  }

  makeAdmin(userId, type) {
    if (type === 'added') {
      if (!this.addedCollaborators[userId]) return;
      this.addedCollaborators[userId].permission = 'Everything';
    } else if (type === 'updated') {
      if (!this.updatedCollaborators[userId]) this.updatedCollaborators[userId] = this.folderCollaborators[userId];
      this.updatedCollaborators[userId].permission = 'Everything';
    }
  }

  removeAdmin(userId, type) {
    if (type === 'added') {
      if (!this.addedCollaborators[userId]) return;
      this.addedCollaborators[userId].permission = 'ReadWrite';
    } else if (type === 'updated') {
      if (!this.updatedCollaborators[userId]) this.updatedCollaborators[userId] = this.folderCollaborators[userId];
      this.updatedCollaborators[userId].permission = 'ReadWrite';
    }
  }

  async updateCollaborators() {
    if (!this.canSave()) return;
    for (const key in this.removedCollaborators) {
      await this.removePermission(this.removedCollaborators[key])
    }
    for (const key in this.updatedCollaborators) {
      await this.updatePermission(this.updatedCollaborators[key])
    }
    for (const key in this.addedCollaborators) {
      await this.addPermission(this.addedCollaborators[key])
    }
    for (const key in this.addedExternalUsers) {
      await this.addPermission(this.addedExternalUsers[key])
    }
    for (const key in this.invitedCollaborators) {
      await this.inviteUser(this.invitedCollaborators[key])
    }
    this.folderUpdated = await this.fetchFolder(this.folderId);
    this.closeModal();

    this.sharedService.showSnackbar(
      "Collaborators updated",
      4000,
      "top",
      "center",
      "snackBarMiddle"
    );
  }

  updatePermission(item) {
    if (this.listExternalUser.includes(item.user.id) && item.isGlobal != undefined) {
      this.updateExternalUserGroup(item.user.id, item.isGlobal);
    }
    if (this.listExternalUser.includes(item.user.id) && !item.end) {
      const end = new Date();
      end.setMonth(new Date().getMonth() + 1);
      item.end = end;
    }
    const params = {
      permission: item.permission,
      comment: "",
      username: item.user.id,
      id: item.id,
    };
    if (item.end) params['end'] = item.end;
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    return this.apiService.post(apiRoutes.REPLACE_PERMISSION, payload).toPromise();
  }

  addPermission(item) {
    if (this.listExternalUser.includes(item.user.id) && !item.end) {
      const end = new Date();
      end.setMonth(new Date().getMonth() + 1);
      item.end = end;
    }
    if (item.isGlobal != undefined && this.listExternalUser.includes(item.user.id)) {
      this.updateExternalUserGroup(item.user.id, item.isGlobal);
    }
    const params = {
      permission: item.permission,
      comment: "",
    };
    if (item.user.notExisted) {
      params["email"] = item.user.id
    } else {
      params["users"] = [item.user.id]
    }
    if (item.end) params['end'] = item.end;
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    return this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
  }

  removePermission(item) {
    const params = {
      acl: "local",
      id: item.id,
    };
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    return this.apiService.post(apiRoutes.REMOVE_PERMISSION, payload).toPromise();
  }

  async updateExternalUserGroup(email, isAdded) {
    const params = {
      email,
      isAdded,
    };
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    await this.apiService.post(apiRoutes.UPDATE_EXTERNAL_GROUP_USER, payload).toPromise();
    this.sharedService.fetchExternalUserInfo();
  }

  async fetchFolder(id) {
    const result = await this.apiService.get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended&depth=children`,
      {headers: { "fetch-document": "properties"}}).toPromise();
    return result;
  }

  async inviteUser(item) {
    const params = {
      permission: 'Read',
      email: item.user.id,
      end: item.end,
    };
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    await this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();

    const inviteUserParams = {
      folderName: this.selectedFolder.title,
      groundXUrl: location.protocol + '//' + location.host
    }
    const inviteUserPayload = {
      params: inviteUserParams,
      context: {},
      input: {
          "entity-type": "user",
          "id": "",
          "properties": {
            "username": item.user.id,
            "email": item.user.id,
            "groups": item.isGlobal ? [EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER] : [EXTERNAL_USER]
          }
      }
    }
    await this.apiService.post(apiRoutes.INVITE_USER, inviteUserPayload).toPromise();
  }

  getCheckAction(event) {
    if (event.target.checked) {
      this.makePrivate = true;
    } else {
      this.makePrivate = false;
    }
  }

  getUsername(item) {
    const name = item.user?.properties?.firstName + " " + (item.user?.properties?.lastName || "");
    return item.user?.properties?.firstName ? name : item.user?.id;
  }

  getExternalName(item) {
    return item.user.id.replace('transient/', '');
  }

  trackByFn(item: any) {
    return item.id;
  }

  searchUser(term) {
    this.userLoading = true;
    const params = {
      q: term.toLowerCase(),
      currentPageIndex: 0,
    };
    return this.apiService.get(apiRoutes.SEARCH_USER, {params}).pipe(
      map((resp) => {
        const entries = resp["entries"].map((entry) => ({
          id: entry.id,
          fullname: `${entry.properties.firstName || ""} ${
            entry.properties.lastName || ""
          }`.trim(),
        }));
        this.userList = entries;
        return entries;
      })
    );
  }

  canRemoveAdmin(item) {
    return item.user?.id !== this.selectedFolder?.properties["dc:creator"];
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
          this.userInputText = term;
          return this.searchUser(term).pipe(
            catchError(() => of([])),
            tap(() => (this.userLoading = false))
          );
        })
      )
    );
  }


  open(content, item) {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component1";
    dialogConfig.width = "640px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    this.selectedExternalUser = item;
    if (this.selectedExternalUser.end) {
      this.selectedMonth = this.selectedExternalUser.end;
    } else {
      this.selectedMonth = new Date();
    }
    if (this.listExternalUserGlobal.includes(this.selectedExternalUser.user?.id)) {
      this.isGlobal = true;
    }
    dialogConfig.data = {
      isGlobal: this.isGlobal,
      selectedMonth: this.selectedMonth
    }

    const modalDialog = this.matDialog.open(EditAccessComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedMonth = result.selectedMonth;
        this.selectedExternalUser.isGlobal = result.isGlobal;
        this.updateExternalUserAccess();
      }
      this.selectedMonth = undefined;
      this.isGlobal = undefined;

    });
  }

  updateExternalUserAccess() {
    const end = new Date(this.selectedMonth);
    // end.setMonth(new Date().getMonth() + this.selectedExternalUser.duration);
    if (this.externalCollaborators[this.selectedExternalUser.user.id]) {
      if (!this.updatedCollaborators[this.selectedExternalUser.user.id])
        this.updatedCollaborators[this.selectedExternalUser.user.id] = this.externalCollaborators[this.selectedExternalUser.user.id];
      this.updatedCollaborators[this.selectedExternalUser.user.id].end = end;
      if (this.selectedExternalUser.isGlobal !== undefined)
        this.updatedCollaborators[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    } else if (this.addedExternalUsers[this.selectedExternalUser.user.id]) {
      this.addedExternalUsers[this.selectedExternalUser.user.id].end = end;
      if (this.selectedExternalUser.isGlobal !== undefined)
        this.addedExternalUsers[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    } else {
      this.invitedCollaborators[this.selectedExternalUser.user.id].end = end;
      if (this.selectedExternalUser.isGlobal !== undefined)
        this.invitedCollaborators[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    }

    this.selectedExternalUser = undefined;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }

  checkInviteExternal(email = "") {
    if (!email) email = this.userInputText;
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && !this.selectedCollaborator) return true;
  }

  checkNeomEmail(email = "") {
    if (!email) email = this.userInputText;
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && email.split('@')[1] === "neom.com";
  }

  checkTransientNeomEmail(email) {
    if (email.includes('transient/')) return this.checkNeomEmail(email.split('/')[1]);
    return this.checkNeomEmail(email);
  }

  getEmailInUserList(email) {
    try {
      if (!this.userList) return null;
      const res = this.userList.find(user => user.id === email);
      return res;
    } catch (err) {
      return null;
    }
  }

  sendInvite(isNeom = false) {
    const invitedEmail = this.userInputText;
    const existedUser = this.getEmailInUserList(invitedEmail);
    if (existedUser) {
      this.selectChange(existedUser);
      return;
    }
    this.userInputText = "";
    const end = new Date();
    end.setMonth(new Date().getMonth() + 1);
    if (isNeom) {
      end.setMonth(new Date().getMonth() + 100);
      this.addedCollaborators[invitedEmail] = {
        user: {
          id: invitedEmail,
          notExisted: true
        },
        permission: "Read",
        end
      }
      return;
    }
    this.invitedCollaborators[invitedEmail] = {
      end,
      user: {
        id: invitedEmail
      },
      duration: 1,
      isGlobal: false,
    }
  }

  getEndDate(end) {
    if (!end) return "";
    const date = new Date(end);
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    return dd + '.' + mm + '.' + yyyy;
  }

  selectDuration(duration) {
    this.selectedExternalUser.duration = duration;
  }

  onFullAccessCheckboxChange(e, checkedGlobal = true) {
    this.selectedExternalUser.isGlobal = e.target.checked && checkedGlobal;
    this.isGlobal = e.target.checked && checkedGlobal;
  }

  checkShowExternalUser() {
    return Object.keys(this.externalCollaborators).length > 0
      || Object.keys(this.invitedCollaborators).length > 0
      || Object.keys(this.addedExternalUsers).length > 0;
  }

  getExternalGroupUser() {
    this.listExternalUser = JSON.parse(localStorage.getItem("listExternalUser")) || [];
  }

  getExternalGlobalGroupUser() {
    this.listExternalUserGlobal = JSON.parse(localStorage.getItem("listExternalUserGlobal")) || [];
  }

  // async openEditAccessModal(content, item) {
  //   const dialogConfig = new MatDialogConfig();
  //   // The user can't close the dialog by clicking outside its body
  //   dialogConfig.id = "modal-component1";
  //   dialogConfig.width = "640px";
  //   dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

  //   const modalDialog = this.matDialog.open(EditAccessComponent, dialogConfig);

  //   modalDialog.afterClosed().subscribe((result) => {

  //   });
  // }

}
