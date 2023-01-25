import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { concat, Observable, of, Subject } from "rxjs";
import Nuxeo from "nuxeo";
import { apiRoutes } from 'src/app/common/config';
import { SharedService } from "../services/shared.service";
import { WHITELIST_EXTENSIONS,} from "../upload-modal/constant";
import { ApiService } from "../services/api.service";

@Component({
  selector: 'app-upload-drone',
  templateUrl: './upload-drone.component.html',
  styleUrls: ['./upload-drone.component.css']
})
export class UploadDroneComponent implements OnInit {

  userWorkspaceInput$ = new Subject<string>();

  searchPopup: boolean = false;
  tagClicked: boolean = false;
  searchText: string = "";
  showUpload: boolean = false;
  files: File[] = [];
  dates = [];
  showInfo: boolean = false;
  cancleBlock: boolean = false;
  countFile:boolean = true;
  installationIdList = [];
  selectedDevice = null;
  batchId = null;
  currentIndex = 0;
  filesMap = {};
  filesUploadDone = {};
  fileUploadProgress = [];
  loading = false;
  company = "";
  companyId = "";
  now = new Date();
  publishStep = false;
  totalPercent = 0;
  user = "";

  constructor(
    public dialogRef: MatDialogRef<UploadDroneComponent>,
    public sharedService: SharedService,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.showUpload = false;
    this.installationIdList = this.data?.installationIdList || [];
    this.company = this.data?.company;
    this.companyId = this.data?.companyId;
    if (!this.installationIdList || this.installationIdList.length === 0) {
      this.initData();
    }
  }

  closeModal(done?) {
    this.dialogRef.close(done);
  }

  onSearchBarChange(e) {

  }
  blurOnSearch() {
    console.log("this.searchText", this.searchText);

    if (this.tagClicked) {
    } else {
      setTimeout(() => {
        this.searchPopup = false;
      }, 500);
    }
  }

  inputClicked() {
    this.searchPopup = true;
    this.tagClicked = false;
  }

  outClick() {
    console.log("qwertgyhuiop");
  }

  showUploadBlock(device) {
    this.showUpload = !this.showUpload;
    this.selectedDevice = device;
  }

  generateUploadHeader() {
    if (!this.selectedDevice) return "New Installation ID";
    return `${this.selectedDevice.installationId} ${this.selectedDevice.area} ${this.selectedDevice.location}`;
  }

  async getUploadFolderPath() {
    const body = {
      context: {},
      params: {
        installationId: this.selectedDevice.installationId,
        location: this.selectedDevice.initial,
      },
    };
    const res = await this.apiService.post(apiRoutes.GET_DRONE_UPLOAD_PATH, body).toPromise();
    if (!res) return null;
    return res["value"];
  }

  async startUpload() {
    this.loading = true;
    await this.uploadFile(this.files);
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

  async uploadFileIndex(index, file) {
    const uploadUrl = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    const blob = new Nuxeo.Blob({ content: file });
    const totalSize = blob.size;
    this.filesMap[index] = file;
    this.filesUploadDone[index] = false;
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
    this.apiService.post(uploadUrl, blob.content, options).subscribe(
      (event) => {
        if (event.type == HttpEventType.UploadProgress) {
          const percentDone = Math.round((100 * event.loaded) / event.total);
          console.log(`File is ${percentDone}% loaded.`);
          this.setUploadProgressBar(index, percentDone);
        } else if (event instanceof HttpResponse) {
          // this.checkUploadedFileStatusAndUploadFailedChunks(uploadUrl);
          console.log("File is completely loaded!");
        }
      },
      (err) => {
        console.log("Upload Error:", err);
        this.filesMap[index]['isVirus'] = true;
        // delete this.filesMap[index];
      },
      () => {
        this.setUploadProgressBar(index, 100);
        this.filesUploadDone[index] = true;
        console.log("Upload done");
      }
    );
  }

  setUploadProgressBar(index, percent) {
    this.fileUploadProgress[index] = percent || 0;
    const sum = this.fileUploadProgress.reduce((partialSum, a) => partialSum + a, 0);
    this.totalPercent = Math.ceil(sum / this.fileUploadProgress.length);
    if (this.totalPercent === 100) {
      this.loading = false;
      this.publishStep = true;
    }
  }


  async publishAssets() {
    this.loading = true;
    // this.publishing = true;
    const folderToAdd = await this.getUploadFolderPath();
    for(let key in this.filesMap) {
      const asset = await this.createAsset(this.filesMap[key], key, folderToAdd);
    }

    this.sharedService.showSnackbar(
      "Publish assets successfully.",
      3000,
      "top",
      "center",
      "snackBarMiddle"
    );
    this.closeModal(true);
    // if(!this.showRedirectUrl()) {
    //   this.publishing = false;
    //   this.sharedService.showSnackbar(
    //     "Asset added successfully.",
    //     3000,
    //     "bottom",
    //     "center",
    //     "snackBarMiddle"
    //   );
    //   return;
    // }
    // this.publishing = false;
    // this.step = 4;
  }

  async createAsset(file, index, folder) {
    const date = this.dates[index];
    const url = encodeURI(`/path${folder}`);
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
      type: fileType,
      state: null,
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
        "dc:title": file.name,
        "dc:assetTimeTaken": "",
        "dc:assetDateTaken": date?.toISOString().slice(0,10).replace(/-/g,"") || "",
        "dc:installationId": this.selectedDevice.installationId,
        "dc:timeZone": "Asia/Riyadh",
        "dc:deviceType": this.selectedDevice.type,
        "dc:vendor": this.companyId,
        "drone_asset:region": this.selectedDevice.locationId,
        "drone_asset:area": this.selectedDevice.areaId,
        "drone_asset:device": this.selectedDevice.installationId,
        "drone_asset:supplier": this.companyId,
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
    payload.properties["file:content"] = {
      "upload-batch": this.batchId,
      "upload-fileId": `${index}`,
    }
    const res = await this.apiService.post(url, payload, {headers: {'X-Batch-No-Drop': 'true'}}).toPromise();
    return {
      uid: res["uid"],
      title: res["title"],
      type: res["type"],
      path: res["path"],
    };
  }

  onSelect(event) {
    const addedFiles = this.filterWhitelistFiles(event.addedFiles);
    this.files = [...this.files, ...addedFiles];
    const addedDates = Array(addedFiles.length).fill(this.now);
    this.dates = [...this.dates, ...addedDates];
    // this.uploadFile(this.files);

    // this.countFile = false;
  }

  filterWhitelistFiles(files: any) {
    const filteredFile = [];
    for (const file of files) {
      const filenameSplit = file.name.split('.');
      if (filenameSplit.length > 2) {}
      else if (WHITELIST_EXTENSIONS.includes(file.type)) {
        filteredFile.push(file);
      } else if (filenameSplit[1] && WHITELIST_EXTENSIONS.includes(filenameSplit[1].toLowerCase())) {
        filteredFile.push(file);
      } else if (file.type?.includes("image/")) {
        filteredFile.push(file);
      } else if (file.type?.includes("video/")) {
        filteredFile.push(file);
      } else if (file.type?.includes("audio/")) {
        filteredFile.push(file);
      } else {
        // const blockedFile = file;
        // blockedFile['isBlocked'] = true;
        // filteredFile.push(blockedFile);
      }
    }

    return filteredFile;
  }

  onRemove(event) {
    // console.log(event);]
    const index = this.files.indexOf(event);
    this.files.splice(index, 1);
    this.dates.splice(index, 1);

    // this.showInfo = false;
    // this.countFile = true;
    // this.removeFileIndex(event.key);
  }

  removeFileIndex(index) {
    delete this.filesMap[index];
    // delete this.filesUploadDone[index];
    // const url = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    // try {
    //   this.apiService.delete(url)
    //   .subscribe((res) => {
    //     if (this.filesMap[index]) {
    //       delete this.filesMap[index];
    //       delete this.filesUploadDone[index];
    //     }
    //   })
    // } catch(err) {
    //   if (this.filesMap[index]) {
    //     delete this.filesMap[index];
    //     delete this.filesUploadDone[index];
    //   }
    // }
  }

  updateFileDate(event, index) {
    const date = event.value;
    this.dates[index] = date;
  }

  gettingInfo(event) {
    event.stopPropagation();
    this.showInfo = !this.showInfo;
  }

  cancleShowHide() {
    this.cancleBlock = !this.cancleBlock;
  }


  //TODO: pass data from document-assets component
  async initData() {
    this.user = JSON.parse(localStorage.getItem("user"))["username"];
    const pormiseArray = [];
    pormiseArray.push(this.getDeviceList());
    pormiseArray.push(this.getSupplierList());
    pormiseArray.push(this.getRegionList());
    pormiseArray.push(this.getSubAreaList());
    await Promise.all(pormiseArray);
    this.computeInstallationIdList();
  }
  deviceList = [];
  regionList = [];
  regionMap = {};
  subAreaList = [];
  subAreaMap = {};
  supplierList = [];

  async getDeviceList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Device' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();

    if (!res) return;
    const devices = res["entries"];
    this.deviceList = devices.map((device) => ({
      deviceTyp: device.properties["device:deviceTyp"],
      latitude: device.properties["device:latitude"],
      longitude: device.properties["device:longitude"],
      initial: device.properties["device:initial"],
      direction: device.properties["device:direction"],
      poleId: device.properties["device:poleId"],
      region: device.properties["device:region"],
      subArea: device.properties["device:subArea"],
      status: device.properties["device:status"],
      name: device.title,
      uid: device.uid,
    }));
  }

  async getRegionList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Region' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();

    if (!res) return;
    const regions = res["entries"];
    this.regionList = regions.map((region) => ({
      initial: region.properties["region:initial"],
      name: region.title,
      uid: region.uid,
      locations: region.properties["region:locations"],
    }));
    this.computeRegionMap();
  }

  computeRegionMap() {
    this.regionMap = {};
    this.regionList?.forEach((region) => {
      this.regionMap[region.uid] = region;
    });
  }

  async getSubAreaList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'SubArea' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();

    if (!res) {
      this.subAreaList = [];
      return;
    }
    this.subAreaList = res["entries"].map((area) => ({
      locationId: area.properties["subArea:locationId"],
      name: area.title,
      uid: area.uid,
    }));
    this.computeSubAreaMap();
  }

  computeSubAreaMap() {
    this.subAreaMap = {};
    this.subAreaList?.forEach((subArea) => {
      this.subAreaMap[subArea.uid] = subArea;
    });
  }

  computeInstallationIdList() {
    this.installationIdList = this.deviceList.map(device => ({
      installationId: device.name,
      area: this.subAreaMap[device.subArea]?.name,
      location: this.regionMap[device.region]?.name,
      areaId: device.subArea,
      locationId: device.region,
      initial: this.regionMap[device.region]?.initial,
      type: device.deviceTyp,
    }));
  }

  async getSupplierList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Supplier' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();

    if (!res) return;
    this.supplierList = res["entries"].map((supplier) => ({
      name: supplier.title,
      uid: supplier.uid,
      regions: supplier.properties["supplier:regions"],
      users: supplier.properties["supplier:supplierUsers"],
      activated: supplier.properties["supplier:activated"],
      supportEmail: supplier.properties["supplier:supportEmail"],
      expiry: supplier.properties["supplier:expiry"],
      renameEmail: false,
    }));
    const currentUserSupplier = this.supplierList.find((supplier) =>
      supplier.users?.find(user => user.user == this.user)
    );
    this.company = currentUserSupplier?.name || "";
    this.companyId = currentUserSupplier?.uid || "";
  }

}
