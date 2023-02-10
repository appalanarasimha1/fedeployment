import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Inject,
} from "@angular/core";
import { ApiService } from "../../services/api.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { adminPanelWorkspacePath } from "src/app/common/constant";

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
  filteredSubAreaList = [];
  loading = false;
  directionShow: boolean = true;
  poleIdShow: boolean = true;
  installationID;
  regionList = [];
  subAreaList = [];
  selectedType = "timelapse";
  latitude: number;
  longitude: number;
  direction: string;
  poleId = "";
  selectedRegion: string;
  selectedSubArea: string;
  isCreate = true;
  selectedDevice = null;

  constructor(
    public dialogRef: MatDialogRef<CreateDeviceModalComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.installationID = this.data.deviceInput;
    this.regionList = this.data.regionList;
    this.subAreaList = this.data.subAreaList;
    this.isCreate = this.data.isCreate;
    this.selectedDevice = this.data.selectedDevice;
    if (!this.isCreate) {
      this.installationID = this.selectedDevice.name;
      this.selectedRegion = this.selectedDevice.region;
      if (this.selectedDevice.region)
        this.selectedRegions = this.regionList.find(
          (region) => region.uid === this.selectedDevice.region
        );
      this.onSelectRegion(this.selectedRegions);
      this.selectedSubArea = this.selectedDevice.subArea;
      this.onSelectdeviceType(null, this.selectedDevice.deviceType);
      this.latitude = this.selectedDevice.latitude;
      this.longitude = this.selectedDevice.longitude;
      this.direction = this.selectedDevice.direction;
      this.poleId = this.selectedDevice.cameraPole;
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
  }

  onSelectRegion(event) {
    this.selectedRegion = event.uid;
    this.filteredSubAreaList = this.subAreaList.filter((subArea) =>
      subArea.parentArea = this.selectedRegion
    );
  }

  checkEnableCreateDeviceButton() {
    if (!this.installationID) return false;
    if (isNaN(this.latitude) || isNaN(this.longitude) ||!this.selectedSubArea || !this.selectedRegions) return false;
    if (this.directionShow) {
      if (
        !this.direction ||
        this.direction.length !== 3 ||
        isNaN(parseFloat(this.direction))
      )
        return false;
    }
    return true;
  }

  async createDevice() {
    if (!this.isCreate) {
      this.updateDevice();
      return;
    }

    const payload = {
      installationId: this.installationID,
      deviceType: this.selectedType,
      latitude: this.latitude || "",
      longitude: this.longitude || "",
      direction: this.directionShow ? this.direction : "",
      cameraPole: this.poleIdShow ? this.poleId : "",
      region: this.selectedRegion || "",
      subArea: this.selectedSubArea || "",
      status: "online",
    }
    await this.apiService.post('/settings/camera', payload, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }

  async updateDevice() {
    this.loading = true;
    const params = {
      installationId: this.installationID,
      deviceType: this.selectedType,
      latitude: this.latitude || "",
      longitude: this.longitude || "",
      direction: this.directionShow ? this.direction : "",
      cameraPole: this.poleIdShow ? this.poleId : "",
      region: this.selectedRegion || "",
      subArea: this.selectedSubArea || "",
    }
    await this.apiService.post(`/settings/camera/${this.selectedDevice.uid}`, params, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }
}
