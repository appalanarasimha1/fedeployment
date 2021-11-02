import { Component, OnInit, Inject } from "@angular/core";
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
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ACCESS, CONFIDENTIALITY, GROUPS } from "../upload-modal/constant";
import { Router } from "@angular/router";

const STEPS = {
  1: "Update Classification",
};

@Component({
  selector: "app-update-modal",
  templateUrl: "./update-modal.component.html",
  styleUrls: ["./update-modal.component.css"],
})
export class UpdateModalComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<UpdateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {docs: any, folder: any},
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.docs = this.data.docs;
    this.selectedFolder = this.data.folder;
    this.initACLValue();
  }

  readonly ACCESS = ACCESS;
  readonly CONFIDENTIALITY = CONFIDENTIALITY;

  docs: any;
  step: number = 1;
  stepLabel: string;
  selectedFolder: any;
  customAccessMap: any = {};
  customConfidentialityMap: any = {};
  customUsersMap: any = {};
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  userLoading: boolean = false;
  loading = false;

  closeModal() {
    this.dialogRef.close();
  }

  initACLValue() {
    for (let i = 0; i < this.docs.length; i++) {
      this.computeAclValue(this.docs[i], i);
    }
  }

  computeAclValue(doc, index) {
    const aces = doc.contextParameters.acls.find(a => a.name === "local");
    if (!aces) {
      this.customConfidentialityMap[index] = "";
      this.customAccessMap[index] = "";
      this.customUsersMap[index] = [];
      return;
    }
    const localAces = aces.aces;
    const users = localAces.map(a => a.username);
    if (users.includes(GROUPS.all)) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.not;
      this.customAccessMap[index] = ACCESS.all;
      this.customUsersMap[index] = [];
    } else if (users.includes(GROUPS.company)) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
      this.customAccessMap[index] = ACCESS.internal;
      this.customUsersMap[index] = [];
    } else if (users.length > 0) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.highly;
      this.customAccessMap[index] = ACCESS.restricted;
      this.customUsersMap[index] = [...users];
    }
  }

  toNextStep() {
    this.step++;
    this.stepLabel = STEPS[this.step];
    // if (this.step === 3) {
    //   this.copyUserMap();
    // }
    if (this.step === 2) {
      this.updateAssets();
    }
  }

  checkButtonDisabled() {
    // if (this.step === 2) {
    //   if (
    //     (!this.selectedFolder && !this.folderToAdd) ||
    //     !this.access ||
    //     !this.associatedDate ||
    //     !this.confidentiality ||
    //     (this.checkShowUserDropdown() &&
    //       this.selectedUsers &&
    //       this.selectedUsers.length === 0)
    //   )
    //     return true;
    // }
    // return false;
  }

  getSelectedAssetsTitle() {
    const title = this.docs[0].title;
    const len = this.docs.length;
    return `${title} ${len > 1 ? `and other ${len - 1} files` : ""}`;
  }
  getSelectedAssetsSize() {
    let size = 0;
    this.docs.forEach(doc => {
      size += +doc.properties["file:content"]?.length || 0;
    });
    return this.humanFileSize(size);
  }

  humanFileSize(size) {
    const i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2)  + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
  }

  showLocaleDate() {
    const dateString = this.selectedFolder.properties["dc:start"] || this.selectedFolder.properties["dc:created"];
    return new Date(dateString).toLocaleDateString();
  }

  onSelectConfidentiality(confidentiality, fileIndex?: any) {
    this.customConfidentialityMap[fileIndex] = confidentiality;
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAccess(access, fileIndex?: any) {
    this.customAccessMap[fileIndex] = access;
    this.checkShowUserDropdown(fileIndex);
  }

  checkShowUserDropdown(fileIndex?: any) {
    const access = this.customAccessMap[fileIndex];
    const confidentiality =
      this.customConfidentialityMap[fileIndex];
    if (
      (access && confidentiality === CONFIDENTIALITY.highly) ||
      (access === ACCESS.restricted && confidentiality)
    ) {
      return true;
    } else {
      return false;
    }
  }

  checkAccessOptionDisabled(access, fileIndex?: any) {
    const confidentiality =
      this.customConfidentialityMap[fileIndex];
    if (!confidentiality || confidentiality === CONFIDENTIALITY.not) return false;
    if (access === ACCESS.all) {
      return true;
    }
    return false;
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

  updateAssets() {
    for (let i = 0; i < this.docs.length; i++) {
      this.updateAsset(this.docs[i], i);
    }
  }

  async updateAsset(doc, index) {
    await this.removeLocalPermission(doc);
    this.setAssetPermission(doc, index);
  }

  async removeLocalPermission(doc) {
    const params = {
      acl: "local"
    };
    const payload = {
      params,
      context: {},
      input: doc.uid,
    };
    await this.apiService.post(apiRoutes.REMOVE_ACL, payload).toPromise();
  }

  async setAssetPermission(doc, index) {
    const params = {
      permission: "Read",
      notify: true,
      comment: "",
    };
    const access = this.customAccessMap[index];
    const confidentiality =
      this.customConfidentialityMap[index];
    if (!access || !confidentiality) return;
    if (
      this.checkShowUserDropdown(index) &&
      this.customUsersMap[index] &&
      this.customUsersMap[index].length > 0
    ) {
      params["users"] = this.customUsersMap[index];
    } else if (
      access === ACCESS.all &&
      confidentiality === CONFIDENTIALITY.not
    ) {
      params["users"] = [GROUPS.all, GROUPS.company];
    } else {
      params["users"] = [GROUPS.company];
    }
    const payload = {
      params,
      context: {},
      input: doc.uid,
    };
    this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
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

  
  getAssetUrl(event: any, url: string, type?: string): string {
    if(!url) return '';
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    this.loading = true;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);
          this.loading = false;
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);
        this.loading = false;
        // event.target.src = new Blob(d);
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'
          this.loading = false;
          console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }
}
