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
import { ACCESS, CONFIDENTIALITY, GROUPS, ALLOW, ACCESS_LABEL, CONFIDENTIALITY_LABEL } from "../upload-modal/constant";
import { NuxeoService } from '../services/nuxeo.service';
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
  viewType: any;
  constructor(
    private apiService: ApiService,
    public nuxeo: NuxeoService,
    public dialogRef: MatDialogRef<UpdateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {docs: any, folder: any},
    private router: Router,
  ) {

  }
  selectedMenu = 0;

  readonly ACCESS = ACCESS;
  readonly CONFIDENTIALITY = CONFIDENTIALITY;
  readonly ALLOW = ALLOW;
  readonly ACCESS_LABEL = ACCESS_LABEL;
  readonly CONFIDENTIALITY_LABEL = CONFIDENTIALITY_LABEL;

  docs: any;
  step: number = 1;
  stepLabel: string;
  selectedFolder: any;
  customAccessMap: any = {};
  customConfidentialityMap: any = {};
  customUsersMap: any = {};
  customAllowMap: any = {};
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  userLoading: boolean = false;
  loading = false;
  updatedAclValue: any = {};
  openCopyrightMap: any = {};
  copyrightUserMap: any = {};
  copyrightYearMap: any = {};
  updatedDocs: any = {};

  years = [
    {id: 1, name: '2000'},
    {id: 2, name: '2001'},
    {id: 3, name: '2002'},
    {id: 4, name: '2003'},
    {id: 5, name: '2004'},
    {id: 6, name: '2005'},
    {id: 7, name: '2006'},
    {id: 8, name: '2007'},
    {id: 9, name: '2008'},
    {id: 10, name: '2009'},
    {id: 11, name: '2010'},
    {id: 12, name: '2011'},
    {id: 13, name: '2012'},
    {id: 14, name: '2013'},
    {id: 15, name: '2014'},
    {id: 16, name: '2015'},
    {id: 17, name: '2016'},
    {id: 18, name: '2017'},
    {id: 19, name: '2018'},
    {id: 20, name: '2019'},
    {id: 21, name: '2020'},
    {id: 22, name: '2021'},
    {id: 23, name: '2022'},
    {id: 24, name: '2023'}
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.docs = this.data.docs;
    this.selectedFolder = this.data.folder;
    this.initACLValue();
  }

  closeModal() {
    this.dialogRef.close(this.updatedDocs);
  }

  initACLValue() {
    for (let i = 0; i < this.docs.length; i++) {
      this.computeAclValue(this.docs[i], i);
    }
  }

  computeAclValue(doc, index) {
    this.customAllowMap[index] = doc.properties['sa:allow'];
    this.copyrightUserMap[index] = doc.properties['sa:copyrightName'];
    this.copyrightYearMap[index] = doc.properties['sa:copyrightYear'];
    if (doc.properties['sa:confidentiality']) {
      this.customConfidentialityMap[index] = doc.properties['sa:confidentiality'];
      this.customAccessMap[index] = doc.properties['sa:access'];
      this.customUsersMap[index] = doc.properties['sa:users'];
      return;
    }
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
      this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
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
    // return `${title} ${len > 1 ? `and other ${len - 1} files` : ""}`;
    return `${len} files`;
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

  onSelectConfidentiality(
    fileIndex?: any) {
    // this.customConfidentialityMap[fileIndex] = confidentiality;
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAccess(fileIndex?: any) {
    // this.customAccessMap[fileIndex] = access;
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAllow(allow, fileIndex?: any) {
    if (fileIndex !== null && fileIndex !== undefined) {
      this.customAllowMap[fileIndex] = allow;
    }
  }

  openCopyright(fileIndex) {
    this.openCopyrightMap[fileIndex] = true;
  }

  closeCopyright(fileIndex) {
    this.openCopyrightMap[fileIndex] = false;
  }

  checkShowUserDropdown(fileIndex?: any) {
    const access = this.customAccessMap[fileIndex];
    const confidentiality =
      this.customConfidentialityMap[fileIndex];
    if (
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
    await this.updateAssetClassification(doc, index);
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
    const result = await this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
    this.updatedAclValue[index] = result["contextParameters"].acls;
  }

  async updateAssetClassification(doc, index) {
    const updated = await this.nuxeo.nuxeoClient
      .operation("Scry.UpdateConfidentiality")
      .input([doc])
      .params({
        confidentiality: this.customConfidentialityMap[index],
        access: this.customAccessMap[index],
        allow: this.customAllowMap[index],
        users: this.customUsersMap[index],
        copyrightName: this.copyrightUserMap[index],
        copyrightYear: this.copyrightYearMap[index]?.name || this.copyrightYearMap[index]
      })
      .schemas(['scryAccess'])
      .enrichers({document: ["acls"]})
      .execute();
    if (updated.entries[0]) this.updatedDocs[index] = updated.entries[0];
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


  handleSelectMenu(index, type) {
    this.selectedMenu = index;
    this.viewType = type;
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
