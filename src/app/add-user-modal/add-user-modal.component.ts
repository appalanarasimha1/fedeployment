import { Component, OnInit, Inject, Input, Output, EventEmitter } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
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
import { EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER, permissions } from "../common/constant";
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import { SharedService } from "../services/shared.service";
import { DataService } from "../services/data.service";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";

import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { EditAccessComponent } from "../edit-access/edit-access.component";

@Component({
  selector: "app-add-user-modal",
  templateUrl: "./add-user-modal.component.html",
  styleUrls: ["./add-user-modal.component.css"],
})
export class AddUserModalComponent implements OnInit {
  @Input() selectedFolder;
  @Input() folderId;
  @Input() folderCollaborators;
  @Input() childAssetOwners;
  @Output() parentOutput = new EventEmitter<{[id: string]: boolean}>();

  uploadedAsset;
  // selectedFolder: any;
  makePrivate: boolean = false;
  userList$: Observable<any>;
  userList = [];
  userInput$ = new Subject<string>();
  userLoading = false;
  // folderCollaborators = {};
  internalCollaborators = {};
  externalCollaborators = {};
  selectedCollaborator: any;
  addedCollaborators: {};
  addedExternalUsers: {};
  removedCollaborators: {};
  updatedCollaborators: {};
  invitedCollaborators: {};
  selectedExternalUser: any;
  // folderId: string;
  folderUpdated: any;
  closeResult: string;
  userInputText = "";
  selectedMonth;
  month = [
    { id: 1, name: "1 month" },
    { id: 2, name: "2 month" },
    { id: 3, name: "3 month" },
    { id: 4, name: "4 month" },
    { id: 5, name: "5 month" },
  ];
  listExternalUser: string[] = [];
  listExternalUserGlobal: string[] = [];
  isGlobal = false;

  doneLoading: boolean = false;
  loading = true;
  user = "";
  computedCollaborators = {};

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem("user"))["username"];
    this.listExternalUser = [];
    this.listExternalUserGlobal = [];
    // this.selectedFolder = this.data.selectedFolder;
    // this.folderId = this.data.folderId;
    // this.folderCollaborators = this.data.folderCollaborators || {};
    this.addedCollaborators = {};
    this.addedExternalUsers = {};
    this.removedCollaborators = {};
    this.updatedCollaborators = {};
    this.invitedCollaborators = {};
    this.computeCollaborators();
    this.loadUsers();
    this.sharedService.fetchExternalUserInfo();
    this.getExternalGroupUser();
    this.getExternalGlobalGroupUser();
    // this.sharedService.fetchExternalUserInfo();
    // this.getExternalGroupUser();
    this.extractPermissions();
  }

  closeModal() {
    this.dialogRef.close(this.folderUpdated);
    this.doneLoading = false;
  }

  extractPermissions() {
    Object.keys(this.folderCollaborators).forEach((key) => {
      this.updateComputedCollaborators(this.folderCollaborators[key]);
    });
    console.log(this.computedCollaborators);
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
    if (permission?.includes('ReadWrite')) {
      this.computedCollaborators[key].permissions.broderAccess = true;
    }
    if (item.user === this.selectedFolder?.properties["dc:creator"] || item.user === this.selectedFolder?.properties["dc:creator"].id)
      this.computedCollaborators[key].permissions.isOwner = true;
  }

  computeCollaborators() {
    this.externalCollaborators = {};
    this.internalCollaborators = {};
    Object.keys(this.folderCollaborators).forEach((key) => {
      if (
        (this.folderCollaborators[key].externalUser ||
          this.listExternalUser.includes(key)) &&
        !this.checkTransientNeomEmail(key)
      ) {
        this.externalCollaborators[key] = this.folderCollaborators[key];
      } else {
        this.internalCollaborators[key] = this.folderCollaborators[key];
      }
    });
  }

  isNeomUser(user) {
    return !!user?.includes('@neom.com') || !!user?.match('@.*neom.com');
  }

  selectChange(item) {
    this.userInputText = null;
    this.selectedCollaborator = null;
    // const isExist = this.folderCollaborators[item.id];
    // if (item.id) {
    //   item.id = item.id.toLowerCase();
    // }
    let newItem;
    const end = new Date();
    end.setMonth(new Date().getMonth() + 12);
    const isExist = this.computedCollaborators[item.id];
    if (isExist) return;
    else if (this.listExternalUser.includes(item.id)) {
      newItem = {
        end,
        user: item.id,
        permissions: {
          canDownload: true,
        },
      }
      this.addedExternalUsers[item.id] = newItem;
    } else {
      newItem = {
        end,
        user: item.id,
        permissions: {
          canDownload: true,
          canUpload: true,
        },
      }
      this.addedCollaborators[item.id] = newItem;
    }

    this.updateComputedCollaborators(newItem);
  }

  canSave() {
    return (
      Object.keys(this.addedCollaborators).length > 0 ||
      Object.keys(this.removedCollaborators).length > 0 ||
      Object.keys(this.updatedCollaborators).length > 0 ||
      Object.keys(this.invitedCollaborators).length > 0 ||
      Object.keys(this.addedExternalUsers).length > 0
    );
  }

  removeUser(userId) {
    // if (type === "added") {
    //   delete this.addedCollaborators[userId];
    //   delete this.addedExternalUsers[userId];
    // } else if (type === "removed") {
    //   this.removedCollaborators[userId] = this.folderCollaborators[userId];
    //   delete this.folderCollaborators[userId];
    //   delete this.updatedCollaborators[userId];
    //   this.computeCollaborators();
    // } else if (type === "invited") {
    //   delete this.invitedCollaborators[userId];
    // }
    delete this.computedCollaborators[userId];
  }

  makeAdmin(item) {
    // if (type === "added") {
    //   if (!this.addedCollaborators[userId]) return;
    //   this.addedCollaborators[userId].permission = "Everything";
    // } else if (type === "updated") {
    //   if (!this.updatedCollaborators[userId])
    //     this.updatedCollaborators[userId] = this.folderCollaborators[userId];
    //   this.updatedCollaborators[userId].permission = "Everything";
    // }
    item.permissions.isAdmin = true;
    this.updateComputedCollaborators(item);
  }

  removeAdmin(item) {
    // if (type === "added") {
    //   if (!this.addedCollaborators[userId]) return;
    //   this.addedCollaborators[userId].permission = "ReadWrite";
    // } else if (type === "updated") {
    //   if (!this.updatedCollaborators[userId])
    //     this.updatedCollaborators[userId] = this.folderCollaborators[userId];
    //   this.updatedCollaborators[userId].permission = "ReadWrite";
    // }
    item.permissions.isAdmin = false;
    this.updateComputedCollaborators(item);
  }

  async updateCollaborators() {
    this.doneLoading = true;
    if (!this.canSave()) return;
    for (const key in this.removedCollaborators) {
      await this.sharedService.removePermission(this.removedCollaborators[key].id, this.folderId);
    }
    for (const key in this.updatedCollaborators) {
      await this.updatePermission(this.updatedCollaborators[key]);
    }
    for (const key in this.addedCollaborators) {
      await this.addPermission(this.addedCollaborators[key]);
      await this.sendInviteInternal(this.addedCollaborators[key]);
    }
    for (const key in this.addedExternalUsers) {
      await this.addPermission(this.addedExternalUsers[key]);
      await this.sendInviteInternal(this.addedExternalUsers[key]);
    }
    for (const key in this.invitedCollaborators) {
      await this.inviteUser(this.invitedCollaborators[key]);
    }
    this.folderUpdated = await this.fetchFolder(this.folderId);
    this.closeModal();
    this.doneLoading = false;
    this.sharedService.showSnackbar(
      "Collaborators updated",
      4000,
      "top",
      "center",
      "snackBarMiddle"
    );
  }

  updatePermission(item) {
    if (
      this.listExternalUser.includes(item.user.id) &&
      item.isGlobal != undefined
    ) {
      this.updateExternalUserGroup(item.user.id, item.isGlobal);
    }
    if (this.listExternalUser.includes(item.user.id) && !item.end) {
      const end = new Date();
      end.setMonth(new Date().getMonth() + 1);
      item.end = end;
    }
    let permission = item.permission;
    if (item.isAdmin !== undefined) {
      permission = item.isAdmin ? "Everything" : "ReadWrite";
    }
    const params = {
      permission,
      comment: "",
      username: item.user.id,
      id: item.id,
    };
    if (item.end) params["end"] = item.end;
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    return this.apiService
      .post(apiRoutes.REPLACE_PERMISSION, payload)
      .toPromise();
  }

  addPermission(item) {
    this.doneLoading = true;
    // if (this.listExternalUser.includes(item.user.id) && !item.end) {
    //   const end = new Date();
    //   end.setMonth(new Date().getMonth() + 1);
    //   item.end = end;
    // }
    // if (
    //   item.isGlobal != undefined &&
    //   this.listExternalUser.includes(item.user.id)
    // ) {
    //   this.updateExternalUserGroup(item.user.id, item.isGlobal);
    // }
    let permission = item.permission;
    
    if (!permission) permission = 'Read'
    const params = {
      permission,
      comment: "",
    };
    if (item.notExisted) {
      params["email"] = item.user;
    } else {
      params["users"] = [item.user];
    }
    if (item.end) params["end"] = item.end;
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    return this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
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
    await this.apiService
      .post(apiRoutes.UPDATE_EXTERNAL_GROUP_USER, payload)
      .toPromise();
    this.sharedService.fetchExternalUserInfo();
  }

  async fetchFolder(id) {
    const result = await this.apiService
      .get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended`, {
        headers: { "fetch-document": "properties" },
      })
      .toPromise();
    return result;
  }

  async sendInviteInternal(item) {
    this.doneLoading = true;
    const params = {
      groundXUrl: location.protocol + "//" + location.host,
      email: item.user,
    };
    const payload = {
      params,
      context: {},
      input: this.folderId,
    };
    await this.apiService.post(apiRoutes.INVITE_INTERNAL, payload).toPromise();
  }

  async inviteUser(item) {
    // let permission = "ReadWrite";
    // if (item.isAdmin !== undefined) {
    //   permission = item.isAdmin ? "Everything" : "ReadWrite";
    // }
    // const params = {
    //   permission,
    //   email: item.user.id,
    //   end: item.end,
    // };
    // const payload = {
    //   params,
    //   context: {},
    //   input: this.folderId,
    // };
    // await this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();

    const inviteUserParams = {
      folderName: this.selectedFolder.title,
      groundXUrl: location.protocol + "//" + location.host,
    };
    const inviteUserPayload = {
      params: inviteUserParams,
      context: {},
      input: {
        "entity-type": "user",
        id: "",
        properties: {
          username: item.user,
          email: item.user,
          groups: item.isGlobal
            ? [EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER]
            : [EXTERNAL_USER],
        },
      },
    };
    await this.apiService
      .post(apiRoutes.INVITE_USER, inviteUserPayload)
      .toPromise();
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
    if(item.user?.properties?.firstName)
      return name;
    else if(item.user?.id) 
      return item.user.id;
    else 
      return item.user;
  }

  getExternalName(item) {
    return item.user.id ? item.user.id.replace("transient/", "") : item.user;
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
    return this.apiService.get(apiRoutes.SEARCH_USER, { params }).pipe(
      map((resp) => {
        const entries = resp["entries"].map((entry) => ({
          id: entry.id,
          fullname: `${entry.properties.firstName || ""} ${
            entry.properties.lastName || ""
          }`.trim(),
        }));
        this.userList = entries;
        let unique = Array.from(new Set(entries.map(JSON.stringify))).map(
          (data: any) => JSON.parse(data)
        );
        // console.log(Array.from(new Set(entries.map(JSON.stringify))).map((data:any)=>JSON.parse(data)),entries)
        return unique;
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
    if (
      this.listExternalUserGlobal.includes(this.selectedExternalUser.user?.id)
    ) {
      this.isGlobal = true;
    }
    const isAdmin = item.permission === "Everything";
    dialogConfig.data = {
      isGlobal: this.isGlobal,
      selectedMonth: this.selectedMonth,
      selectedExternalUser: this.selectedExternalUser,
      isAdmin,
    };

    const modalDialog = this.matDialog.open(EditAccessComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedMonth = result.selectedMonth;
        this.selectedExternalUser.isGlobal = result.isGlobal;
        this.selectedExternalUser.isAdmin = result.isAdmin;
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
      this.updatedCollaborators[this.selectedExternalUser.user.id].isAdmin = this.selectedExternalUser.isAdmin;
      if (this.selectedExternalUser.isGlobal !== undefined)
        this.updatedCollaborators[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    } else if (this.addedExternalUsers[this.selectedExternalUser.user.id]) {
      this.addedExternalUsers[this.selectedExternalUser.user.id].end = end;
      this.addedExternalUsers[this.selectedExternalUser.user.id].isAdmin = this.selectedExternalUser.isAdmin;

      if (this.selectedExternalUser.isGlobal !== undefined)
        this.addedExternalUsers[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    } else {
      this.invitedCollaborators[this.selectedExternalUser.user.id].end = end;
      this.invitedCollaborators[this.selectedExternalUser.user.id].isAdmin = this.selectedExternalUser.isAdmin;
      if (this.selectedExternalUser.isGlobal !== undefined)
        this.invitedCollaborators[this.selectedExternalUser.user.id].isGlobal = this.selectedExternalUser.isGlobal;
    }

    this.selectedExternalUser = undefined;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  checkInviteExternal(email = "") {
    if (!email) email = this.userInputText;
    if (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) &&
      !this.selectedCollaborator
    )
      return true;
  }

  // todo: move following function to shared service
  checkNeomEmail(email = "") {
    if (!email) email = this.userInputText;
    return (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) &&
      email.split("@")[1] === "neom.com"
    );
  }

  // todo: move following function to shared service
  checkTransientNeomEmail(email) {
    if (email.includes("transient/"))
      return this.checkNeomEmail(email.split("/")[1]);
    return this.checkNeomEmail(email);
  }

  getEmailInUserList(email) {
    try {
      if (!this.userList) return null;
      const res = this.userList.find((user) => user.id === email);
      return res;
    } catch (err) {
      return null;
    }
  }

  sendInvite(isNeom = false) {
    const invitedEmail = this.userInputText?.toLowerCase();
    const existedUser = this.getEmailInUserList(invitedEmail);
    if (existedUser) {
      this.selectChange(existedUser);
      return;
    }
    // this.userInputText = "";
    const end = new Date();
    end.setMonth(new Date().getMonth() + 12);
    let newItem;
    if (isNeom) {
      newItem = {
        user: invitedEmail,
        notExisted: true,
        permissions: {
          canDownload: true,
          canUpload: true,
        },
        end,
      };
      this.addedCollaborators[invitedEmail] = newItem;
      this.updateComputedCollaborators(newItem);
      return;
    }
    newItem = {
      end,
      user: invitedEmail,
      notExisted: true,
      permissions: {
        canDownload: true,
      },
    };
    this.invitedCollaborators[invitedEmail] = newItem;
    this.updateComputedCollaborators(newItem);
  }

  // todo: move following function to shared service
  getEndDate(end) {
    if (!end) return "";
    const date = new Date(end);
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    return dd + "." + mm + "." + yyyy;
  }

  selectDuration(duration) {
    this.selectedExternalUser.duration = duration;
  }

  onFullAccessCheckboxChange(e, checkedGlobal = true) {
    this.selectedExternalUser.isGlobal = e.target.checked && checkedGlobal;
    this.isGlobal = e.target.checked && checkedGlobal;
  }

  // todo: following does not make sense.
  checkShowExternalUser() {
    return false;
    return (
      Object.keys(this.externalCollaborators).length > 0 ||
      Object.keys(this.invitedCollaborators).length > 0 ||
      Object.keys(this.addedExternalUsers).length > 0
    );
  }

  getExternalGroupUser() {
    this.listExternalUser =
      JSON.parse(localStorage.getItem("listExternalUser")) || [];
  }

  getExternalGlobalGroupUser() {
    this.listExternalUserGlobal =
      JSON.parse(localStorage.getItem("listExternalUserGlobal")) || [];
  }

  onPermissionChange(event, item, permission) {
    const value = event.target.checked;
    item.permissions[permission] = value;
    this.updateComputedCollaborators(item);
  }

  onExpiryDateChange(event, item) {
    item.end = event.value;
    this.updateComputedCollaborators(item);
  }

  checkExpired(end) {
    if (!end) return false;
    try {
      return new Date(end).getTime() < new Date().getTime();
    } catch (e) {return false;}
  }

  async saveChanges() {
    await this.removePermissions();
    // await this.removeAllPermissions(); 
    for (const key in this.computedCollaborators) {
      try {
        const collab = this.computedCollaborators[key];
        const item = Object.assign({}, collab);
        if (item.notExisted && !this.checkNeomEmail(item.user)) {
          await this.inviteUser(item);
        }

        if (this.addedCollaborators[key] || this.addedExternalUsers[key]) {
          await this.sendInviteInternal(item);
        }

        if (item.permissions.canDownload) {
          const alreadyHave = item?.ids?.filter(item => item.includes("CanDownload"));
          if(!alreadyHave?.length) {
            item.permission = permissions.lockFolderPermissions.DOWNLOAD;
            await this.addPermission(item);
          }
        }

        if (item.permissions.canUpload) {
          const alreadyHave = item?.ids?.filter(item => item.includes("CanUpload"));
          if(!alreadyHave?.length) {
            item.permission = permissions.lockFolderPermissions.UPLOAD;
            await this.addPermission(item);
          }
        }

        if (item.permissions.isAdmin) {
          const alreadyHave = item?.ids?.filter(item => item.includes("Everything"));
          if(!alreadyHave?.length || item?.assembledLocally) {
            item.permission = permissions.lockFolderPermissions.ADMIN;
            await this.addPermission(item);
          }
        } else if (this.sharedService.checkExternalUser(item.user) && item.permissions.broderAccess) {
            const alreadyHave = item?.ids?.filter(item => item.includes("ReadWrite"));
            if(!alreadyHave?.length) {
              item.permission = permissions.lockFolderPermissions.READWRITE;
              await this.addPermission(item);
          }
        }

        if (!item.permissions.isAdmin && !item.permissions.canDownload && !item.permissions.canUpload) {
          item.permission = permissions.lockFolderPermissions.READ;
          await this.addPermission(item);
        }
      } catch (e) {
        //NOTE: show the toaster and do not close the modal window.
        this.sharedService.showSnackbar(
          "Error while adding folder permissions", 
          5000, 
          'top', 
          'center', 
          "snackBarMiddle"
        );
        this.parentOutput.emit({disableButton: false});
        return;
      }
    }
    this.parentOutput.emit({closeModal: true});
  }

  checkExternaUser(email: string) {
    return this.sharedService.checkExternalUser(email);
  }

  async removePermissions() {
    for (const key in this.folderCollaborators) {
      try {
        if(key.toLowerCase() === this.selectedFolder.properties["dc:creator"].id.toLowerCase() || key.toLowerCase() === this.user.toLowerCase()) {
          continue;
        }

        if(!this.computedCollaborators[key]) {
          for(let i = 0; i < this.folderCollaborators[key].ids.length; i++)
          await  this.sharedService.removePermission(this.folderCollaborators[key].ids[i], this.folderId);
        }
        const collab = this.computedCollaborators[key];
        const item = Object.assign({}, collab);
        
        if (!item.permissions?.canDownload) {
          const alreadyHave = item.ids?.filter(item => item.includes("CanDownload"));
          if(alreadyHave?.length) {
            await  this.sharedService.removePermission(alreadyHave[0], this.folderId);
          }
        }
        if (!item.permissions?.canUpload) {
          const alreadyHave = item.ids?.filter(item => item.includes("CanUpload"));
          if(alreadyHave?.length) {
            await this.sharedService.removePermission(alreadyHave[0], this.folderId);
          }
        }
        if (!item.permissions?.isAdmin) {
          const alreadyHave = item.ids?.filter(item => item.includes("Everything"));
          if(alreadyHave?.length) {
            await this.sharedService.removePermission(alreadyHave[0], this.folderId);
          }
        }

        if (item.permissions?.isAdmin || !item.permissions?.broderAccess) {
          const alreadyHave = item.ids?.filter(item => item.includes("ReadWrite"));
          if(alreadyHave?.length) {
            await this.sharedService.removePermission(alreadyHave[0], this.folderId);
          }
        }

      } catch (e) {
        //NOTE: show the toaster and do not close the modal window.
        this.sharedService.showSnackbar(
          "Error while removing folder permissions", 
          5000, 
          'top', 
          'center', 
          "snackBarMiddle"
        );
        return;
      }
    }
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