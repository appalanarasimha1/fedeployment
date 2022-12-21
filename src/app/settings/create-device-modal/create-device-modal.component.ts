import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  direction:boolean=true;
  poleId:boolean=true;
  installationID;

  constructor(
    public dialogRef: MatDialogRef<CreateDeviceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

  onSelectdeviceType(event, getName) {
    if(getName == 'timelapse') {
      this.direction = true;
      this.poleId = true;
    }
    if(getName == '360') {
      this.direction = false;
      this.poleId = true;
    }
    if(getName == 'live') {
      this.direction = true;
    }
    if(getName == 'drone') {
      this.poleId = false;
      this.direction = false;
    }
  }

}
