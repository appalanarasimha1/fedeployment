import { Component, OnInit, Inject, Output, EventEmitter } from "@angular/core";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { concat, Observable, of, Subject } from "rxjs";
import Nuxeo from "nuxeo";
import { apiRoutes } from "src/app/common/config";
import { SharedService } from "../services/shared.service";
import { WHITELIST_EXTENSIONS } from "../upload-modal/constant";
import { ApiService } from "../services/api.service";
import { environment } from '../../environments/environment';
import * as moment from "moment";
import {Clipboard} from '@angular/cdk/clipboard';


const MAX_CHUNK_SIZE = 7 * 100 * 1000 * 1000; // NOTE: this denotes to 700MB
const MAX_PROCESS_SIZE = 10 * 1000 * 1000 * 1000; // 10GB
const CONCURRENT_UPLOAD_REQUEST = 1;
const apiVersion1 = environment.apiVersion;

@Component({
  selector: "app-upload-drone",
  templateUrl: "./upload-drone.component.html",
  styleUrls: ["./upload-drone.component.css"],
})
export class UploadDroneComponent implements OnInit {
  userWorkspaceInput$ = new Subject<string>();

  isDroneOperator: boolean = false;
  isNextButton: boolean = false;
  searchPopup: boolean = false;
  tagClicked: boolean = false;
  searchText: string = "";
  uploadDate: Date;
  showDateDropdown: boolean = false;
  selectedDate = null;
  showUpload: boolean = false;
  showDatePicker: boolean = false;
  files: File[] = [];
  dates = [];
  srtDates = [];
  showInfo: boolean = false;
  cancleBlock: boolean = false;
  countFile: boolean = true;
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
  filteredInstallationIdList = [];
  isSelectAll = false;
  allDate = new Date();
  supplierRegions = null;
  dateHiideSrt: boolean = true;
  startUpLoading = false;
  maxDate= new Date()
  chunksFailedToUpload = {};
  recReqCount:number=0
  filesRetry ={}
  uploadFailedRetry ={}

  constructor(
    public dialogRef: MatDialogRef<UploadDroneComponent>,
    public sharedService: SharedService,
    private apiService: ApiService,
    private clipboard: Clipboard,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.showUpload = false;
    this.checkIsDroneOperator();
    this.installationIdList = this.data?.installationIdList || [];
    this.company = this.data?.company;
    this.companyId = this.data?.companyId;
    if (!this.installationIdList || this.installationIdList.length === 0) {
      this.initData();
    } else {
      this.filterDroneInstallationIdList();
      this.filteredInstallationIdList = this.installationIdList;
    }
  }

  checkIsDroneOperator() {
    const data = window.localStorage.getItem('user');
    if (data) {
      const user = JSON.parse(data);
      if (user.groups && user.groups.length > 0) {
        if(user.groups.includes('drone_uploader')) {
          this.isDroneOperator = true;
          this.isNextButton = true;
        }
      }
    }
  }
        


  closeModal(done?) {
    this.dialogRef.close(done);
  }

  onSearchBarChange(e) {  
    if (!this.searchText) {
      this.filteredInstallationIdList = this.installationIdList;
      return;
    }
    const term = this.searchText.toLowerCase();
    this.filteredInstallationIdList = this.installationIdList.filter(device =>{
      return device.area?.toLowerCase().includes(term)
      || device.initial?.toLowerCase().includes(term)
      || device.installationId?.toLowerCase().includes(term)
      || device.location?.toLowerCase().includes(term)
      || device.type?.toLowerCase().includes(term)
    });
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

  updateSelectAllDate() {

  }

  inputClicked() {
    this.searchPopup = true;
    this.tagClicked = false;
  }

  outClick() {
    console.log("qwertgyhuiop");
  }

  showUploadBlock(device) {
    if(this.isDroneOperator) {
      this.showDatePicker = true;
    } else {
      this.showUpload = true;
    }
    this.selectedDevice = device;
  }

  next() {
    this.showUpload = true;
    this.selectedDate = this.selectedDate || this.uploadDate
    this.selectedDate = moment(this.selectedDate).toISOString(true).split('T')[0];
    this.isNextButton = false;
    this.showDatePicker = false;
    this.startUpLoading = false;
  }

  generateUploadHeader() {
    if(!this.isDroneOperator) {
      if(!this.selectedDevice ) return "New Installation ID";
    }
    else {
      if(!this.selectedDevice || !this.selectedDate) return "New Installation ID";
    }
    return `${this.selectedDevice.installationId} ${this.selectedDevice.area} ${this.selectedDevice.location}`;
  }

  generateUploadDate() {
    if (!this.selectedDevice || !this.selectedDate) return "";
    return `${this.selectedDate}`;
  }

  async getUploadFolderPath() {
    const body = {
      context: {},
      params: {
        installationId: this.selectedDevice.installationId,
        location: this.selectedDevice.initial || this.getInstallationIdRegion(this.selectedDevice.installationId),
        selectedDate: this.selectedDate?.slice(0, 10).replace(/-/g, "")
      },
    };
    const res = await this.apiService
      .post(apiRoutes.GET_DRONE_UPLOAD_PATH, body)
      .toPromise();
    if (!res) return null;
    return res["value"];
  }
  allFiles;
  async startUpload() {
    // this.loading = true;
    this.failedFiles = []
    this.startUpLoading = true;
    this.allFiles =[...this.files,...this.srtFiles]
    await this.uploadFile(this.allFiles);
    // console.log("upload done")
  }
  allowPublish:boolean=false
  async uploadFile(files,index?:number) {
    if (!this.batchId) {
      await this.createBatchUpload();
    }
    for (let i = index?index+1:0; i < files.length; i++) {
      await this.uploadFileIndex(this.currentIndex, files[this.currentIndex],files.length , i);
      this.currentIndex++;
    }
  }

  async createBatchUpload() {
    const res = await this.apiService.post(apiRoutes.UPLOAD, {}).toPromise();
    this.batchId = res["batchId"];
  }
  failedFiles =[]
  async uploadFileIndex(index, file,length?:number,currentItration?:number) {
    const uploadUrl = `${apiRoutes.UPLOAD}/${this.batchId}/${index}`;
    const blob = new Nuxeo.Blob({ content: file });
    const totalSize = blob.size;
    this.filesMap[index] = file;
    this.filesUploadDone[index] = false;
    this.chunksFailedToUpload = {};

    if (totalSize > MAX_CHUNK_SIZE) {
      // upload file in chunk
      const totalChunk = Math.ceil(totalSize / MAX_CHUNK_SIZE);
      console.log('total chunk: ' + totalChunk);
      return new Promise<void>(async (resolve, reject) => {
        try {
          let promiseArray = [];
          let chunksToBeSent = totalChunk;
          let chunkIndex = 0;
          for (let j = 0; j < Math.ceil(totalChunk/CONCURRENT_UPLOAD_REQUEST); j++) {
            console.log('value of Math.ceil(totalChunk/CONCURRENT_UPLOAD_REQUEST) = ', Math.ceil(totalChunk/CONCURRENT_UPLOAD_REQUEST));
            chunksToBeSent = chunksToBeSent % CONCURRENT_UPLOAD_REQUEST === 0 ? CONCURRENT_UPLOAD_REQUEST : totalChunk % CONCURRENT_UPLOAD_REQUEST ;
            for (let i = 0; i < chunksToBeSent; i++) {
              const chunkedBlob = file.slice((i + j) * MAX_CHUNK_SIZE, (i + j + 1) * MAX_CHUNK_SIZE);
              console.log("i = ", i, " | j = ", j);
              promiseArray.push(this.uploadFileChunk(index, uploadUrl, chunkedBlob, chunkIndex, totalChunk, totalSize, encodeURIComponent(blob.name), blob.mimeType));

              console.log("chunkIndex = ", chunkIndex);
              chunkIndex += 1;
              if (promiseArray.length === chunksToBeSent) await Promise.all(promiseArray.map(p => p.catch(e => e)));
            }
            if(CONCURRENT_UPLOAD_REQUEST - chunksToBeSent > 0)
              chunksToBeSent = totalChunk - chunksToBeSent;
            promiseArray = [];
          }
          this.checkUploadedFileStatusAndUploadFailedChunks(uploadUrl);
          if (promiseArray.length > 0) await Promise.all(promiseArray);
          this.filesUploadDone[index] = true;
          if (this.currentIndex == length-1) {
            this.allowPublish = true;
            this.startUpLoading = false;
            this.publishStep = true;
          }
          // this.filesUploadDone[index] = true;
          this.filesRetry[index] = null
          this.uploadFailedRetry[index] = null
          resolve();
        } catch (err) {
          console.log("Upload Error:", err);
          this.recReqCount = this.recReqCount +1
          this.filesRetry[index] = this.recReqCount
          
          if(this.recReqCount >2){
            if (this.currentIndex == length-1) {
              if(length !==1){
                this.allowPublish = true;
                this.publishStep = true;
              }
              this.startUpLoading = false;
            }
            this.recReqCount = 0
            this.uploadFailedRetry[index] = true
            this.filesRetry[index] = null
            this.failedFiles.push(file)
            delete this.filesMap[index];
            if(this.allFiles.length-1 > this.currentIndex){
              this.uploadFile(this.allFiles,this.currentIndex++)
            }
            
            // reject();
          }else{
            setTimeout(() => {
              this.uploadFileIndex(index, file,length,currentItration)
            }, 5000);
            
          }
        }
      });
    } else {
    const options = {
      reportProgress: true,
      observe: "events",
      headers: {
        "Cache-Control": "no-cache",
        "X-File-Name": encodeURIComponent(blob.name),
        "X-File-Size": blob.size,
        "X-File-Type": blob.mimeType,
        "Content-Length": blob.size,
        "X-Authentication-Token": localStorage.getItem("token"), // TODO: will alter it to fetch this token from cookies rather than storing it in localstorage
      },
    };
    // this.apiService.post(uploadUrl, blob.content, options).subscribe(
    //   (event) => {
    //     if (event.type == HttpEventType.UploadProgress) {
    //       const percentDone = Math.round((100 * event.loaded) / event.total);
    //       console.log(`File is ${percentDone}% loaded.`);
    //       this.setUploadProgressBar(index, percentDone);
    //     } else if (event instanceof HttpResponse) {
    //       // this.checkUploadedFileStatusAndUploadFailedChunks(uploadUrl);
    //       // console.log("this.currentIndex",this.currentIndex,length);
          
    //       if (this.currentIndex-1 == length) {
    //         this.allowPublish = true;
    //         this.startUpLoading = false;
    //         this.publishStep = true;
    //       }
    //       console.log("File is completely loaded!");
    //     }
    //   },
    //   (err) => {
    //     console.log("Upload Error:", err);
    //     this.filesMap[index]["isVirus"] = true;
    //     // delete this.filesMap[index];
    //     if (this.currentIndex-1 == length) {
    //       this.allowPublish = true;
    //       this.startUpLoading = false;
    //       this.publishStep = true;
    //     }
    //   },
    //   () => {
    //     this.setUploadProgressBar(index, 100);
    //     this.filesUploadDone[index] = true;
    //     // console.log("Upload done");
    //     if (this.currentIndex-1 == length) {
    //       this.allowPublish = true;
    //       this.startUpLoading = false;
    //       this.publishStep = true;
    //     }
    //   }

    // );
    return new Promise<void>((resolve, reject) => {
      this.apiService.post(uploadUrl, blob.content, options).subscribe(
        (event) => {
          // console.log("this.currentIndex",this.currentIndex,length,event);
          if (event.type == HttpEventType.UploadProgress) {
            const percentDone = Math.round((100 * event.loaded) / event.total);
            console.log(`File is ${percentDone}% loaded.`);
            this.setUploadProgressBar(index, percentDone);
          } else if (event instanceof HttpResponse) {
            // this.checkUploadedFileStatusAndUploadFailedChunks(uploadUrl);
            // console.log("File is completely loaded!");
            resolve();
          }
        },
      (err) => {
          console.log("Upload Error:", err);
          // this.filesMap[index]['isVirus'] = true;
          this.recReqCount = this.recReqCount +1
          this.filesRetry[index] = this.recReqCount
          
          if(this.recReqCount >2){
            if (this.currentIndex == length-1) {
              if(length !==1){
                this.allowPublish = true;
                this.publishStep = true;
              }
              this.startUpLoading = false;
            }
            this.recReqCount = 0
            this.uploadFailedRetry[index] = true
            this.filesRetry[index] = null
            this.failedFiles.push(file)
            delete this.filesMap[index];
            if(this.allFiles.length-1 > this.currentIndex){
              this.uploadFile(this.allFiles,this.currentIndex++)
            }
            
            // reject();
          }else{
            setTimeout(() => {
              this.uploadFileIndex(index, file,length,currentItration)
            }, 5000);
            
          }
          
          // delete this.filesMap[index];
        },
        () => {
          console.log("this.currentIndex",this.currentIndex,length);
          this.setUploadProgressBar(index, 100);
          this.filesUploadDone[index] = true;
          this.filesRetry[index] = null
          this.uploadFailedRetry[index] = null
          $('.upload-file-preview.errorNewUi').css('background-image', 'linear-gradient(to right, #FDEDED 100%,#FDEDED 100%)');
          console.log("Upload done");
          
          if (this.currentIndex == length-1) {
            this.allowPublish = true;
            this.startUpLoading = false;
            this.publishStep = true;
          }
          resolve();
        }
      )
    });
  }
  }

  setUploadProgressBar(index, percent) {
    console.log({index, percent});
    this.fileUploadProgress[index] = percent || 0;
    const sum = this.fileUploadProgress.reduce(
      (partialSum, a) => partialSum + a,
      0
    );
    this.totalPercent = Math.ceil(sum / this.fileUploadProgress.length);
    if (this.totalPercent === 100) {
      this.loading = false;
      // this.publishStep = true;
    }
  }

  async publishAssets() {
    this.loading = true;
    // this.publishing = true;
    const folderToAdd = await this.getUploadFolderPath();
    for (let key in this.filesMap) {
      const asset = await this.createAsset(
        this.filesMap[key],
        key,
        folderToAdd
      );
    }
    this.sharedService.newEvent('Upload done');

    this.sharedService.showSnackbar(`${Object.keys(this.filesMap).length} assets uploaded`, 4000, 'top', 'center', 'snackBarMiddle');

    // this.sharedService.showSnackbar(
    //   `${this.files.length +this.srtFiles.length} assets uploaded`,
    //   3000,
    //   "top",
    //   "center",
    //   "snackBarMiddle"
    // );
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
    let fileType = "File";
    let filePath = "";
    if (file.type?.includes("image/")) {
      fileType = "Picture";
      filePath = "/Photos";
    } else if (file.type?.includes("video/")|| file.name?.toLowerCase().includes(".srt")) {
      fileType = "Video";
      filePath = "/Videos";
    } else if (file.name?.toLowerCase().includes(".srt")) {
      fileType = "Srt";
      filePath = "/Videos";
    } 
    else if (file.type?.includes("audio/")) {
      fileType = "Audio";
    }
    const url = encodeURI(`/path${folder}`) + filePath;
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
        "dc:assetDateTaken":
          this.selectedDate?.slice(0, 10).replace(/-/g, "") ||date?.toISOString().slice(0, 10).replace(/-/g, "") || "",
        "dc:installationId": this.selectedDevice.installationId,
        "dc:timeZone": "Asia/Riyadh",
        "dc:deviceType": this.selectedDevice.type,
        "dc:vendor": this.companyId,
        // "drone_asset:region": this.selectedDevice.locationId,
        // "drone_asset:area": this.selectedDevice.areaId,
        // "drone_asset:device": this.selectedDevice.deviceId,
        // "drone_asset:supplier": this.companyId,
        // "drone_asset:assetTimeTaken": "",
        // "drone_asset:cameraId": this.selectedDevice.installationId,
        // "drone_asset:latitude": this.selectedDevice.latitude,
        // "drone_asset:longitude": this.selectedDevice.longitude,
        // "drone_asset:areaName": this.selectedDevice.initial,
        // "drone_asset:subAreaName": this.selectedDevice.area,
        // "drone_asset:direction": this.selectedDevice.direction,
        // "drone_asset:supplierCompany": this.company,
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
    };
    const res = await this.apiService
      .post(url, payload, { headers: { "X-Batch-No-Drop": "true" } })
      .toPromise();
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
    // const addedDates = Array(addedFiles.length).fill(event.addedFiles[]);
    for(let i = 0; i < addedFiles.length; i++) {
      this.dates.push(addedFiles[i].lastModifiedDate);
    }
    // this.dates = [...this.dates, ...addedDates];
    // this.uploadFile(this.files);
    // this.countFile = false;
  }

  srtFiles: any = []
  filterWhitelistFiles(files: any) {
    let filteredFile = this.sharedService.filterSafeFiles(files);
    this.srtFiles = filteredFile.filter((file) => {
      if (file.name?.toLowerCase().includes(".srt")) {
        this.srtDates.push(file.lastModifiedDate);
        return true;
      }
      return false;
    })
    filteredFile = filteredFile.filter((file) => !file.name?.toLowerCase().includes(".srt"))
    if (this.srtFiles.length) {
      this.dateHiideSrt = false;
    }
    return filteredFile;
  }

  onRemove(event) {
    // console.log(event);]
    if(this.publishStep) return 
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
    pormiseArray.push(this.getRegionList());
    pormiseArray.push(this.getSubAreaList());
    await Promise.all(pormiseArray);
    await this.getSupplierList();
    await this.getDeviceList();
    this.computeInstallationIdList();
  }
  deviceList = [];
  regionList = [];
  regionMap = {};
  subAreaList = [];
  subAreaMap = {};
  supplierList = [];

  async getDeviceList() {
    const url = "/settings/camera";
    const res = (await this.apiService.get(url, {}).toPromise()) as any;

    if (!res) return;
    const devices = res;
    this.deviceList = devices.map((device) => ({
      deviceType: device.deviceType,
      latitude: device.latitude,
      longitude: device.longitude,
      initial: device.initial,
      direction: device.direction,
      cameraPole: device.cameraPole,
      region: device.region,
      areaName: device.areaName,
      subArea: device.subArea,
      subAreaName: device.subAreaName,
      status: device.status,
      installationId: device.installationId,
      uid: device.id,
    }));
    this.deviceList = this.deviceList.filter(device => device.status !== "decommissioned");

    if (this.supplierRegions) {
      this.deviceList = this.deviceList.filter(device =>
        this.supplierRegions.includes(this.getInstallationIdRegion(device.installationId))
      );
    }
  }

  getInstallationIdRegion(installationId) {
    try {
      const split = installationId.split('-');
      return split[split.length - 2];
    } catch (e) {
      return null;
    }
  }

  async getRegionList() {
    const url = "/settings/area";
    const res = (await this.apiService.get(url, {}).toPromise()) as any;

    const regions = res || [];
    this.regionList = regions.map((region) => ({
      initial: region.code,
      name: region.title,
      uid: region.id,
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
    const url = "/settings/subarea";
    const res = (await this.apiService.get(url, {}).toPromise()) as any;

    if (!res) {
      this.subAreaList = [];
      return;
    }
    this.subAreaList = res.map((area) => ({
      locationId: area.locationId,
      name: area.name,
      uid: area.id,
      parentArea: area.parentArea,
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
    this.installationIdList = this.deviceList.map((device) => ({
      installationId: device.installationId,
      area: this.subAreaMap[device.subArea]?.name || device.subAreaName,
      location: this.regionMap[device.region]?.name || device.areaName,
      areaId: device.subArea,
      locationId: device.region,
      initial: this.regionMap[device.region]?.initial,
      type: device.deviceType,
      direction: device.direction,
      latitude: device.latitude,
      longitude: device.longitude,
      deviceId: device.uid,
    }));
    this.filterDroneInstallationIdList();
    this.filteredInstallationIdList = this.installationIdList;
  }

  filterDroneInstallationIdList() {
    this.installationIdList = this.installationIdList?.filter(device => device.type?.toLowerCase() === 'drone') || [];
  }

  async getSupplierList() {
    const url = "/settings/supplier";
    const res = (await this.apiService.get(url, {}).toPromise()) as any;

    if (!res) return;
    this.supplierList = res.map((supplier) => ({
      name: supplier.name,
      uid: supplier.id,
      regions: supplier.regions,
      users: supplier.supplierUsers,
      activated: supplier.activated,
      supportEmail: supplier.supportEmail,
      expiry: supplier.expiry,
      renameEmail: false,
    }));
    const currentUserSupplier = this.supplierList.find((supplier) =>
      supplier.users?.find((user) => user.user == this.user)
    );
    this.company = currentUserSupplier?.name || "";
    this.companyId = currentUserSupplier?.uid || "";
    if (currentUserSupplier) {
      this.supplierRegions = [];
      currentUserSupplier.regions.forEach(region => this.supplierRegions.push(this.regionMap[region].initial));
    }
  }
  onRemoveSrt(event) {
    if(this.publishStep) return 
    const index = this.srtFiles.indexOf(event);
    this.srtFiles.splice(index, 1);
    this.srtDates.splice(index, 1);
  }

  checkDroneUploader(){
    let userGroups = JSON.parse(localStorage.getItem("user"))["groups"]
    let result:boolean=false;
    if (userGroups.indexOf("drone_uploader") == -1) {
      result = false
    }else{
      result = true
    }
    return result
  }

  async uploadFileChunk(index, uploadUrl, chunkedBlob, chunkIndex, chunkCount, fileSize, fileName, fileType, retryCount = 1) {
    const blob = new Nuxeo.Blob({ content: chunkedBlob });
    const headers = {
      "Cache-Control": "no-cache",
      "X-Upload-Chunk-Index": chunkIndex,
      "X-Upload-Chunk-Count": chunkCount,
      "X-File-Name": fileName,
      "X-File-Size": fileSize,
      "X-File-Type": fileType,
      "X-Upload-Type": "chunked",
      "Content-Length": blob.size,
      "X-Authentication-Token": localStorage.getItem("token"),
    }

    const options = {
      reportProgress: true,
      observe: "events",
      headers,
      method: 'POST',
      body: blob.content
    };
    const apiUrl = apiVersion1 + uploadUrl;
    await this.uploadChunks(index, chunkIndex, chunkCount, apiUrl, options);
  }

  async uploadChunks(index, chunkIndex, chunkCount, apiUrl: string, options: any) {
    try {
      const res = await fetch(apiUrl, options);
      if (res.status === 201) {
        // retryCount = 1;
        this.setUploadProgressBar(index, 100);
        $('.upload-file-preview.errorNewUi').css('background-image', 'linear-gradient(to right, #FDEDED 100%,#FDEDED 100%)');
        console.log("Upload done");
      } else if (res.status === 202) {
        // retryCount = 1;
        const percentDone = Math.round((100 * (chunkIndex + 1)) / chunkCount);
        console.log(`File is ${percentDone}% loaded.`,100 * (chunkIndex + 1),chunkCount);
        this.setUploadProgressBar(index, percentDone);
      }  else {
        // retry upload failed chunk
        // if (retryCount < 11)
          // console.log('retry count = ', retryCount, ", chunkCount = ", chunkCount);
          this.chunksFailedToUpload[chunkIndex] = {chunkIndex, chunkCount, options, apiUrl};
      }
    } catch (err) {
      // retry upload failed chunk
      // if (retryCount < 11) {
        // console.log('retry count = ', retryCount, ", chunkCount = ", chunkCount);
          this.chunksFailedToUpload[chunkIndex] = {chunkIndex, chunkCount, options, apiUrl};
      // }
    }
  }
  async checkUploadedFileStatusAndUploadFailedChunks(uploadUrl: string) {
    const fileStatus: any = await this.apiService.get(uploadUrl).toPromise();
    console.log({fileStatus});
    if(Object.keys(this.chunksFailedToUpload).length) {
      let promiseArray = [];
      for(const key in this.chunksFailedToUpload) {
        if(key.indexOf(fileStatus.uploadedChunkIds) != -1) {
          continue;
        }
        promiseArray.push(this.uploadChunks(key, this.chunksFailedToUpload[key].chunkIndex, this.chunksFailedToUpload[key].chunkCount, this.chunksFailedToUpload[key].apiUrl, this.chunksFailedToUpload[key].options));
      }
      await Promise.all(promiseArray.map(p => p.catch(e => e)));
    }
    return fileStatus;
  }

  copyHeroName() {
    let files = this.failedFiles.map(file=>file.name);
    this.clipboard.copy(files.toString());
    this.sharedService.showSnackbar(`Copied`, 4000, 'top', 'center', 'snackBarMiddle');
  }
}
