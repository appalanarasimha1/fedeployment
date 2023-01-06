import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { NuxeoService } from "src/app/services/nuxeo.service";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { adminPanelWorkspacePath } from "src/app/common/constant";

@Component({
  selector: 'app-create-device-modal',
  templateUrl: './create-device-modal.component.html',
  styleUrls: ['./create-device-modal.component.css']
})
export class CreateDeviceModalComponent implements OnInit {

  selectedRegions: any;
  selectedsubAreas: any;
  regions = [
    {id: 1, name: 'Region 1'},
    {id: 2, name: 'Region 2'},
    {id: 3, name: 'Region 3'},
    {id: 4, name: 'Region 4'},
    {id: 5, name: 'Region 5'}
  ];
  subAreas = [
    {id: 1, name: 'Sub-area 1'},
    {id: 2, name: 'Sub-area 2'},
    {id: 3, name: 'Sub-area 3'},
    {id: 4, name: 'Sub-area 4'},
    {id: 5, name: 'Sub-area 5'}
  ];
  filteredSubAreaList = [];
  loading=false;
  directionShow:boolean=true;
  poleIdShow:boolean=true;
  installationID;
  regionList = [];
  subAreaList = [];
  selectedType = 'timelapse';
  latitude: number;
  longitude: number;
  direction: string;
  poleId = "";
  selectedRegion:string;
  selectedSubArea:string;


  constructor(
    public dialogRef: MatDialogRef<CreateDeviceModalComponent>,
    private nuxeo: NuxeoService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.installationID = this.data.deviceInput;
    this.regionList = this.data.regionList;
    this.subAreaList = this.data.subAreaList;
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

  onSelectdeviceType(event, getName) {
    this.selectedType = getName;
    if(getName == 'timelapse') {
      this.directionShow = true;
      this.poleIdShow = true;
    }
    if(getName == '360') {
      this.directionShow = false;
      this.poleIdShow = true;
    }
    if(getName == 'live') {
      this.directionShow = true;
    }
    if(getName == 'drone') {
      this.poleIdShow = false;
      this.directionShow = false;
    }
  }

  onSelectRegion(event) {
    this.selectedRegion = event.uid;
    const locations = event.locations || [];
    this.filteredSubAreaList = this.subAreaList.filter(subArea => locations.includes(subArea.uid));
  }

  checkEnableCreateDeviceButton() {
    if (!this.installationID) return false;
    if (isNaN(this.latitude) || isNaN(this.longitude)) return false;
    if (this.directionShow) {
      if (!this.direction || this.direction.length !== 3 || isNaN(parseFloat(this.direction))) return false;
    }
    return true;
  }

  async createDevice() {
    this.loading = true;
    const result = await this.nuxeo.nuxeoClient.operation('Document.Create')
    .params({
      type: "Device",
      name: this.installationID,
      properties: {
        "device:deviceTyp": this.selectedType,
        "device:latitude": this.latitude || "",
        "device:longitude": this.longitude || "",
        "device:direction": this.directionShow ? this.direction : "",
        "device:poleId": this.poleIdShow ? this.poleId : "",
        "device:region": this.selectedRegion || "",
        "device:subArea": this.selectedSubArea || "",
        "device:status": 'online',
      }
    })
    .input(adminPanelWorkspacePath + '/DeviceFolder')
    .execute();
    this.closeModal(result);
  }

}
