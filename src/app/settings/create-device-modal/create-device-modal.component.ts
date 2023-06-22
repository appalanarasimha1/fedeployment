import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Inject,
} from "@angular/core";
import { ApiService } from "../../services/api.service";
import { SharedService } from "src/app/services/shared.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import * as moment from "moment";

const typePrefix = {
  "timelapse": "T",
  "drone": "D",
  "360": "O",
  "live": "L",
  "underwater": "U",
  "weather": "W",
}
@Component({
  selector: "app-create-device-modal",
  templateUrl: "./create-device-modal.component.html",
  styleUrls: ["./create-device-modal.component.css"],
})
export class CreateDeviceModalComponent implements OnInit {
  selectedRegions: any;
  selectedsubAreas: any;
  regions = [
    { id: 1, name: "Region 1" },
    { id: 2, name: "Region 2" },
    { id: 3, name: "Region 3" },
    { id: 4, name: "Region 4" },
    { id: 5, name: "Region 5" },
  ];
  subAreas = [
    { id: 1, name: "Sub-area 1" },
    { id: 2, name: "Sub-area 2" },
    { id: 3, name: "Sub-area 3" },
    { id: 4, name: "Sub-area 4" },
    { id: 5, name: "Sub-area 5" },
  ];
  owners = [];
  supplierPrefix = ["TLP", "TME", "URE"];
  filteredSubAreaList = [];
  loading = false;
  directionShow: boolean = true;
  poleIdShow: boolean = true;
  installationID;
  regionList = [];
  subAreaList = [];
  supplierList = [];
  selectedType = "timelapse";
  latitude: number;
  longitude: number;
  direction: string;
  poleId = "";
  selectedRegion: string;
  selectedRegionInitial: string;
  selectedSubArea: string;
  isCreate = true;
  selectedDevice = null;
  selectedSupplier = null;
  selectedOwner;
  channelId;

  constructor(
    public dialogRef: MatDialogRef<CreateDeviceModalComponent>,
    private apiService: ApiService,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // this.installationID = this.data.deviceInput;
    this.regionList = this.data.regionList;
    this.owners = this.data.owners;
    console.log("data",this.data);
    
    this.subAreaList = this.data.subAreaList;
    this.isCreate = this.data.isCreate;
    this.selectedDevice = this.data.selectedDevice;
    this.supplierPrefix = this.data.supplierIds;
    this.supplierList = this.data.supplierList;
    if (!this.isCreate) {
      this.installationID = this.selectedDevice.installationId;
      this.selectedSupplier = this.selectedDevice.supplierId;
      this.selectedRegion = this.selectedDevice.region || this.selectedDevice.areaId;
      if (this.selectedDevice.deviceType === 'timelapse') {
        this.selectedSupplier = this.installationID.split("-")[1];
      }
      if (this.selectedRegion)
        this.selectedRegions = this.regionList.find(
          (region) => region.uid === this.selectedRegion || region.initial === this.selectedRegion
        );
      if (this.selectedRegions) this.onSelectRegion(this.selectedRegions);
      if (this.selectedDevice.subArea) {
        this.selectedsubAreas = this.subAreaList.find(
          (subArea) => subArea.name === this.selectedDevice.subArea
        );
      }
      this.selectedSubArea = this.selectedDevice.subArea;
      this.onSelectdeviceType(null, this.selectedDevice.deviceType);
      this.latitude = this.selectedDevice.latitude;
      this.longitude = this.selectedDevice.longitude;
      this.direction = this.selectedDevice.direction;
      this.poleId = this.selectedDevice.cameraPole;
      this.selectedOwner = this.selectedDevice.owner;
    }
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

  onSelectdeviceType(event, getName) {
    this.selectedType = getName;
    if (getName == "timelapse") {
      this.directionShow = true;
      this.poleIdShow = true;
    }
    if (getName == "360") {
      this.directionShow = false;
      this.poleIdShow = true;
    }
    if (getName == "live") {
      this.directionShow = true;
    }
    if (getName == "drone") {
      this.poleIdShow = false;
      this.directionShow = false;
    }
    // this.generateDeviceId();
  }

  onSelectRegion(event) {
    this.selectedRegion = event.uid;
    this.selectedRegionInitial = event.initial;
    this.filteredSubAreaList = this.subAreaList.filter((subArea) =>
      subArea.parentArea = this.selectedRegion
    );
    // this.generateDeviceId();
  }

  onSelectSubArea(event) {
    this.selectedSubArea = event.uid;
  }

  onSelectedSupplier(event) {
    // this.generateDeviceId();
  }

  checkEnableCreateDeviceButton() {
    // if (!this.installationID) return false;
    if (isNaN(this.latitude) || isNaN(this.longitude) ||!this.selectedSubArea || !this.selectedRegions) return false;
    if (this.directionShow) {
      if (
        !this.direction ||
        this.direction.length !== 3 ||
        isNaN(parseFloat(this.direction))
      )
        return false;
    }
    if (!this.selectedRegion) return false;
    if (!this.selectedSubArea) return false;
    return true;
  }

  async createDevice() {
    if (!this.isCreate) {
      this.updateDevice();
      return;
    }

    const payload = {
      deviceType: this.selectedType,
      latitude: [this.latitude] || [],
      longitude: [this.longitude] || [],
      cameraDirection: this.directionShow ? this.direction : "",
      cameraPole: this.poleIdShow ? this.poleId : "",
      region: this.selectedRegion || "",
      subArea: this.selectedSubArea || "",
      status: "online",

      areaId: this.selectedRegions.initial || "",
      areaName: this.selectedRegions.name || "",
      subAreaId: this.selectedsubAreas.locationId || "",
      subAreaName: this.selectedsubAreas.name || "",
      owner: this.selectedOwner || "",
      supplierId: this.selectedSupplier,
      channelId:this.channelId,
      
      installationDate: moment().toISOString(true).split('T')[0].slice(0, 10).replace(/-/g, ""),
      installationTime: moment().format('HH:mm:ss').slice(0, 10).replace(/:/g, ""),
    }
    const id = await this.apiService.post(`/settings/camera/autogen?prefix=${this.buildDevicePrefix()}`, payload, {responseType: 'text'}).toPromise();
    this.sharedService.showSnackbar(
      `${id} created`,
      4000,
      "top",
      "center",
      "snackBarMiddle"
    );
    navigator.clipboard.writeText(`${id}`);
    this.closeModal(id);
  }

  buildDevicePrefix() {
    const type = this.selectedType ? typePrefix[this.selectedType] : "";
    const supplier = this.selectedType === 'timelapse' ? this.selectedSupplier : "";
    if (supplier) {
      return `${type}-${supplier}-${this.selectedRegionInitial}`;
    }
    return `${type}-${this.selectedRegionInitial}`;
  }

  // async generateDeviceId() {
  //   if (this.selectedType && this.selectedRegion) {
  //     const prefix = this.buildDevicePrefix();
  //     const lastId = await this.getLastDeviceId(prefix) as any;
  //     if (!lastId || lastId === 'null') {
  //       this.installationID = `${prefix}-0001`;
  //       return;
  //     }
  //     const latestNumber = lastId.split("-").pop();
  //     if (isNaN(latestNumber)) {
  //       this.installationID = `${prefix}-0001`;
  //       return;
  //     }
  //     const nextNumber = parseInt(latestNumber) + 1;
  //     this.installationID = `${prefix}-${("000" + nextNumber).slice(-4)}`
  //   }
  // }

  // getLastDeviceId(prefix) {
  //   return this.apiService.get(`/settings/camera/getLatestDeviceId?prefix=${prefix}`, {responseType: 'text'}).toPromise();
  // }

  async updateDevice() {
    this.loading = true;
    const params = {
      latitude: [this.latitude] || [],
      longitude: [this.longitude] || [],
      cameraDirection: this.directionShow ? this.direction : "",
      cameraPole: this.poleIdShow ? this.poleId : "",
      owner: this.selectedOwner || "",
      supplierId: this.selectedSupplier,
    }
    await this.apiService.post(`/settings/camera/${this.selectedDevice.uid}`, params, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
  
}
