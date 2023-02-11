import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { SharedService } from "src/app/services/shared.service";
import { ApiService } from "../../services/api.service";
import { CreateDeviceModalComponent } from "../create-device-modal/create-device-modal.component";

@Component({
  selector: "app-device-settings",
  templateUrl: "./device-settings.component.html",
  styleUrls: ["./device-settings.component.css"],
})
export class DeviceSettingsComponent implements OnInit {
  deviceInput: string = "";

  constructor(
    public matDialog: MatDialog,
    private apiService: ApiService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getDeviceList();
    this.getRegionList();
    this.getSubAreaList();
  }
  async openCreateDeviceModal(create = true, selectedDevice?) {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      deviceInput: this.deviceInput,
      regionList: this.regionList,
      subAreaList: this.subAreaList,
      isCreate: create,
      selectedDevice: selectedDevice,
    };

    const modalDialog = this.matDialog.open(
      CreateDeviceModalComponent,
      dialogConfig
    );

    modalDialog.afterClosed().subscribe((result) => {
      this.matDialog.closeAll();
      if (result) {
        this.getDeviceList();
      }
    });
  }
  selectedRegions: any;
  selectedsubAreas: any;
  selecteddeviceTypes: any;
  selectedStatus: any;
  deviceList = [];
  regionList = [];
  subAreaList = [];
  filteredDeviceList = [];
  regionMap = {};
  subAreaMap = {};

  deviceTypes = [
    { id: 1, name: "Timelapse" },
    { id: 2, name: "360" },
    { id: 3, name: "Live" },
    { id: 4, name: "Drone" },
  ];
  status = [
    { id: 1, name: "Online" },
    { id: 2, name: "Offline" },
    { id: 3, name: "Decommissioned" },
  ];

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
    }));
    this.filteredDeviceList = this.deviceList;
    this.deviceInput = "";
    this.selectedRegions = null;
    this.selectedStatus = null;
    this.selecteddeviceTypes = null;
    this.selectedsubAreas = null;
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

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  formatDirection(direction) {
    return direction ? direction + "°" : "";
  }

  async changeStatus(device, status) {
    if (device.status === status) return;
    await this.updateDocument(device.uid, { status });
    this.getDeviceList();
  }

  updateDocument(id, params) {
    return this.apiService
      .post(`/settings/camera/${id}`, params, { responseType: "text" })
      .toPromise();
  }

  deleteDocument(id) {
    return this.apiService
      .delete(`/settings/camera/${id}`, { responseType: "text" })
      .toPromise();
  }

  async deleteDevice(device) {
    await this.deleteDocument(device.uid);
    this.getDeviceList();
  }

  searchDevice(event) {
    this.filterDevice();
  }

  onSelectRegions(regions) {
    this.filterDevice();
  }

  onSelectSubArea(subArea) {
    this.filterDevice();
  }

  onSelectType(type) {
    this.filterDevice();
  }

  onSelectStatus(status) {
    this.filterDevice();
  }

  filterDevice() {
    this.filteredDeviceList = this.deviceList.filter((device) => {
      let match = true;
      if (this.deviceInput)
        match =
          match &&
          device.installationId.toLowerCase().includes(this.deviceInput.toLowerCase());
      if (this.selectedRegions)
        match = match && device.region?.includes(this.selectedRegions.uid);
      if (this.selectedsubAreas)
        match = match && device.subArea?.includes(this.selectedsubAreas.uid);
      if (this.selecteddeviceTypes)
        match =
          match &&
          device.deviceType
            .toLowerCase()
            .includes(this.selecteddeviceTypes.toLowerCase());
      if (this.selectedStatus)
        match =
          match &&
          device.status
            .toLowerCase()
            .includes(this.selectedStatus.toLowerCase());
      return match;
    });
  }
}
