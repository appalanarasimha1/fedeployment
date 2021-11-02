import { Component, OnInit } from "@angular/core";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { MatDialogRef } from '@angular/material/dialog';
import Nuxeo from "nuxeo";
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
import { ACCESS, CONFIDENTIALITY, GROUPS } from "./constant";
import { NgbTooltip} from '@ng-bootstrap/ng-bootstrap'
import { ActivatedRoute, Router } from "@angular/router";

interface FileByIndex {
  [index: string]: File;
}

const STEPS = {
  1: "Upload assets",
  2: "Publish assets",
  3: "Publish assets",
};

const BUTTON_LABEL = {
  1: "Upload",
  2: "Publish",
  3: "Publish",
};

@Component({
  selector: "app-upload-modal",
  templateUrl: "./upload-modal.component.html",
  styleUrls: ["./upload-modal.component.css"],
})
export class UploadModalComponent implements OnInit {
  readonly ACCESS = ACCESS;
  readonly CONFIDENTIALITY = CONFIDENTIALITY;

  filesMap: FileByIndex = {};
  batchId: string = null;
  currentIndex: number = 0;
  step: number = 1;
  stepLabel: string;
  buttonLabel: string;
  selectedWorkspace: any = {};
  workspaceList: any;
  folderList: any;
  dropdownFolderList: any;
  showWsList: boolean = false;
  selectedFolder: any;
  folderToAdd: string;
  parentFolder: any;
  associatedDate: string;
  description: string;
  access: string;
  confidentiality: string;
  customAccessMap: any = {};
  customConfidentialityMap: any = {};
  customUsersMap: any = {};
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  selectedUsers: string[] = [];
  userLoading: boolean = false;
  imageSrc: any = {};
  filesUploadDone: any = {};

  showCustomDropdown: boolean = false;
  
  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<UploadModalComponent>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.stepLabel = STEPS[1];
    this.buttonLabel = BUTTON_LABEL[1];
    this.loadUsers();
  }

  closeModal() {
    this.dialogRef.close();
  }

  onSelect(event) {
    this.uploadFile(event.addedFiles);
  }

  onRemove(event) {
    this.removeFileIndex(event.key);
  }

  toNextStep() {
    if (this.step === 3) {
      this.publishAssets();
      return;
    }
    this.step++;
    this.stepLabel = STEPS[this.step];
    this.buttonLabel = BUTTON_LABEL[this.step];
    if (this.step === 3) {
      this.copyUserMap();
    }
    if (this.step === 2) {
      this.showWorkspaceList();
    }
  }

  toPreviousStep() {
    if (this.step === 1) return;
    this.step--;
    this.stepLabel = STEPS[this.step];
    this.buttonLabel = BUTTON_LABEL[this.step];
  }

  copyUserMap() {
    if (this.selectedUsers && this.selectedUsers.length > 0) {
      Object.keys(this.filesMap).forEach((key) => {
        this.customUsersMap[key] = [...this.selectedUsers];
      });
    }
  }

  checkButtonDisabled() {
    if (this.step === 1) {
      if (Object.keys(this.filesMap).length === 0) return true;
    }
    if (this.step === 2) {
      if (
        (!this.selectedFolder && !this.folderToAdd) ||
        !this.access ||
        !this.getDateFormat(this.associatedDate) ||
        !this.confidentiality ||
        (this.checkShowUserDropdown() &&
          this.selectedUsers &&
          this.selectedUsers.length === 0)
      )
        return true;
    }
    return false;
  }

  getDateFormat(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  getSelectedAssetsTitle() {
    const file = this.filesMap[Object.keys(this.filesMap)[0]];
    const len = Object.keys(this.filesMap).length;
    return `${file.name} ${len > 1 ? `and other ${len - 1} files` : ""}`;
  }

  showWorkspaceList() {
    if (!this.workspaceList || this.workspaceList.length === 0) {
      this.getWsList();
    }
    this.showWsList = true;
  }

  async selectWorkspace(ws) {
    this.selectedWorkspace = ws;
    this.showWsList = false;
    this.folderList = await this.getFolderList(ws.id);
    this.dropdownFolderList = [...this.folderList];
  }

  openBrowseRoute() {
    this.router.navigate(['/browse'], {queryParams: {sector: this.selectedWorkspace.id, folder: this.selectedFolder.title}});
  }

  async getWsList() {
    // const res = await this.apiService.get("/path/").toPromise();
    // const rootId = res["uid"];
    // this.workspaceList = await this.fetchByParent(rootId);
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 1000,
      queryParams: "SELECT * FROM Document WHERE ecm:mixinType != 'HiddenInNavigation' AND ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:primaryType = 'Domain'",
    };
    const res = await this.apiService.get(apiRoutes.NXQL_SEARCH, {params}).toPromise();
    this.workspaceList = this.formatWsList(res["entries"]);
  }

  checkAccessOptionDisabled(access, fileIndex?: any) {
    const confidentiality =
      this.customConfidentialityMap[fileIndex] || this.confidentiality;
    const currentAccess =
      this.customAccessMap[fileIndex] || this.access;
    if (!confidentiality || confidentiality === CONFIDENTIALITY.not) return false;
    if (access === ACCESS.all) {
      return true;
    }
    return false;
  }

  async getFolderList(workspaceId) {
    const res = await this.fetchByParent(workspaceId);
    const rootWs = res.find((entry) => entry.type === "WorkspaceRoot");
    if (!rootWs) return [];
    this.parentFolder = rootWs;
    return this.fetchByParent(rootWs.id);
  }

  async fetchByParent(parentId) {
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 1000,
      ecm_parentId: parentId,
      ecm_trashed: false,
    };
    const domainRes = await this.apiService
      .get(apiRoutes.ADVANCE_DOC_PP, {params})
      .toPromise();
    return this.formatWsList(domainRes["entries"]);
  }

  formatWsList(entries) {
    if (!entries) return [];
    return entries.map((entry) => ({
      id: entry.uid,
      title: entry.title,
      type: entry.type,
      path: entry.path,
    }));
  }

  async uploadFile(files) {
    if (!this.batchId) {
      await this.createBatchUpload();
    }
    for (let i = 0; i < files.length; i++) {
      this.uploadFileIndex(this.currentIndex, files[i]);
      this.currentIndex++;
    }
  }

  async createBatchUpload() {
    const res = await this.apiService.post(apiRoutes.UPLOAD, {}).toPromise();
    this.batchId = res["batchId"];
  }

  setUploadProgressBar(index, percentDone) {
    const element = <HTMLElement> document.getElementsByClassName(`upload-progress-bar-${index}`)[0];
    const background = `background-image: linear-gradient(to right, rgba(0, 104, 69, 0.1) ${percentDone}%,#ffffff ${percentDone}%) !important;`;
    let attr = element.getAttribute("style");
    attr = attr.replace(/background-image:.*?;/g,"");
    element.setAttribute("style", attr + background);
  }

  uploadFileIndex(index, file) {
    const uploadUrl = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    const blob = new Nuxeo.Blob({ content: file });
    const options = {
      reportProgress: true,
      observe: 'events',
      headers: {
        "Cache-Control": "no-cache",
        "X-File-Name": encodeURIComponent(blob.name),
        "X-File-Size": blob.size,
        "X-File-Type": blob.mimeType,
        "Content-Length": blob.size,
        "X-Authentication-Token": localStorage.getItem("token"),
      },
    };
    this.filesMap[index] = file;

    this.apiService.post(uploadUrl, blob.content, options).subscribe(
      (event) => {
        if (event.type == HttpEventType.UploadProgress) {
          const percentDone = Math.round((100 * event.loaded) / event.total);
          console.log(`File is ${percentDone}% loaded.`);
          this.setUploadProgressBar(index, percentDone);
        } else if (event instanceof HttpResponse) {
          console.log("File is completely loaded!");
        }
      },
      (err) => {
        console.log("Upload Error:", err);
        delete this.filesMap[index];
      },
      () => {
        this.setUploadProgressBar(index, 100);
        this.filesUploadDone[index] = true;
        console.log("Upload done");
      }
    );
  }

  removeFileIndex(index) {
    const url = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    this.apiService.delete(url).subscribe((res) => {
      delete this.filesMap[index];
    });
  }

  //// Custom input dropdown
  focusDropdown() {
    this.showCustomDropdown = true;
  }

  focusOutDropdown() {
    // this.showCustomDropdown = false;
  }

  filterFolder(event) {
    const input = event.target.value;
    if (!input) {
      this.dropdownFolderList = [...this.folderList];
      return;
    }
    this.dropdownFolderList = this.folderList.filter((folder) =>
      folder.title.toLowerCase().includes(input.toLowerCase())
    );
  }

  selectFolder(folder) {
    this.selectedFolder = folder;
    this.folderToAdd = null;
    this.showCustomDropdown = false;
  }

  addNewFolder(folderName) {
    this.folderToAdd = folderName.value;
    this.selectedFolder = null;
    this.showCustomDropdown = false;
  }

  onSelectConfidentiality(confidentiality, fileIndex?: any) {
    if (fileIndex !== null) {
      this.customConfidentialityMap[fileIndex] = confidentiality;
    } else {
      this.confidentiality = confidentiality;
    }
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAccess(access, fileIndex?: any) {
    if (fileIndex !== null) {
      this.customAccessMap[fileIndex] = access;
    } else {
      this.access = access;
    }
    this.checkShowUserDropdown(fileIndex);
  }

  checkShowUserDropdown(fileIndex?: any) {
    const access = this.customAccessMap[fileIndex] || this.access;
    const confidentiality =
      this.customConfidentialityMap[fileIndex] || this.confidentiality;
    if (
      (access && confidentiality === CONFIDENTIALITY.highly) ||
      (access === ACCESS.restricted && confidentiality)
    ) {
      return true;
    } else {
      return false;
    }
  }

  getPreviewSrc(file, index) {
    if (file.type.includes("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => (this.imageSrc[index] = reader.result);
      reader.readAsDataURL(file);
    } else {
      this.imageSrc[index] = "none";
    }
    return "";
  }

  humanFileSize(size) {
    const i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2)  + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
  }

  getTotalFileSize() {
    let size = 0;
    Object.keys(this.filesMap).forEach(key => {
      size += this.filesMap[key].size;
    });
    return this.humanFileSize(size);
  }

  async publishAssets() {
    let folder = Object.assign({}, this.selectedFolder);
    if (this.folderToAdd) {
      folder = await this.createFolder(this.folderToAdd);
    }
    Object.keys(this.filesMap).forEach(async (key) => {
      const asset = await this.createAsset(this.filesMap[key], key, folder);
      await this.setAssetPermission(asset, key);
    });
    this.step = 4;
  }

  async createAsset(file, index, folder) {
    const url = `/path${folder.path}`;
    let fileType = "File";
    if (file.type.includes("image/")) {
      fileType = "Picture";
    } else if (file.type.includes("video/")) {
      fileType = "Video";
    } else if (file.type.includes("audio/")) {
      fileType = "Audio";
    }
    const payload = {
      "entity-type": "document",
      repository: "default",
      path: `${folder.path}/null`,
      type: fileType,
      state: null,
      parentRef: folder.id,
      isCheckedOut: true,
      isRecord: false,
      retainUntil: null,
      hasLegalHold: false,
      isUnderRetentionOrLegalHold: false,
      isVersion: false,
      isProxy: false,
      changeToken: null,
      isTrashed: false,
      title: "null",
      properties: {
        "file:content": {
          "upload-batch": this.batchId,
          "upload-fileId": `${index}`,
        },
        "dc:description": this.description,
        "dc:path": folder.path,
        "dc:parentId": folder.id,
        "dc:title": file.name,
        "dc:parentName": folder.title,
        "dc:sector": this.selectedWorkspace.title,
      },
      facets: [
        "Versionable",
        "NXTag",
        "Publishable",
        "Commentable",
        "HasRelatedText",
        "Downloadable",
      ],
      schemas: [
        {
          name: "uid",
          prefix: "uid",
        },
        {
          name: "file",
          prefix: "file",
        },
        {
          name: "common",
          prefix: "common",
        },
        {
          name: "files",
          prefix: "files",
        },
        {
          name: "dublincore",
          prefix: "dc",
        },
        {
          name: "relatedtext",
          prefix: "relatedtext",
        },
        {
          name: "facetedTag",
          prefix: "nxtag",
        },
      ],
      name: file.name,
    };
    const res = await this.apiService.post(url, payload).toPromise();
    return {
      id: res["uid"],
      title: res["title"],
      type: res["type"],
      path: res["path"],
    };
  }

  async setAssetPermission(asset, index) {
    const params = {
      permission: "Read",
      notify: true,
      comment: "",
    };
    const access = this.customAccessMap[index] || this.access;
    const confidentiality =
      this.customConfidentialityMap[index] || this.confidentiality;
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
      input: asset.id,
    };
    this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
  }

  async createFolder(name) {
    const url = `/path${this.parentFolder.path}`;
    const payload = {
      "entity-type": "document",
      repository: "default",
      path: `${this.parentFolder.path}/null`,
      type: "Workspace",
      parentRef: this.parentFolder.id,
      isCheckedOut: true,
      isRecord: false,
      retainUntil: null,
      hasLegalHold: false,
      isUnderRetentionOrLegalHold: false,
      isVersion: false,
      isProxy: false,
      changeToken: null,
      isTrashed: false,
      title: "null",
      properties: {
        "webc:themePage": "workspace",
        "webc:theme": "sites",
        "webc:moderationType": "aposteriori",
        "dc:path": this.parentFolder.path,
        "dc:parentId": this.parentFolder.id,
        "dc:title": name,
        "dc:start": new Date(this.associatedDate).toISOString(),
        "dc:parentName": "Workspaces",
        "dc:sector": this.selectedWorkspace.title,
        "dc:primaryType": "event",
        "dc:folderType": "singleDayEvent",
      },
      facets: ["Folderish", "NXTag", "SuperSpace"],
      schemas: [
        {
          name: "webcontainer",
          prefix: "webc",
        },
        {
          name: "file",
          prefix: "file",
        },
        {
          name: "common",
          prefix: "common",
        },
        {
          name: "files",
          prefix: "files",
        },
        {
          name: "dublincore",
          prefix: "dc",
        },
        {
          name: "publishing",
          prefix: "publish",
        },
        {
          name: "facetedTag",
          prefix: "nxtag",
        },
      ],
      name: name,
    };
    const res = await this.apiService.post(url, payload).toPromise();
    return {
      id: res["uid"],
      title: res["title"],
      type: res["type"],
      path: res["path"],
    };
  }

  showLocaleDate(dateString) {
    return new Date(dateString).toLocaleDateString();
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
}
