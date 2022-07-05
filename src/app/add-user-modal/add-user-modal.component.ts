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
  userInput$ = new Subject<string>();
  userLoading = false;
  folderCollaborators = {};
  internalCollaborators = {};
  externalCollaborators = {};
  selectedCollaborator: any;
  addedCollaborators: {};
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

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.selectedFolder = this.data.selectedFolder;
    this.folderId = this.data.folderId;
    this.folderCollaborators = this.data.folderCollaborators || {};
    this.addedCollaborators = {};
    this.removedCollaborators = {};
    this.updatedCollaborators = {};
    this.invitedCollaborators = {};
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
      if (this.folderCollaborators[key].externalUser) {
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
    else {
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
    || Object.keys(this.invitedCollaborators).length > 0;
  }

  removeUser(userId, type) {
    if (type === 'added') {
      delete this.addedCollaborators[userId];
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
    const params = {
      permission: item.permission,
      notify: true,
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
    const params = {
      permission: item.permission,
      notify: true,
      comment: "",
      users: [item.user.id]
    };
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
    const name = item.user?.properties?.firstName + " " + item.user?.properties?.lastName;
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
        return resp["entries"].map((entry) => ({
          id: entry.id,
          fullname: `${entry.properties.firstName || ""} ${
            entry.properties.lastName || ""
          }`.trim(),
        }));
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
    this.selectedExternalUser = item;

    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title', windowClass: 'modal-edit-access'}).result.then((result) => {
      if (result !== 'done') return;
      this.updateExternalUserAccess();
      this.selectedMonth = undefined;

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  updateExternalUserAccess() {
    const end = new Date();
    end.setMonth(new Date().getMonth() + this.selectedExternalUser.duration);
    if (this.externalCollaborators[this.selectedExternalUser.user.id]) {
      if (!this.updatedCollaborators[this.selectedExternalUser.user.id])
        this.updatedCollaborators[this.selectedExternalUser.user.id] = this.externalCollaborators[this.selectedExternalUser.user.id];
      this.updatedCollaborators[this.selectedExternalUser.user.id].end = end;
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

  checkInviteExternal() {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.userInputText) && !this.selectedCollaborator) return true;
  }

  sendInvite() {
    const invitedEmail = this.userInputText;
    this.userInputText = "";
    const end = new Date();
    end.setMonth(new Date().getMonth() + 1);
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

  onFullAccessCheckboxChange(e) {
    this.selectedExternalUser.isGlobal = e.target.checked;
  }

}
