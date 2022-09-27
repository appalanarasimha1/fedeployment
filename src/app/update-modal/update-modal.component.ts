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
import { ACCESS, CONFIDENTIALITY, GROUPS, ALLOW, ACCESS_LABEL, ALLOW_LABEL, CONFIDENTIALITY_LABEL, ACCESS_TITLE, YEARS, OWNER_APPROVAL_LABEL, SPECIFIC_USER_LABEL, ALLOW_VALUE_MAP } from "../upload-modal/constant";
import { NuxeoService } from '../services/nuxeo.service';
import { Router } from "@angular/router";
import { SharedService } from "../services/shared.service";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

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
    public sharedService: SharedService
  ) {

  }
  selectedMenu = 0;

  readonly ACCESS = ACCESS;
  readonly CONFIDENTIALITY = CONFIDENTIALITY;
  readonly ALLOW = ALLOW;
  readonly ACCESS_LABEL = ACCESS_LABEL;
  readonly ALLOW_LABEL = ALLOW_LABEL;
  readonly CONFIDENTIALITY_LABEL = CONFIDENTIALITY_LABEL;
  readonly ACCESS_TITLE = ACCESS_TITLE;
  readonly years = YEARS;
  readonly OWNER_APPROVAL_LABEL = OWNER_APPROVAL_LABEL;
  readonly SPECIFIC_USER_LABEL = SPECIFIC_USER_LABEL;

  docs: any;
  step: number = 1;
  stepLabel: string;
  selectedFolder: any;
  customAccessMap: any = {};
  customConfidentialityMap: any = {};
  customUsersMap: any = {};
  customDownloadApprovalUsersMap: {[key: string]: string[]} = {};
  customAllowMap: any = {};
  customDownloadApprovalMap: {[key: string]: string|boolean} = {};
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  userLoading: boolean = false;
  loading = false;
  updatedAclValue: any = {};
  openCopyrightMap: any = {};
  copyrightUserMap: any = {};
  copyrightYearMap: any = {};
  updatedDocs: any = {};
  downloadApproval: boolean = false;
  overallConfidentiality: string;
  overallAccess: string;
  overallDownloadApproval: boolean = false;
  overallUsers: string[];
  overallDownloadApprovalUsers : string[];
  associatedDate: string;
  description: string;

  ngOnInit(): void {
    this.loadUsers();
    this.docs = this.data.docs.filter(doc => ['picture', 'video', 'file', 'audio'].indexOf(doc.type.toLowerCase()) != -1);
    this.selectedFolder = this.data.folder;
    this.initACLValue();
    this.associatedDate = this.selectedFolder.properties["dc:start"];
    this.description = this.selectedFolder.properties["dc:description"];
  }
  ngAfterViewInit() {
    setTimeout(()=>{
      this.resizeInput();
    }, 500);
  }

  closeModal() {
    this.dialogRef.close();
  }

  initACLValue() {
    for (let i = 0; i < this.docs.length; i++) {
      this.computeAclValue(this.docs[i], i);
    }
  }

  computeAclValue(doc, index) {
    this.customAllowMap[index] = doc.properties['sa:allow'];
    this.customDownloadApprovalMap[index] = this.checkOwnerDropdownByValue(doc.properties['sa:downloadApproval']);
    this.copyrightUserMap[index] = doc.properties['sa:copyrightName'];
    this.openCopyrightMap[index] = true;
    this.copyrightYearMap[index] = doc.properties['sa:copyrightYear'];
    if (doc.properties['sa:confidentiality']) {
      this.customConfidentialityMap[index] = doc.properties['sa:confidentiality'];
      this.customAccessMap[index] = doc.properties['sa:access'];
      this.customUsersMap[index] = doc.properties['sa:users'];
      this.customDownloadApprovalUsersMap[index] = doc.properties['sa:downloadApprovalUsers'];
      return;
    }
    const aces = doc.contextParameters.acls.find(a => a.name === "local");
    if (!aces) {
      this.customConfidentialityMap[index] = "";
      this.customAccessMap[index] = "";
      this.customUsersMap[index] = [];
      this.customDownloadApprovalUsersMap[index] = [];
      return;
    }
    const localAces = aces.aces;
    const users = localAces.map(a => a.username);
    if (users.includes(GROUPS.all)) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.not;
      this.customAccessMap[index] = ACCESS.all;
      this.customUsersMap[index] = [];
      this.customDownloadApprovalUsersMap[index] = [];
    } else if (users.includes(GROUPS.company)) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
      this.customAccessMap[index] = ACCESS.internal;
      this.customUsersMap[index] = [];
      this.customDownloadApprovalUsersMap[index] = [];
    } else if (users.length > 0) {
      this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
      this.customAccessMap[index] = ACCESS.restricted;
      this.customUsersMap[index] = [...users];
    }
  }

  toNextStep() {
    // this.deleteModal();
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
    const title = this.docs[0]?.title;
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
    const dateString = this.selectedFolder?.properties?.["dc:start"] || this.selectedFolder?.properties?.["dc:created"];
    return dateString && new Date(dateString).toLocaleDateString();
  }

  onSelectConfidentiality(fileIndex?: any) {
    if (fileIndex == null) {
      this.overallAccess = undefined;
      return;
    }
    // this.customConfidentialityMap[fileIndex] = confidentiality;
    this.customAccessMap[fileIndex] = undefined;
    this.customAllowMap[fileIndex] = undefined;
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAccess(fileIndex?: any) {
    if (fileIndex == null) return;
    // this.customAccessMap[fileIndex] = access;
    const allow = this.customAccessMap[fileIndex] === ACCESS.all ? ALLOW.any : ALLOW.internal;
    this.onSelectAllow(allow, fileIndex);
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
    const access = fileIndex == null ? this.overallAccess : this.customAccessMap[fileIndex];
    const confidentiality = fileIndex == null ? this.overallConfidentiality : this.customConfidentialityMap[fileIndex];
    if (access === ACCESS.restricted && confidentiality) {
      return true;
    } else {
      return false;
    }
  }

  checkAccessOptionDisabled(value: string, fileIndex?: any) {
    const confidentiality = fileIndex == null ? this.overallConfidentiality : this.customConfidentialityMap[fileIndex];
    if (!confidentiality || confidentiality === CONFIDENTIALITY.not) return false;
    if (value === ACCESS.all) {
      return true;
    }
    if (value === ALLOW.any) {
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

  async updateAssets() {
    await this.updateFolderInfo();
    for (let i = 0; i < this.docs.length; i++) {
      await this.updateAsset(this.docs[i], i);
    }
    this.classificationsUpdate();
  }

  async updateFolderInfo() {
    if (this.associatedDate === this.selectedFolder.properties["dc:start"]
     && this.description === this.selectedFolder.properties["dc:description"]) return;
    return await this.apiService
      .post(apiRoutes.DOCUMENT_UPDATE, {
        input: this.selectedFolder.uid,
        params: {
          properties: {
            "dc:start": this.associatedDate,
            "dc:description": this.description,
          },
        },
      }).pipe().toPromise();
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

  async updateAssetClassification(doc, index: number) {
    const result = await this.nuxeo.nuxeoClient
      .operation("Scry.UpdateConfidentiality")
      .input([doc])
      .params({
        confidentiality: this.customConfidentialityMap[index],
        access: this.customAccessMap[index],
        allow: this.customAllowMap[index],
        users: this.customUsersMap[index],
        downloadApprovalUsers: this.customDownloadApprovalUsersMap[index],
        copyrightName: this.copyrightUserMap[index],
        copyrightYear: this.copyrightYearMap[index]?.name || this.copyrightYearMap[index],
        downloadApproval: this.customDownloadApprovalMap[index]
      })
      .schemas(['scryAccess'])
      .enrichers({document: ["acls"]})
      .execute();
      // .then((result) => {
      if (result.entries[0]) 
        this.updatedDocs[index] = result.entries[0];
    //     resolve(null);
    //   });
    // });
      // .then(() => {

      // })
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
    return this.sharedService.getAssetUrl(event, url, type);
  }

  classificationsUpdate() {
    const result = {
      updatedDocs: this.updatedDocs || [],
      selectedFolder: {
        description: this.description,
        associatedDate: this.associatedDate,
      }
    }
    this.dialogRef.close(result);
    this.sharedService.showSnackbar('The classifications have been updated.', 4000, 'bottom', 'center', 'snackBarMiddle');
  }

  checkOwnerDropdown(index?: string) {
    return !!(this.customDownloadApprovalMap[index] === 'true' || this.customDownloadApprovalMap[index]);
  }

  checkOwnerDropdownByValue(value?: string) {
    switch(value) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return false;
    }
  }

  applyToAll() {
    const len = Object.keys(this.customConfidentialityMap).length;
    for (let i = 0; i < len; i++) {
      this.customConfidentialityMap[i] = this.overallConfidentiality;
      this.customAccessMap[i] = this.overallAccess;
      this.customDownloadApprovalMap[i] = this.overallDownloadApproval;
      this.customUsersMap[i] = this.overallUsers;
      this.customDownloadApprovalUsersMap[i] = this.overallDownloadApprovalUsers;
      const allow = this.overallAccess === ACCESS.all ? ALLOW.any : ALLOW.internal;
      this.customAllowMap[i] = allow;
    }
  }

  checkFormState(): boolean {
    const length = this.docs.length;
    for (let i = 0; i < length; i++) {
      console.log('index = ', i);
      const access = this.customAccessMap[i];
      const allow = this.customAllowMap[i];
      const confidentiality = this.customConfidentialityMap[i];
      if(!access || !allow || !confidentiality) {
        return true;
      } else if(access === ACCESS["restricted"] && !this.customUsersMap[i]?.length) {
          return true;
      } else if(this.customDownloadApprovalMap[i] && !this.customDownloadApprovalUsersMap[i]) {
        return true;
      } else if(i === length - 1) {
        return false;
      }
    }
    return true;
  }

  resizeInput(){
    function resizable (el, factor) {
      var int = Number(factor) || 7.7;
      function resize() {el.style.width = ((el.value.length+1) * int) + 'px'}
      var e = 'keyup,keypress,focus,blur,change'.split(',');
      for (var i in e) el.addEventListener(e[i],resize,false);
      resize();
    }
    resizable(document.getElementById('txt'),7);
  }
}
