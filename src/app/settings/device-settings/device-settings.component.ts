import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NuxeoService } from "src/app/services/nuxeo.service";
import { SharedService } from "src/app/services/shared.service";
import { adminPanelWorkspacePath } from "src/app/common/constant";
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
    private nuxeo: NuxeoService,
    private apiService: ApiService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getOrCreateSupplierFolder();
    this.getDeviceList();
    this.getRegionList();
    this.getSubAreaList();
  }
  async openCreateDeviceModal(create=true, selectedDevice?) {
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

  async getOrCreateSupplierFolder() {
    if (!this.nuxeo || !this.nuxeo.nuxeoClient) return;
    try {
      const folder = await this.nuxeo.nuxeoClient
        .repository()
        .fetch(adminPanelWorkspacePath + "/DeviceFolder");
      if (!folder)
        return this.createFolder(
          "Folder",
          "DeviceFolder",
          adminPanelWorkspacePath
        );
    } catch (err) {
      this.createFolder("Folder", "DeviceFolder", adminPanelWorkspacePath);
    }
  }

  createFolder(type, name, path) {
    return this.nuxeo.nuxeoClient
      .operation("Document.Create")
      .params({
        type,
        name,
      })
      .input(path)
      .execute();
  }

  async getDeviceList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Device' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();

    if (!res) return;
    const devices = res["entries"];
    console.log('res["entries"]', res["entries"]);
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
    this.filteredDeviceList = this.deviceList;
    this.deviceInput = "";
    this.selectedRegions = null;
    this.selectedStatus = null;
    this.selecteddeviceTypes = null;
    this.selectedsubAreas = null;
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

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  formatDirection(direction) {
    return direction ? direction + "°" : "";
  }

  async changeStatus(device, status) {
    console.log('status change', status)
    if (device.status === status) return;
    await this.updateDocument(device.uid, {
      properties: { "device:status": status },
    });
    this.getDeviceList();
  }

  updateDocument(id, params) {
    return this.nuxeo.nuxeoClient
      .operation("Document.Update")
      .params(params)
      .input(id)
      .execute();
  }

  deleteDocument(id) {
    return this.nuxeo.nuxeoClient
      .operation("Document.Delete")
      .params({})
      .input(id)
      .execute();
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
          device.name.toLowerCase().includes(this.deviceInput.toLowerCase());
      if (this.selectedRegions)
        match = match && device.region.includes(this.selectedRegions.uid);
      if (this.selectedsubAreas)
        match = match && device.subArea.includes(this.selectedsubAreas.uid);
      if (this.selecteddeviceTypes)
        match =
          match &&
          device.deviceTyp
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
