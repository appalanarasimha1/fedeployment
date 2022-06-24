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
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";

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
  selectedCollaborator: any;
  addedCollaborators: {};
  removedCollaborators: {};
  updatedCollaborators: {};
  folderId: string;
  folderUpdated: any;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddUserModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.selectedFolder = this.data.selectedFolder;
    this.folderId = this.data.folderId;
    this.folderCollaborators = this.data.folderCollaborators || {};
    this.addedCollaborators = {};
    this.removedCollaborators = {};
    this.updatedCollaborators = {};
    this.loadUsers();
  }

  closeModal() {
    this.dialogRef.close(this.folderUpdated);
  }

  selectChange(item) {
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
    || Object.keys(this.updatedCollaborators).length > 0;
  }

  removeUser(userId, type) {
    if (type === 'added') {
      delete this.addedCollaborators[userId];
    } else if (type === 'removed') {
      this.removedCollaborators[userId] = this.folderCollaborators[userId];
      delete this.folderCollaborators[userId];
      delete this.updatedCollaborators[userId];
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
          return this.searchUser(term).pipe(
            catchError(() => of([])),
            tap(() => (this.userLoading = false))
          );
        })
      )
    );
  }

}
