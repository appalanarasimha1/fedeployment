import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { MatStepper } from "@angular/material/stepper";
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
import { ACCESS,
  CONFIDENTIALITY,
  ALLOW,
  GROUPS,
  ACCESS_LABEL,
  ALLOW_LABEL,
  CONFIDENTIALITY_LABEL,
  UNWANTED_WORKSPACES,
  ALLOW_VALUE_MAP,
  SPECIFIC_USER_LABEL,
  OWNER_APPROVAL_LABEL,
  YEARS,
  ACCESS_TITLE} from "./constant";
import { NgbTooltip} from '@ng-bootstrap/ng-bootstrap'
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";

import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatHorizontalStepper, MatStep, MatVerticalStepper } from '@angular/material/stepper';
import { ORDERED_FOLDER, PAGE_SIZE_200, ROOT_ID, WORKSPACE_ROOT } from "../common/constant";
import { DataService } from "../services/data.service";
interface FileByIndex {
  [index: string]: File;
}

const STEPS = {
  1: "Upload assets",
  2: "Publish assets",
  3: "Publish assets",
};

const BUTTON_LABEL = {
  1: "Next",
  2: "Review",
  3: "Publish",
};

@Component({
  selector: "app-upload-modal",
  templateUrl: "./upload-modal.component.html",
  styleUrls: ["./upload-modal.component.css"],
})
export class UploadModalComponent implements OnInit {
  @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;
  // @ViewChild('searchFolderInput') searchFolderInputRef: any;

  isLinear = true;
  panelOpenState = false;
  readonly ACCESS = ACCESS;
  readonly CONFIDENTIALITY = CONFIDENTIALITY;
  readonly ALLOW = ALLOW;
  readonly ACCESS_LABEL = ACCESS_LABEL;
  readonly ALLOW_LABEL = ALLOW_LABEL;
  readonly CONFIDENTIALITY_LABEL = CONFIDENTIALITY_LABEL;
  readonly SPECIFIC_USER_LABEL = SPECIFIC_USER_LABEL;
  readonly OWNER_APPROVAL_LABEL = OWNER_APPROVAL_LABEL;
  readonly WORKSPACE_ROOT = WORKSPACE_ROOT;
  readonly years = YEARS;
  readonly ACCESS_TITLE = ACCESS_TITLE;
  readonly ROOT_ID = ROOT_ID;
  readonly ORDERED_FOLDER = ORDERED_FOLDER;

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
  showWsList: boolean = true;
  selectedFolder: any;
  folderToAdd: string;
  parentFolder: any;
  associatedDate: string;
  description: string;
  access: string;
  confidentiality: string;
  allow: string;
  customAccessMap: any = {};
  customAllowMap: any = {};
  customConfidentialityMap: any = {};
  copyrightMap: any = {};
  customUsersMap: any = {};
  customDownloadApprovalUsersMap: any = {};
  customDownloadApprovalMap: any = {};
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  selectedUsers: string[] = [];
  userLoading: boolean = false;
  imageSrc: any = {};
  filesUploadDone: any = {};
  openCopyrightMap: any = {};
  copyrightUserMap: any = {};
  copyrightYearMap: any = {};
  ownerName: string[] = [];

  showCustomDropdown: boolean = false;
  disableDateInput = false;
  descriptionFilled = false;
  showFolderNameField = false;
  agreeTerms = false;
  folderNameParam: string;

  slideConfig = {
    rows: 2,
    dots: false,
    arrows: true,
    infinite: false,
    speed: 300,
    slidesToShow: 6,
    slidesToScroll: 6,
    variableWidth: true,
    centerMode: false,
  };
  uploadedAsset;
  downloadApproval: boolean = false;
  breadCrumb = [];
  assetCache: { [id: string]: any } = {};
  folderOrder: string = "";
  folderToAddName: string = "";
  publishing: boolean;

  showError: boolean = false;
  showErrorCheckbox: boolean = false;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<UploadModalComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log("incoming data = ", this.data);
    await this.showWorkspaceList();
    if (this.data) {
      const title = this.data.path.split("/workspaces")[0].substring(1);
      const workspace = this.data.contextParameters.breadcrumb.entries.filter(
        (workspace) => workspace.type.toLowerCase() === "domain"
      );
      await this.selectWorkspace(workspace[0]);
      this.showWsList = false;
      if (this.data.type.toLowerCase() !== "domain") {
        await this.selectWorkspace(this.data, true);
        this.folderNameParam = this.data.title;
        this.selectedFolder = this.data;
      }
      this.associatedDate = this.data?.properties?.["dc:start"];
    }
    // else {
    //   this.showWorkspaceList();
    // }
    this.stepLabel = STEPS[1];
    this.buttonLabel = BUTTON_LABEL[1];
    this.loadUsers();
  }

  openFileSelect(event) {
    console.log(event);
  }

  // descriptionCondition() {
  //   if(this.description)
  // }

  shortTheString(str: string, length: number): string {
    if (!str) return;
    return this.sharedService.stringShortener(str, length);
  }

  closeModal() {
    if (this.data?.sectorId) {
      this.dialogRef.close(this.uploadedAsset);
      return;
    }
    this.dialogRef.close(this.selectedFolder);
  }

  onSelect(event) {
    console.log("event.addedFiles", event.addedFiles);
    if (!event.addedFiles && !this.agreeTerms) {
      this.showError = true;
      this.showErrorCheckbox = false;
    } else {
      this.showError = false;
      this.showErrorCheckbox = false;
      this.uploadFile(event.addedFiles);
    }
  }

  onRemove(event) {
    this.removeFileIndex(event.key);
  }

  publish() {
    // this.step = 4;
    this.publishAssets();
    return;
  }

  toNextStep() {
    this.stepper.next();
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
    this.stepper.previous();
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
    if (this.downloadApproval && this.ownerName.length > 0) {
      Object.keys(this.filesMap).forEach((key) => {
        this.customDownloadApprovalUsersMap[key] = [...this.ownerName];
      });
    }
  }

  checkUploadStep() {
    const notUploadDone = Object.keys(this.filesUploadDone).find(key => !this.filesUploadDone[key]);
    if (notUploadDone) return true;
    if (Object.keys(this.filesMap).length === 0 || !this.agreeTerms) {
      // this.showError = true;
      return true;
    } else {
      this.showError = false;
      return false;
    }
  }

  checkUploadFormStep() {
    if (this.isPrivateFolder()) return false;
    // if (
    //   (!this.selectedFolder && !this.folderToAdd && !this.folderNameParam) ||
    //   !this.access ||
    //   !this.confidentiality || !this.allow ||
    //   (this.checkShowUserDropdown() &&
    //     this.selectedUsers &&
    //     this.selectedUsers.length === 0)
    // )
    //   return true;
    //   else return false;
  }

  checkButtonDisabled() {
    if (this.step === 1) {
      if (Object.keys(this.filesMap).length === 0 || !this.agreeTerms)
        return true;
      // else if(!this.agreeTerms) return true;
    }
    if (this.step === 2) {
      if (
        (!this.selectedFolder && !this.folderToAdd) ||
        !this.access ||
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
    return new Date(date).toISOString().split("T")[0];
  }

  getSelectedAssetsTitle() {
    if (!Object.keys(this.filesMap).length) return;
    const file = this.filesMap[Object.keys(this.filesMap)[0]];
    const len = Object.keys(this.filesMap).length;
    return `${this.shortTheString(file.name, 20)} ${
      len > 1 ? `and other ${len - 1} files` : ""
    }`;
  }
  getSelectedAssetsTitle1() {
    // const title = this.filesMap[0]?.title;
    const len = Object.keys(this.filesMap).length;

    return `${len} assets`;
  }

  async showWorkspaceList() {
    if (!this.workspaceList || this.workspaceList.length === 0) {
      await this.getWsList();
    }
    this.showWsList = true;
  }

  async selectWorkspace(ws, incomingParam?: boolean) {
    this.extractBreadcrumb(ws.contextParameters);
    this.showWsList = false;
    this.folderNameParam = "";
    // if(incomingParam) {
    //   this.selectedWorkspace.title = ws;
    //   return;
    // }
    // this.showWsList = false;
    this.folderList = await this.getFolderList(ws.uid);
    if (!incomingParam) {
      this.selectedWorkspace = ws;
      this.dropdownFolderList = [...this.folderList];
      return;
    }
    this.dropdownFolderList = [
      ...this.folderList.filter(
        (item) =>
          ["orderedfolder", "workspace"].indexOf(item.type.toLowerCase()) > -1
      ),
    ];
    return;
  }

  openBrowseRoute() {
    // if(this.data) {
    //   // NOTE: as per the new requirements, we do not want to navigate to the folder in case of uploading asset in a folder.
    //   this.closeModal();
    //   return;
    // }
    this.dialogRef.close();
    if (this.data?.uid === this.selectedFolder?.uid) {
      this.dataService.uploadedAssetDataInit(this.uploadedAsset);
      return;
    }
    const folderUid = this.selectedFolder?.uid; //  this.data?.uid || this.selectedFolder?.uid;
    this.router.navigate(["workspace"], { queryParams: { folder: folderUid } });
  }

  async getWsList() {
    // const res = await this.apiService.get("/path/").toPromise();
    // const rootId = res["uid"];
    // this.workspaceList = await this.fetchByParent(rootId);
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: PAGE_SIZE_200,
      queryParams:
        "SELECT * FROM Document WHERE ecm:mixinType != 'HiddenInNavigation' AND ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:primaryType = 'Domain'",
    };
    // TODO: loader
    const res = await this.apiService
      .get(apiRoutes.NXQL_SEARCH, { params })
      .toPromise();
    this.workspaceList = this.formatWsList(
      res["entries"],
      res["uid"],
      res["contextParameters"]
    ).filter((sector) => {
      if (UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1) {
        return sector;
      }
    });
  }

  filterWorkspaces(title: string): boolean {
    if (UNWANTED_WORKSPACES.indexOf(title.toLowerCase()) === -1) {
      return true;
    }
    return false;
  }

  checkAccessOptionDisabled(value: string, fileIndex?: any) {
    const confidentiality = !fileIndex
      ? this.overallConfidentiality
      : this.customConfidentialityMap[fileIndex];
    // console.log({ confidentiality });

    if (!confidentiality || confidentiality === CONFIDENTIALITY.not)
      return false;
    if (value === ACCESS.all) {
      return true;
    }
    if (value === ALLOW.any) {
      return true;
    }
    return false;
  }

  async getFolderList(workspaceId) {
    const res = await this.fetchByParent(workspaceId);
    const rootWs = res.find((entry) => entry.type === "WorkspaceRoot");
    if (!rootWs) return res;
    this.parentFolder = rootWs;
    return this.fetchByParent(rootWs.uid);
  }

  async getFolderByParentId(id: string, path: string, index?: number | null) {
    this.parentFolder = { id, path, type: this.ORDERED_FOLDER };
    const result = await this.getFolderList(id);
    this.folderNameParam = "";
    if (index === null) {
      this.dropdownFolderList = result.filter(
        (res) => res.type === this.ORDERED_FOLDER || res.type === "Workspace"
      );
      this.folderList = [...this.dropdownFolderList];
      this.breadCrumb.pop();
      return;
    }
    this.dropdownFolderList =
      index === 0
        ? result
        : result.filter((res) => res.type === this.ORDERED_FOLDER);
    this.folderList = [...this.dropdownFolderList];
  }

  extractBreadcrumb(contextParameters) {
    if (contextParameters) {
      this.breadCrumb = contextParameters?.breadcrumb.entries.filter(
        (entry) => {
          return entry.type.toLowerCase() !== "workspaceroot";
        }
      );
    }
  }

  removeBreadcrumb(title: string) {
    const breadCrumbIndex = this.breadCrumb.findIndex(
      (bread) => bread.title === title
    );
    this.breadCrumb.splice(breadCrumbIndex + 1);
  }

  async fetchByParent(parentId) {
    if (this.assetCache[parentId]) {
      // this.extractBreadcrumb(this.assetCache[parentId]["contextParameters"]);
      return this.assetCache[parentId]["entries"];
    }
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: PAGE_SIZE_200,
      ecm_parentId: parentId,
      ecm_trashed: false,
    };
    const domainRes: any = await this.apiService
      .get(apiRoutes.ADVANCE_DOC_PP, { params })
      .toPromise();
    // this.extractBreadcrumb(domainRes["contextParameters"]);
    return this.formatWsList(
      domainRes["entries"],
      parentId,
      domainRes["contextParameters"]
    );
  }

  formatWsList(entries: any[], uid: string, contextParameters: any) {
    if (!entries) return [];
    this.assetCache[uid] = {};
    this.assetCache[uid]["entries"] = entries.map((entry) => ({
      uid: entry.uid,
      title: entry.title,
      type: entry.type,
      path: entry.path,
      properties: entry.properties,
      contextParameters: entry.contextParameters,
    }));
    this.assetCache[uid]["contextParameters"] = contextParameters;
    return this.assetCache[uid]["entries"];
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
    const element = <HTMLElement>(
      document.getElementsByClassName(`upload-progress-bar-${index}`)[0]
    );
    const background = `background-image: linear-gradient(to right, rgba(0, 104, 69, 0.1) ${percentDone}%,#ffffff ${percentDone}%) !important;`;
    let attr = element.getAttribute("style");
    attr = attr.replace(/background-image:.*?;/g, "");
    // if (percentDone === 100) return;
    element.setAttribute("style", attr + background);
  }

  uploadFileIndex(index, file) {
    const uploadUrl = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    const blob = new Nuxeo.Blob({ content: file });
    const options = {
      reportProgress: true,
      observe: "events",
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
    this.filesUploadDone[index] = false;
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
    delete this.filesMap[index];
    const url = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    this.apiService.delete(url).subscribe((res) => {
      if (this.filesMap[index]) {
        delete this.filesMap[index];
        delete this.filesUploadDone[index];
      }
    });
  }

  //// Custom input dropdown
  focusDropdown() {
    // if(this.data) return;
    this.folderNameParam = "";
    this.selectedFolder = null;
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

  showCreateFolderButton(input: string): boolean {
    if (!input.trim()) return false;

    let dropdownFolderList: any[] = this.folderList.filter((folder) => {
      const folderSplit = input.split("/").pop();
      return folder.title.toLowerCase() === folderSplit.toLowerCase();
    });
    return !dropdownFolderList.length;
  }

  selectFolder(folder) {
    this.selectedFolder = folder;
    this.createFolderOrder();
    this.folderToAdd = null;
    this.showCustomDropdown = false;
    this.disableDateInput = true;
    this.associatedDate = this.selectedFolder.properties["dc:start"];
    this.descriptionFilled = true;
    this.description = this.selectedFolder.properties["dc:description"];
  }

  createFolderOrder(type?: string) {
    this.folderNameParam = "";
    this.breadCrumb.forEach((element) => {
      this.folderNameParam = `${this.folderNameParam}/${element.title}`;
    });
    if (type === "new") {
      this.folderNameParam =
        `${this.folderNameParam}/${this.folderToAdd}`.slice(1);
      return;
    }
    this.folderNameParam =
      `${this.folderNameParam}/${this.selectedFolder.title}`.slice(1);
  }

  addNewFolder(folderName) {
    this.descriptionFilled = false;
    this.description = "";
    this.folderToAddName = folderName.value;
    this.folderToAdd = folderName.value.split("/").pop();
    this.createFolderOrder("new");
    this.selectedFolder = null;
    this.showCustomDropdown = false;
    this.disableDateInput = false;
    this.associatedDate = "";
    this.description = "";
  }

  // onSelectConfidentiality(confidentiality, fileIndex?: any) {
  //   console.log("confidentiality", confidentiality);

  //   if (fileIndex !== null && fileIndex !== undefined) {
  //     this.filesMap[fileIndex] = confidentiality;
  //     this.customAccessMap[fileIndex] = undefined;
  //     this.customAllowMap[fileIndex] = undefined;
  //     this.confidentiality = confidentiality;
  //   } else {
  //     this.allow = undefined;
  //     this.access = undefined;
  //     this.confidentiality = confidentiality;
  //     this.overallAccess = undefined;
  //   }
  //   this.checkShowUserDropdown(fileIndex);
  // }

  onSelectConfidentiality(confidentiality, fileIndex?: any) {
    console.log({ fileIndex, asdfrgthgfd: this.customConfidentialityMap });

    if (fileIndex == null) {
      this.overallAccess = undefined;
      return;
    }
    // this.customConfidentialityMap[fileIndex] = confidentiality;
    this.customAccessMap[fileIndex] = undefined;
    this.customAllowMap[fileIndex] = undefined;
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAccess(access, fileIndex?: any) {
    console.log({ fileIndex });
    const allow = access === ACCESS.all ? ALLOW.any : ALLOW.internal;
    if (fileIndex !== null && fileIndex !== undefined) {
      this.customAccessMap[fileIndex] = access;
    } else {
      for (let i = 0; i < this.getAssetNumber(); i++) {
        // this.customAccessMap[i] = access;
      }
      this.access = access;
    }
    this.onSelectAllow(allow, fileIndex);
    this.checkShowUserDropdown(fileIndex);
  }

  onSelectAllow(allow, fileIndex?: any) {
    if (fileIndex !== null && fileIndex !== undefined) {
      this.customAllowMap[fileIndex] = allow;
    } else {
      for (let i = 0; i < this.getAssetNumber(); i++) {
        this.customAllowMap[i] = allow;
      }
      this.allow = allow;
    }
  }

  onCheckDownloadApproval(event) {
    if (!event.target.checked) {
      this.ownerName = [];
      for (let i = 0; i < this.getAssetNumber(); i++) {
        this.customDownloadApprovalUsersMap[i] = [];
      }
    }
    for (let i = 0; i < this.getAssetNumber(); i++) {
      this.customDownloadApprovalMap[i] = this.downloadApproval;
    }
  }

  openCopyright(fileIndex) {
    this.openCopyrightMap[fileIndex] = true;
  }

  closeCopyright(fileIndex) {
    this.openCopyrightMap[fileIndex] = false;
  }

  checkShowUserDropdown(fileIndex?: any) {
    const access =
      fileIndex == null
        ? this.overallAccess
        : this.customAccessMap[fileIndex] || this.access;
    const confidentiality =
      fileIndex == null
        ? this.overallConfidentiality
        : this.customConfidentialityMap[fileIndex] || this.confidentiality;
    if (access === ACCESS.restricted) {
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
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }

  getTotalFileSize() {
    let size = 0;
    Object.keys(this.filesMap).forEach((key) => {
      size += this.filesMap[key].size;
    });
    return this.humanFileSize(size);
  }

  async publishAssets() {
    this.publishing = true;
    let folder = Object.assign({}, this.selectedFolder); // this.data ? Object.assign({}, this.data) : Object.assign({}, this.selectedFolder);
    if (this.folderToAdd) {
      folder = await this.createFolder(this.folderToAdd);
      this.selectedFolder = folder;
    }

    for(let key in this.filesMap) {
      const asset = await this.createAsset(this.filesMap[key], key, folder);
      if (!this.isPrivateFolder()) await this.setAssetPermission(asset, key);
    }
    // this.calFileManagerApi();
    if(!this.showRedirectUrl()) {
      // this.dialogRef.close(this.uploadedAsset);
      this.publishing = false;
      this.sharedService.showSnackbar(
        "Asset added successfully.",
        3000,
        "bottom",
        "center",
        "snackBarMiddle"
      );
      return;
    }
    this.publishing = false;
    this.step = 4;
  }

  async createAsset(file, index, folder) {
    console.log({ file, index, folder });

    const url = `/path${folder.path}`;
    let fileType = "File";
    if (file.type?.includes("image/")) {
      fileType = "Picture";
    } else if (file.type?.includes("video/")) {
      fileType = "Video";
    } else if (file.type?.includes("audio/")) {
      fileType = "Audio";
    }
    const payload = {
      "entity-type": "document",
      repository: "default",
      path: `${folder.path}/null`, //
      type: fileType,
      state: null,
      parentRef: this.data ? this.data.uid : folder.id,
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
        "dc:path": folder.path, //
        "dc:parentId": this.data ? this.data.uid : folder.id,
        "dc:title": file.name,
        "dc:parentName": folder.title,
        "dc:sector": this.selectedWorkspace.title,
        "sa:confidentiality":
          this.customConfidentialityMap[index] || this.confidentiality,
        "sa:access": this.customAccessMap[index] || this.access,
        "sa:users": this.customUsersMap[index],
        "sa:downloadApprovalUsers": this.customDownloadApprovalUsersMap[index],
        "sa:allow": this.customAllowMap[index] || this.allow,
        "sa:copyrightName": this.openCopyrightMap[index]
          ? this.copyrightUserMap[index]
          : null,
        "sa:copyrightYear": this.openCopyrightMap[index]
          ? this.copyrightYearMap[index]?.name
          : null,
        "sa:downloadApproval": this.customDownloadApprovalMap[index],
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
    if (this.associatedDate) {
      payload["dc:start"] = new Date(this.associatedDate).toISOString();
    }
    const res = await this.apiService.post(url, payload, {headers: {'X-Batch-No-Drop': 'true'}}).toPromise();
    this.uploadedAsset = res;
    return {
      uid: res["uid"],
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
    try{
      await this.apiService.post(apiRoutes.ADD_PERMISSION, payload).toPromise();
      return;
    } catch (err) {
      console.error(err?.message);
      return;
    }
  }

  async createFolder(name, parentFolder?: any, data?: any) {
    const url = `/path${this.parentFolder.path}`;

    const payload = await this.sharedService.getCreateFolderPayload(
      name,
      this.selectedWorkspace.title,
      this.parentFolder,
      this.description,
      this.associatedDate
    );
    const res = await this.apiService.post(url, payload).toPromise();
    return {
      uid: res["uid"],
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
    return this.apiService.get(apiRoutes.SEARCH_USER, { params }).pipe(
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

  getAssetNumber(): number {
    return Object.keys(this.filesMap).length;
  }

  checkOwnerDropdown(index?: string) {
    if (index && this.customDownloadApprovalMap) {
      return this.customDownloadApprovalMap[index];
    }
    return !!this.downloadApproval;
    // return ALLOW_VALUE_MAP[this.allow] === 'Permission Required';
  }

  showRedirectUrl(): boolean {
    if (this.data?.sectorId) {
      this.step = 4;
      return false;
    }
    return true;
  }

  changeDownloadTick(key: string): void {
    this.customDownloadApprovalUsersMap[key] = [];
  }
  checkValidation() {
    if (Object.keys(this.filesMap).length === 0 && !this.agreeTerms) {
      this.showError = true;
      this.showErrorCheckbox = false;
    } else {
      this.showError = false;
      this.showErrorCheckbox = true;
    }
  }

  checkValidationCheckbox() {
    if (!this.agreeTerms) {
      this.showErrorCheckbox = true;
    } else {
      this.showErrorCheckbox = false;
    }
  }
  backBtn() {
    this.showErrorCheckbox = false;
  }
  overallConfidentiality: string;
  overallAccess: string;
  overallDownloadApproval: boolean = false;
  overallUsers: string[];
  overallDownloadApprovalUsers: string[];

  applyToAll() {
    const len = Object.keys(this.filesMap).length;
    console.log({ len });

    for (let i = 0; i < len; i++) {
      this.customConfidentialityMap[i] = this.overallConfidentiality;
      // this.filesMap[i] = this.overallConfidentiality;
      this.customAccessMap[i] = this.overallAccess;
      this.customDownloadApprovalMap[i] = this.overallDownloadApproval;
      this.customUsersMap[i] = this.overallUsers;
      this.customDownloadApprovalUsersMap[i] =
        this.overallDownloadApprovalUsers;
      const allow =
        this.overallAccess === ACCESS.all ? ALLOW.any : ALLOW.internal;
      this.customAllowMap[i] = allow;
    }
  }

  isPrivateFolder() {
    const isPrivate =
      this.selectedFolder?.properties &&
      this.selectedFolder?.properties["dc:isPrivate"];
    return isPrivate || this.selectedFolder?.isPrivate;
  }
  // checkOwnerDropdownByValue(value?: string) {
  //   switch (value) {
  //     case "true":
  //       return true;
  //     case "false":
  //       return false;
  //     default:
  //       return false;
  //   }
  // }
  // initACLValue() {
  //   for (let i = 0; i < Object.keys(this.filesMap).length; i++) {
  //     this.computeAclValue(this.filesMap[i], i);
  //   }
  // }
  // computeAclValue(doc, index) {
  //   this.customAllowMap[index] = doc.properties["sa:allow"];
  //   this.customDownloadApprovalMap[index] = this.checkOwnerDropdownByValue(
  //     doc.properties["sa:downloadApproval"]
  //   );
  //   this.copyrightUserMap[index] = doc.properties["sa:copyrightName"];
  //   this.copyrightYearMap[index] = doc.properties["sa:copyrightYear"];
  //   if (doc.properties["sa:confidentiality"]) {
  //     this.customConfidentialityMap[index] =
  //       doc.properties["sa:confidentiality"];
  //     this.customAccessMap[index] = doc.properties["sa:access"];
  //     this.customUsersMap[index] = doc.properties["sa:users"];
  //     this.customDownloadApprovalUsersMap[index] =
  //       doc.properties["sa:downloadApprovalUsers"];
  //     return;
  //   }
  //   const aces = doc.contextParameters.acls.find((a) => a.name === "local");
  //   if (!aces) {
  //     this.customConfidentialityMap[index] = "";
  //     this.customAccessMap[index] = "";
  //     this.customUsersMap[index] = [];
  //     this.customDownloadApprovalUsersMap[index] = [];
  //     return;
  //   }
  //   const localAces = aces.aces;
  //   const users = localAces.map((a) => a.username);
  //   if (users.includes(GROUPS.all)) {
  //     this.customConfidentialityMap[index] = CONFIDENTIALITY.not;
  //     this.customAccessMap[index] = ACCESS.all;
  //     this.customUsersMap[index] = [];
  //     this.customDownloadApprovalUsersMap[index] = [];
  //   } else if (users.includes(GROUPS.company)) {
  //     this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
  //     this.customAccessMap[index] = ACCESS.internal;
  //     this.customUsersMap[index] = [];
  //     this.customDownloadApprovalUsersMap[index] = [];
  //   } else if (users.length > 0) {
  //     this.customConfidentialityMap[index] = CONFIDENTIALITY.confidential;
  //     this.customAccessMap[index] = ACCESS.restricted;
  //     this.customUsersMap[index] = [...users];
  //   }
  // }

  checkFormState(): boolean {
    const length = Object.keys(this.filesMap).length;
    for (let i = 0; i < length; i++) {
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

  async calFileManagerApi() {
    // const url = `/upload/${this.batchId}/execute/FileManager.Import`;
    // const data = {
    //   "params": {
    //     "context": {
    //       "currentDocument":"/CSR/workspaces/Test Specific Users"
    //     }
    //   },
    //   "context": {
    //     "currentDocument":"/CSR/workspaces/Test Specific Users"
    //   }
    // };
    // const assets = await this.apiService.post(url, data).toPromise();
    // console.log('calFileManagerApi() = ', assets);
    await this.deleteUploadedBatchMetaData(this.batchId);
    // return assets;
  }

  async deleteUploadedBatchMetaData(batchId: string): Promise<any> {
    const url = `/upload/${this.batchId}`;
    const response = await this.apiService.delete(url).toPromise();
    console.log('deleteUploadedBatchMetaData() = ', response);
    return;
  }
}
