import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NgxMasonryOptions } from "ngx-masonry";
import { NgxMasonryComponent } from "ngx-masonry";
import { SharedService } from "../services/shared.service";
import { ApiService } from "../services/api.service";
import { UploadDroneComponent } from "../upload-drone/upload-drone.component";
import { PreviewPopupComponent } from "../preview-popup/preview-popup.component";
import { apiRoutes } from "../common/config";

@Component({
  selector: "app-documentation-assets",
  templateUrl: "./documentation-assets.component.html",
  styleUrls: ["./documentation-assets.component.css"],
})
export class DocumentationAssetsComponent implements OnInit {
  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;

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
  installationIdList = [];
  user = "";
  company = "";
  companyId = "";
  loading = false;
  assetList = [];
  masoneryItemIndex;
  viewType = "GRID";
  formats = ['Picture', 'Video'];
  selectedRegion;
  selectedsubArea;
  selectedFormat;
  selectedStartDate;
  selectedEndDate;
  assetByMe = false;


  onSelectRegions(regions) {
    this.getAssetList();
  }
  onSelectSubArea(area) {
    this.getAssetList();
  }


  ngOnInit(): void {
    this.loading = true;
    // this.masonryImages = this.dummyPictures.slice(0);
    this.sharedService.getSidebarToggle().subscribe(() => {
      this.updateMasonryLayout = !this.updateMasonryLayout;
    });
    this.user = JSON.parse(localStorage.getItem("user"))["username"];
    this.getDeviceList();
    this.getSupplierList();
    this.getRegionList();
    this.getSubAreaList();
  }

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
    this.getAssetList();
  }

  async getAssetList () {
    this.loading = true;
    let url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:isVersion = 0 AND ecm:isTrashed = 0 AND dc:vendor = '${this.companyId}'`;
    url += this.buildFilterAssetQuery();
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();
    this.loading = false;
    if (!res) return;
    this.assetList = res['entries'];
  }

  dateRangeChange() {
    if (this.selectedStartDate && this.selectedEndDate) this.getAssetList();
  }

  buildFilterAssetQuery() {
    let query = '';
    if (!this.selectedFormat) {
      query += " AND ecm:primaryType IN ('Picture', 'Video')";
    } else {
      query += ` AND ecm:primaryType = '${this.selectedFormat}'`;
    }
    if (this.selectedRegion) {
      query += ` AND drone_asset:region = '${this.selectedRegion}'`;
    }
    if (this.selectedsubArea) {
      query += ` AND drone_asset:area = '${this.selectedsubArea}'`;
    }
    if (this.selectedStartDate && this.selectedEndDate) {
      query += ` AND dc:created BETWEEN DATE '${this.formatDateString(this.selectedStartDate)}' AND DATE '${this.formatDateString(this.selectedEndDate)}'`;
    }
    if (this.assetByMe) {
      query += ` AND dc:creator = '${this.user}'`;
    }

    return query;
  }

  formatDateString(date) {
    return date.toISOString().split('T')[0];
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
    }
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
      this.getAssetUrl(null, fileRenditionUrl, {...file, update:true })
        // : fileRenditionUrl;
    // if(fileType === 'file') {
    //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
    // }

    this.previewModal.open();
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if(document && this.checkAssetMimeTypes(document) === 'nopreview' && this.viewType ==="GRID") {
      // return '../../../assets/images/no-preview.png';
      return this.getNoPreview(document);
    }

    const mimeType = document?.properties['file:content']?.['mime-type'];
    if(mimeType?.includes('pdf') && this.viewType ==="LIST" && !document?.update)
      return '../../../assets/images/pdf.png';

    if(document && this.checkAssetMimeTypes(document) === 'nopreview' && this.viewType ==="LIST") {
      // return '../../../assets/images/no-preview-grid.svg';
      return this.getNoPreview(document);
    }
   return this.sharedService.getAssetUrl(event, url, type);
    // return this.sharedService.getAssetUrl(event, url, type);
  }
  getNoPreview(item) {
    const splitedData = item?.title?.split('.');
    const mimeType = splitedData[splitedData?.length - 1];
    const lowercaseMime = mimeType.toLowerCase();

    if(lowercaseMime == 'doc' || lowercaseMime == 'docx'){
      return '../../../assets/images/no-preview-big.png';
    }
    if(lowercaseMime == 'ppt' || lowercaseMime == 'pptx'){
      return '../../../assets/images/no-preview-big.png';
    }
    if(item.update) {
      return '../../../assets/images/no-preview-big.png';
    }

    return '../../../assets/images/no-preview-grid.svg';
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
}
