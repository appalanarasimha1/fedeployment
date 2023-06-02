import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgxMasonryOptions } from "ngx-masonry";
import { NgxMasonryComponent } from "ngx-masonry";
import { SharedService } from "../services/shared.service";
import { ApiService } from "../services/api.service";
import { UploadDroneComponent } from "../upload-drone/upload-drone.component";
import { PreviewPopupComponent } from "../preview-popup/preview-popup.component";
import { apiRoutes } from "../common/config";
import { DRONE_UPLOADER, WARROOM_VIEW_ACCESS } from '../common/constant';
import { takeUntil } from 'rxjs/operators';
import { Subject } from "rxjs";
import { ISearchResponse } from "../common/interfaces";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-documentation-assets",
  templateUrl: "./documentation-assets.component.html",
  styleUrls: ["./documentation-assets.component.css"],
})
export class DocumentationAssetsComponent implements OnInit {
  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    public matDialog: MatDialog,
    public sharedService: SharedService,
    private apiService: ApiService
  ) {}

  public masonryOptions: NgxMasonryOptions = {
    gutter: 10,
    resize: true,
    initLayout: true,
    fitWidth: true,
  };

  public updateMasonryLayout = false;

  deviceList = [];
  regionList = [];
  regionMap = {};
  subAreaList = [];
  subAreaMap = {};
  supplierList = [];
  accessList = [];
  installationIdList = [];
  user = "";
  company = "";
  companyId = "";
  loading = false;
  assetListDocument: Partial<ISearchResponse> = {entries: []};
  assetList = [];
  masoneryItemIndex;
  viewType = "GRID";
  formats = ["Picture", "Video"];
  selectedRegion;
  selectedsubArea;
  selectedFormat;
  selectedStartDate;
  selectedEndDate;
  assetByMe = false;
  filteredSubAreaList = [];
  notAuthorize = true;
  userRegionList = [];
  userPermissionMap = {};
  supplierRegions;
  supplierUserData;

  //New
  resultCount: number = 0;
  defaultPageSize: number = 20;
  pageSizeOptions = [20, 50, 100];
  forInternalUse: any = [];
  downloadArray: any = [];
  sizeExeeded: boolean = false;
  forInternaCheck: boolean = false;
  downloadFullItem: any = [];
  needPermissionToDownload: any = [];
  downloadCount: number = 0;
  copyRightItem:any=[]
  downloadErrorShow: boolean = false;
  downloadEnable: boolean = false;
  hasSearchData: boolean = false;
  fileSelected = [];
  isAware;

  onSelectRegions(regions) {
    this.selectedsubArea = null;
    this.getAssetList();
  }
  onSelectSubArea(area) {
    this.getAssetList();
  }

  ngOnInit(): void {
    this.loading = true;
    // this.getConstructionData()
    // this.masonryImages = this.dummyPictures.slice(0);
    this.sharedService.getSidebarToggle().subscribe(() => {
      this.updateMasonryLayout = !this.updateMasonryLayout;
    });
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.groups.includes(DRONE_UPLOADER)) this.notAuthorize = false;
    if (userData?.groups.includes(WARROOM_VIEW_ACCESS)) this.notAuthorize = false;

    this.user = userData["username"];
    this.fetchGeneralData();
    this.sharedService.events$.forEach(event => {
      if (event === 'Upload done') this.getAssetList();
    });
  }

  async fetchGeneralData() {
    this.getDeviceList();
    await this.getSupplierList();
    await this.getAccessList();
  }

  async getAccessList() {
    const url = '/settings/accessList';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const list = res || [];
    const sortedAll = [
      ...list.filter(a => a.name === 'ALL'),
      ...list.filter(a => a.name !== 'ALL')
    ]
    this.accessList = sortedAll
    .map((entry) => ({
      name: entry.name,
      uid: entry.id,
      activated: entry.activated,
      users: entry.users || [],
    }));

    if (this.notAuthorize) {
      this.checkAuthorizeUser()
    }

    await this.getRegionList();
    await this.getSubAreaList();
  }

  checkAuthorizeUser() {
    for (const access of this.accessList) {
      const users = access.users;
      const found = users.find(user => user.activated && user.user === this.user);
      if (found) {
        this.notAuthorize = false;
        this.userRegionList.push(access.name);
        this.userPermissionMap[access.name] = found.permissions?.includes('download');
      }
    }

    if (!this.notAuthorize) {
      this.loading = false;
    }
  }

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
      subArea: device.subArea,
      status: device.status,
      installationId: device.installationId,
      uid: device.id,
      subAreaId: device.subAreaId,
    }));
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
    if (this.userRegionList.length > 0 && !this.userRegionList.includes('ALL')) {
      this.regionList = this.regionList.filter(region => this.userRegionList.includes(region.initial));
    }
    if (this.supplierRegions) {
      this.regionList = this.regionList.filter(region => this.supplierRegions.includes(region.uid));
    }
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
    const regionIds = this.regionList.map(region => region.uid);
    this.subAreaList = this.subAreaList.filter(subArea => regionIds.includes(subArea.parentArea));
    this.filteredSubAreaList = this.subAreaList;
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
      area: this.subAreaMap[device.subArea]?.name,
      location: this.regionMap[device.region]?.name,
      areaId: device.subArea,
      locationId: device.region,
      initial: this.regionMap[device.region]?.initial,
      type: device.deviceType,
      direction: device.direction,
      latitude: device.latitude,
      longitude: device.longitude,
      deviceId: device.uid,
    }));
  }

  async getSupplierList() {
    const url = '/settings/supplier';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    if (!res) return;
    this.supplierList = res.map(supplier => ({
      name: supplier.name,
      uid: supplier.id,
      regions: supplier.regions,
      users: supplier.supplierUsers,
      activated: supplier.activated,
      supportEmail: supplier.supportEmail,
      expiry: supplier.expiry,
      renameEmail : false,
    }));
    const currentUserSupplier = this.supplierList.find((supplier) =>
      supplier.users?.find((user) => user.user == this.user)
    );
    this.company = currentUserSupplier?.name || "";
    this.companyId = currentUserSupplier?.uid || "";
    if (currentUserSupplier) {
      this.supplierRegions = [];
      currentUserSupplier.regions.forEach(region => this.supplierRegions.push(region));
      this.supplierUserData = currentUserSupplier.users?.find((user) => user.user == this.user);
    }
    this.getAssetList();
  }

  showMore() { 
    this.getAssetList(true);
  }

  async getAssetList(loadMore = false) {
    if(!loadMore) {
      this.loading = true;
    }
    let currentPageIndex = loadMore ? this.assetListDocument.currentPageIndex + 1 : 0;
    const uploadedPath = await this.getDroneUploadPaths() || 'War Room';
    const pathQuery = this.computeQueryWsPaths(uploadedPath);
    const offset = currentPageIndex * 40;
    let url = `/search/pp/nxql_search/execute?currentPageIndex=${currentPageIndex}&offset=${offset}&pageSize=40&queryParams=SELECT * FROM Document WHERE ecm:isVersion = 0 AND ecm:isTrashed = 0` + pathQuery;
    if (this.companyId) {
      url += ` AND dc:vendor = '${this.companyId}'`;
    }
    const query = this.buildFilterAssetQuery();
    if (query === 'NONE') {
      this.assetList = [];
      this.loading = false;
      return;
    }
    url += query + " ORDER BY dc:created DESC";
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .pipe( takeUntil(this.ngUnsubscribe) )
      .toPromise();
    this.loading = false;
    if (!res) return;
    this.assetListDocument = res as unknown as ISearchResponse;
    this.assetList = loadMore ? this.assetList.concat(res["entries"]) :  res["entries"];
  }

  computeQueryWsPaths(paths) {
    const split = paths.split(',');
    if (split.length === 1) return ` AND ecm:path STARTSWITH '/${paths}'`;
    let query = ' AND (';
    for (let i = 0; i < split.length; i++) {
      const path = split[i];
      if (i === split.length - 1) query += ` ecm:path STARTSWITH '/${path}' )`;
      else query += ` ecm:path STARTSWITH '/${path}' OR`;
    }
    return query;
  }

  async getDroneUploadPaths() {
    try {
      const res = await this.apiService.post(apiRoutes.GET_DRONE_FOLDER_PATHs, {}).toPromise();
      const paths = res['value'];
      return paths;
    } catch (err) {return ""}
  }

  dateRangeChange() {
    if (this.selectedStartDate && this.selectedEndDate) this.getAssetList();
  }

  buildFilterAssetQuery() {
    let query = "";
    let filteredDevice = null;
    if (!this.selectedFormat) {
      query += " AND ecm:primaryType IN ('Picture', 'Video', 'File')";
    } else {
      query += ` AND ecm:primaryType = '${this.selectedFormat}'`;
    }
    if (this.selectedRegion) {
      filteredDevice = this.deviceList.filter(device =>
        (device.region?.includes(this.selectedRegion.uid)
        || device.areaId?.includes(this.selectedRegion.initial)
        || this.selectedRegion.initial === this.getInstallationIdRegion(device.installationId)))
      this.filteredSubAreaList = this.subAreaList.filter(subArea => (
        subArea.parentArea === this.selectedRegion.uid
      ));
    } else {
      this.filteredSubAreaList = this.subAreaList;
    }
    if (this.selectedsubArea) {
      filteredDevice = this.deviceList.filter(device =>
        (device.subArea?.includes(this.selectedsubArea.uid) || device.subAreaId?.includes(this.selectedsubArea.locationId)))
    }
    if (filteredDevice != null) {
      if (filteredDevice.length === 0) return 'NONE';
      const deviceIds = filteredDevice.map(device => device.installationId);
      const queryString = deviceIds.join("','");
      query += ` AND dc:installationId IN ('${queryString}')`;
    }
    console.log("this.selectedStartDate",this.selectedStartDate,new Date(Date.now() + 1*24*60*60*1000));
    
    if (this.selectedStartDate && this.selectedEndDate) {
      query += ` AND dc:created BETWEEN DATE '${this.formatDateString(
        this.selectedStartDate
      )}' AND DATE '${this.formatDateString(this.selectedEndDate)}'`;
    }else{
      let date = new Date()
      query += ` AND dc:created BETWEEN DATE '${this.formatDateString(
        date
      )}' AND DATE '${this.formatDateString(new Date(Date.now() + 1*24*60*60*1000))}'`;
    }
    if (this.assetByMe) {
      query += ` AND dc:creator = '${this.user}'`;
    }

    return query;
  }

  formatDateString(date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    // dialogConfig.minHeight = "350px";
    // dialogConfig.height = "100%";
    // dialogConfig.maxHeight = "92vh"
    // dialogConfig.width = "80vw";
    // dialogConfig.maxWidth = "80vw";
    dialogConfig.panelClass = "custom-modalbox";
    dialogConfig.disableClose = true;
    this.computeInstallationIdList();
    dialogConfig.data = {
      installationIdList: this.installationIdList,
      company: this.company,
      companyId: this.companyId,
    };
    const modalDialog = this.matDialog.open(UploadDroneComponent, dialogConfig);
    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.getAssetList();
      }
    });
  }

  completeLoadingMasonry(event: any) {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }
  over(index) {
    this.masoneryItemIndex = index;
  }

  out() {
    this.masoneryItemIndex = null;
  }

  selectedFileUrl = "";
  selectedFile: any;
  @ViewChild("previewModal") previewModal: PreviewPopupComponent;
  open(file, fileType?: string): void {
    let fileRenditionUrl;
    this.selectedFile = file;
    // if (!fileType) {
    switch (fileType) {
      case "Picture":
        fileType = "image";
        break;
      case "Video":
        fileType = "video";
        break;
      default:
        fileType = "file";
        break;
    }
    // }
    this.sharedService.markRecentlyViewed(file);
    if (fileType === "image") {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
      fileRenditionUrl = url; // file.properties['file:content'].data;
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if (fileType === "video") {
      fileRenditionUrl =
        file.properties["vid:transcodedVideos"][0]?.content.data || "";
    } else if (fileType === "file") {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/pdf`;
      // fileRenditionUrl = `${this.getNuxeoPdfViewerURL()}${encodeURIComponent(url)}`;
      fileRenditionUrl = file.properties["file:content"].data;
      // fileRenditionUrl = url;
    }
    this.selectedFileUrl =
      // fileType === "image" ?
      this.getAssetUrl(null, fileRenditionUrl, { ...file, update: true });
    // : fileRenditionUrl;
    // if(fileType === 'file') {
    //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
    // }

    this.previewModal.open(this.checkAssetDownloadPermission(this.selectedFile));
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if (
      document &&
      this.checkAssetMimeTypes(document) === "nopreview" &&
      this.viewType === "GRID"
    ) {
      // return '../../../assets/images/no-preview.png';
      return this.getNoPreview(document);
    }

    const mimeType = document?.properties["file:content"]?.["mime-type"];
    if (
      mimeType?.includes("pdf") &&
      this.viewType === "LIST" &&
      !document?.update
    )
      return "../../../assets/images/pdf.png";

    if (
      document &&
      this.checkAssetMimeTypes(document) === "nopreview" &&
      this.viewType === "LIST"
    ) {
      // return '../../../assets/images/no-preview-grid.svg';
      return this.getNoPreview(document);
    }
    return this.sharedService.getAssetUrl(event, url, type);
    // return this.sharedService.getAssetUrl(event, url, type);
  }
  getNoPreview(item) {
    const splitedData = item?.title?.split(".");
    const mimeType = splitedData[splitedData?.length - 1];
    const lowercaseMime = mimeType.toLowerCase();

    if (lowercaseMime == "doc" || lowercaseMime == "docx") {
      return "../../../assets/images/no-preview-big.png";
    }
    if (lowercaseMime == "ppt" || lowercaseMime == "pptx") {
      return "../../../assets/images/no-preview-big.png";
    }
    if (item.update) {
      return "../../../assets/images/no-preview-big.png";
    }

    return "../../../assets/images/no-preview-grid.svg";
  }

  checkAssetMimeTypes(document: any): string {
    return this.sharedService.checkMimeType(document);
  }

  markFavourite(data, favouriteValue) {
    // this.favourite = !this.favourite;
    if (data.contextParameters.favorites.isFavorite) {
      this.unmarkFavourite(data, favouriteValue);
      return;
    }
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    // this.loading.push(true);
    this.apiService
      .post(apiRoutes.MARK_FAVOURITE, body)
      .pipe( takeUntil(this.ngUnsubscribe) )
      .subscribe((docs: any) => {
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
        // this.loading.pop();
      });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    this.apiService
      .post(apiRoutes.UNMARK_FAVOURITE, body)
      .subscribe((docs: any) => {
        // data.contextParameters.favorites.isFavorite = this.favourite;
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
      });
  }

  checkNoFilterSelected() {
    return !(
      this.selectedEndDate ||
      this.selectedStartDate ||
      this.selectedFormat ||
      this.selectedRegion ||
      this.selectedsubArea ||
      this.assetByMe
    );
  }

  isNeomUser() {
    return !!this.user?.includes('@neom.com') || !!this.user?.match('@.*neom.com');
  }

  public ngOnDestroy(): void {
    // This aborts all HTTP requests.
    this.ngUnsubscribe.next();
    // This completes the subject properlly.
    this.ngUnsubscribe.complete();
  }

  clearSelection() {
    this.selectedStartDate = '';
    this.selectedEndDate = '';
    this.getAssetList();
  }

  checkAssetDownloadPermission(asset) {
    if (!asset) return false;
    if (this.userPermissionMap['ALL']) return true;
    if (this.supplierUserData) {
      return !!this.supplierUserData.user.permissions?.includes('download');
    }
    const installationId = asset.properties["dc:installationId"];
    if (!installationId) return false;
    const assetRegion = this.getInstallationIdRegion(installationId);
    if (!assetRegion) return false;
    return this.userPermissionMap[assetRegion] || false;
  }

  getInstallationIdRegion(installationId) {
    try {
      const split = installationId.split('-');
      return split[split.length - 2];
    } catch (e) {
      return null;
    }
  }


  paginatorEvent(event: any) {
    const offset = event.pageIndex * event.pageSize;
      // let uid = this.currentWorkspace.uid;
      const data = {
        // id: uid,
        checkCache: false,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex,
        offset
      };
      // this.fetchAssets.emit(data);
  }

  getConstructionData(){
    let url = "/latestData?pageNumber=1&pageSize=5&assetType="
    this.apiService.constructionGet(url).subscribe((res:any)=>console.log("resss",res))
  }

  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
    this.selectAsset(event, file, index);
    if (event.checked || event.target?.checked) {
      this.fileSelected.push(file);
    } else {
      if (this.fileSelected.length) {
        let i = -1;
        this.fileSelected.forEach((item, ind) => {
          if (item.uid === file.uid) {
            i = ind;
          }
        });
        if (i !== -1) {
          this.fileSelected.splice(i, 1); // remove the file from selected files
        }
      }
    }
  }
  removeAssets() {
    this.forInternalUse = [];
    this.downloadArray = [];
    this.sizeExeeded = false;
    this.forInternaCheck = false;
    this.downloadFullItem = [];
    this.needPermissionToDownload = [];
    this.downloadCount = 0;
    this.fileSelected = [];
    this.assetList.forEach((e) => (e.isSelected = false));
    // this.recentDataShow.forEach((e) => (e.isSelected = false));
    // this.favourites.forEach((e) => (e.isSelected = false));
    // this.trendingAssets.forEach((e) => (e.isSelected = false));
  }
  getUser(item) {
    return item.properties["sa:downloadApprovalUsers"];
  }


  
  multiDownload() {
    if (this.downloadArray.length>0 && this.copyRightItem.length<1 && !this.sizeExeeded && this.forInternalUse.length<1 && this.needPermissionToDownload.length < 1) {
      this.downloadAssets();
    }else{
      $(".downloadFileWorkspace").on("click", function (e) {
        // $(".dropdownCreate").toggle();
        $(".multiDownloadBlock").show();
        $(".downloadFileWorkspace").addClass("multiDownlodClick");
        e.stopPropagation();
      });
      $(".downloadFileWorkspace.multiDownlodClick").on("click", function (e) {
        $(".multiDownloadBlock").hide();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
        e.stopPropagation();
      });

      $(".multiDownloadBlock").click(function (e) {
        e.stopPropagation();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
      });

      $(document).click(function () {
        $(".multiDownloadBlock").hide();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
      });
    }
  }


  getFileContent(doc) {
    return this.sharedService.getAssetUrl(null, doc?.properties["file:content"]?.data || "");
  }
  downloadAssets(e?: any) {
    // this.uncheckAll1()
    if (!this.downloadEnable && this.forInternalUse.length > 0) {
      return;
    } else {
      let newDownloadArray = []
      let newDownloadArrayFullItem = []
      for (let i = 0; i < this.downloadFullItem.length; i++) {
        if (this.downloadFullItem[i].type === 'Video') {
          window.open(this.getFileContent(this.downloadFullItem[i]));

        } else {
          newDownloadArray.push(this.downloadFullItem[i].uid)
          newDownloadArrayFullItem.push(this.downloadFullItem[i])
        }

      }
      if (newDownloadArray.length == 1 && newDownloadArrayFullItem[0].type !== "OrderedFolder" && newDownloadArrayFullItem[0].type !== "Workspace") {
        window.location.href = this.getFileContent(newDownloadArrayFullItem[0])
        this.removeAssets()
      }
      else {
        this.sharedService.showSnackbar(
          "Your download is being prepared do not close your browser",
          0,
          "top",
          "center",
          "snackBarMiddle",
          "Close"
        );
        $(".multiDownloadBlock").hide();
        let randomString = Math.random().toString().substring(7);
        let input = "docs:" + JSON.parse(JSON.stringify(newDownloadArray));
        let uid: any;
        this.downloadAsZip(input, uid, randomString)
      }
    }
  }

  async downloadAsZip(input, uid, randomString: string) {
    new Promise((resolve, reject) => {
      this.removeAssets();
      this.apiService.downloaPost("/automation/Blob.BulkDownload/@async", {
        params: {
          filename: `selection-${randomString}.zip`,
        },
        context: {},
        input,
      })
        .subscribe((res: any) => {
          let splittedLocation = res.headers.get("location").split("/");
          let newUID = splittedLocation[splittedLocation.length - 2];
          uid = newUID;
          let checkZipCompleted = (newUID) => {
            // this.loading = true
            this.apiService
              .downloadGet("/automation/Blob.BulkDownload/@async/" + newUID + "/status")
              .toPromise().then((resp: any) => {
                if (resp.status === 200) {
                  setTimeout(() => {
                    checkZipCompleted(newUID)
                  }, 1000);

                } else {
                  // this.loading = false
                  window.open(
                    environment.apiServiceBaseUrl +
                    "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
                    uid
                  );
                  this.removeAssets();
                }
              }).catch(e => {
                this.removeAssets();
              });

          }
          checkZipCompleted(uid)
        });
    })
  }


  downloadClick() {
    if (!this.downloadEnable) {
      this.downloadErrorShow = true;
    }
  }
  onCheckboxChange(e: any) {
    if (e.target.checked) {
      this.downloadErrorShow = false;
      this.downloadEnable = true;
    } else {
      this.downloadEnable = false;
    }
  }
  selectAsset($event, item, i) {
    console.log("itemitemitemitemitem", item, $event);
    // if (!$event.target?.checked || !$event.checked) {
    //   console.log("inside unchecked");
    //   this.forInternalUse = this.forInternalUse.filter((m) => m !== item.uid);
    //   this.downloadArray = this.downloadArray.filter((m) => m !== item.uid);
    //   this.downloadFullItem = this.downloadFullItem.filter(
    //     (m) => m.uid !== item.uid
    //   );
    //   this.needPermissionToDownload = this.needPermissionToDownload.filter(
    //     (m) => m.uid !== item.uid
    //   );
    //   this.downloadCount = this.downloadCount - 1;
    // }
    // else
    if ($event.target?.checked || $event.checked) {
      this.downloadCount = this.downloadCount + 1;
    if (
      item.properties['sa:copyrightName'] !== null &&
      item.properties['sa:copyrightName'] !== ""
    ) {
      this.copyRightItem.push(item.uid);
    }
      if (item.properties["sa:downloadApprovalUsers"].length > 0) {
        this.needPermissionToDownload.push(item);
      } else {
        if (item.properties["sa:access"] === "Internal access only") {
          this.forInternalUse.push(item.uid);
        }
        this.downloadArray.push(item.uid);
        this.downloadFullItem.push(item);
      }
    } else {
      //  if (!$event.target?.checked || !$event.checked) {
      console.log("inside unchecked");
      this.forInternalUse = this.forInternalUse.filter((m) => m !== item.uid);
      this.downloadArray = this.downloadArray.filter((m) => m !== item.uid);
      this.copyRightItem = this.copyRightItem.filter((m) => m !== item.uid);
      this.downloadFullItem = this.downloadFullItem.filter(
        (m) => m.uid !== item.uid
      );
      this.needPermissionToDownload = this.needPermissionToDownload.filter(
        (m) => m.uid !== item.uid
      );
      this.downloadCount = this.downloadCount - 1;
      //  }
    }
    this.getdownloadAssetsSize();
  }
  getdownloadAssetsSize() {
    let size = 0;
    if (this.downloadArray.length > 0) {
      this.downloadFullItem.forEach((doc) => {
        size = size + parseInt(doc.properties["file:content"]?.length);
      });
      let sizeInGB = size / 1024 / 1024 / 1024;

      if (sizeInGB > 1) {
        this.sizeExeeded = true;
      } else {
        this.sizeExeeded = false;
      }
    } else {
      this.sizeExeeded = false;
    }
  }


}
