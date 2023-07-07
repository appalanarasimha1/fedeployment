import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Renderer2,
  VERSION,
  Input,
} from "@angular/core";
import { apiRoutes } from "src/app/common/config";
import { ApiService } from "../../services/api.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { CreateLocationModalComponent } from "../create-location-modal/create-location-modal.component";
import { CreateSubAreaModalComponent } from "../create-sub-area-modal/create-sub-area-modal.component";
import { SharedService } from "src/app/services/shared.service";

@Component({
  selector: "app-manage-locations",
  templateUrl: "./manage-locations.component.html",
  styleUrls: ["./manage-locations.component.css"],
})
export class ManageLocationsComponent implements OnInit {
  @Input() name: string;

  showExternalUserPage: boolean = false;
  renameUserName: boolean = false;
  regionList = [];
  deviceList = [];
  regionsWithData = {};
  subAreasWithData = {};
  filteredRegions = [];
  subAreaList = [];
  filteredSubAreas = [];
  regionInput = "";
  selectedRegion = null;
  subAreaInput = "";
  renameRegionInput = "";

  showUserManageLocations = true;
  showUserSettingPage = false;
  showUserAccessPage = false;
  showUserManageSuppliers = false;
  loading = false;

    
  showRegionDelete = false
  regionToDelete;
  showSubAreaDelete = false
  subAreaToDelete;


  constructor(
    public matDialog: MatDialog,
    private apiService: ApiService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getRegionList();
    this.fetchManagedLocations();
  }

  fetchManagedLocations() {
    this.showUserManageLocations = true;
    this.loading = true;
    this.showUserSettingPage = false;
    this.showUserAccessPage = false;
    this.showUserManageSuppliers = false;
    this.loading = false;
  }

  async getDeviceList(from?:string) {
    const url = "/settings/camera";
    const res = (await this.apiService.get(url, {}).toPromise()) as any;
    // const res = data as any;

    if (!res) return;
    const devices = res;
    this.deviceList = devices.map((device) => ({
      deviceType: device.deviceType?.toLowerCase(),
      latitude: device.latitude,
      longitude: device.longitude,
      direction: device.cameraDirection,
      cameraPole: device.cameraPole,
      region: device.region,
      areaId: device.areaId,
      subArea: device.subAreaName,
      subAreaId: device.subAreaId,
      status: device.status?.toLowerCase(),
      installationId: device.installationId,
      isIngested: (device?.isIngested && device.isIngested) || false,
      owner: device.owner,
      uid: device.id,
      supplierId: device.supplierId,
      statusUpdateDate: device?.statusUpdateDate
    }));

    //console.log(this.deviceList);

    for(let i = 0; i < this.deviceList.length; i++) {
      let device = this.deviceList[i];
      // Check if the device is ingested and add the region and subarea to the their respective dictionaries
      if(device?.isIngested && device.isIngested) {
        this.regionsWithData[device.areaId] = true;
        this.subAreasWithData[device.subAreaId] = true;
      }
    }
   
  }

  async getRegionList() {
    await this.getDeviceList();
    // console.log(this.regionsWithData);
    // console.log(this.subAreasWithData);
    const url = '/settings/area';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const regions = res || [];
    this.regionList = regions.map((region) => ({
      initial: region.code,
      name: region.title,
      uid: region.id,
      isIngested: this?.regionsWithData[region.code] && this.regionsWithData[region.code] || false
    }));
    // console.log(this.regionList);
    this.searchRegion();
  }

  

  async getSubAreaList(areaId) {
    const url = `/settings/area/${areaId}/subareas`;
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    if (!res) {
      this.subAreaList = [];
      return;
    }
    this.subAreaList = res.map((area) => ({
      locationId: area.locationId,
      name: area.name,
      uid: area.id,
      parentArea: area.parentArea,
      isIngested: this?.subAreasWithData[area.locationId] && this.subAreasWithData[area.locationId] || false
    }));
    // console.log(this.subAreaList);
    this.filteredSubAreas = this.subAreaList;
    this.searchSubArea();
  }

  openCreateLocationModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      regionName: this.regionInput,
      currentRegions: this.regionList.map(region => region.name),
      currentInitials: this.regionList.map(region => region.initial),
    };

    const modalDialog = this.matDialog.open(
      CreateLocationModalComponent,
      dialogConfig
    );

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.getRegionList();
      }
    });
  }

  openCreateSubAreaModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      subAreaInput: this.subAreaInput,
      parentArea: this.selectedRegion.uid
    };

    const modalDialog = this.matDialog.open(
      CreateSubAreaModalComponent,
      dialogConfig
    );

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.getSubAreaList(this.selectedRegion.uid);
      }
    });
  }

  deleteDocument(type, id) {
    return this.apiService.post(`/settings/${type}/delete/${id}`, {}, {responseType: 'text'}).toPromise();
  }

  updateDocument(type, id, params) {
    return this.apiService.post(`/settings/${type}/${id}`, params, {responseType: 'text'}).toPromise();
  }

    
  onRemoveRegionCancle() {
    this.showRegionDelete = false
  }

  async onRemoveRegionConfirm() {
    this.showRegionDelete = false
    this.loading = true;
    await this.deleteDocument('area', this.regionToDelete.uid);
    this.getRegionList();
  }


  async removeRegion(region, e) {
    e.stopPropagation()
    this.showRegionDelete = !this.showRegionDelete;
    this.regionToDelete = region;
  }
  
  onRemoveSubAreaCancle() {
    this.showSubAreaDelete = false
  }

  async onRemoveSubAreaConfirm() {
    this.showSubAreaDelete = false
    this.loading = true;
    await this.deleteDocument('subarea', this.subAreaToDelete.uid);
    this.getSubAreaList(this.selectedRegion.uid);
  }


  async removeSubArea(subArea, e) {
    e.stopPropagation()
    this.showSubAreaDelete = !this.showSubAreaDelete;
    this.subAreaToDelete = subArea;
  }

  openSubAreaList(region) {
    this.showExternalUserPage = !this.showExternalUserPage;
    this.selectedRegion = region;
    this.renameRegionInput = this.selectedRegion.name;
    const areaId = region.uid;
    this.getSubAreaList(areaId);
  }
  backExternalUserList() {
    this.showExternalUserPage = false;
    this.selectedRegion = null;
    this.renameRegionInput = "";
  }

  renameUserClick(saved = false) {
    this.renameUserName = !this.renameUserName;
    if (!saved) return;
    this.selectedRegion.name = this.renameRegionInput;
    this.updateDocument('area', this.selectedRegion.uid, { "dc:title": this.renameRegionInput });
  }

  searchRegion() {
    if (!this.regionInput) {
      this.filteredRegions = this.regionList;
      return;
    };
    this.filteredRegions = this.regionList.filter(region =>
      region.name?.toLowerCase().includes(this.regionInput.toLowerCase()) ||
      region.initial?.toLowerCase().includes(this.regionInput.toLowerCase()));
  }

  searchSubArea() {
    if (!this.subAreaInput) {
      this.filteredSubAreas = this.subAreaList;
      return;
    };
    this.filteredSubAreas = this.subAreaList.filter(subArea =>
      subArea.name?.toLowerCase().includes(this.subAreaInput.toLowerCase()) ||
      subArea.initial?.toLowerCase().includes(this.subAreaInput.toLowerCase()));
  }
}
