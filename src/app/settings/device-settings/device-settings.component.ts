import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { CreateDeviceModalComponent } from '../create-device-modal/create-device-modal.component';

@Component({
  selector: 'app-device-settings',
  templateUrl: './device-settings.component.html',
  styleUrls: ['./device-settings.component.css']
})
export class DeviceSettingsComponent implements OnInit {
  supplierInput: string = '';

  constructor(
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }
  async openCreateSupplierModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const modalDialog = this.matDialog.open(CreateDeviceModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      this.matDialog.closeAll()
      if (result) {
        
      }
    });
  }
  selectedRegions: any;
  selectedsubAreas: any;
  selecteddeviceTypes: any;
  selectedStatus: any;

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
  deviceTypes = [
    {id: 1, name: 'Device type 1'},
    {id: 2, name: 'Device type 2'},
    {id: 3, name: 'Device type 3'},
    {id: 4, name: 'Device type 4'},
    {id: 5, name: 'Device type 5'}
  ];
  status = [
    {id: 1, name: 'Online'},
    {id: 2, name: 'Inactive'},
    {id: 3, name: 'Decommissioned'}
  ];

  onSelectRegions(regions) {
    console.log('regions', regions);
  }

}
