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

  constructor(
    public matDialog: MatDialog,
    private apiService: ApiService
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

  async getRegionList() {
    const url = '/settings/area';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const regions = res || [];
    this.regionList = regions.map((region) => ({
      initial: region.code,
      name: region.title,
      uid: region.id,
    }));
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
    }));
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

  async removeRegion(region) {
    await this.deleteDocument('area', region.uid);
    this.getRegionList();
  }

  async removeSubArea(subArea) {
    // const currentLocations = this.selectedRegion.locations || [];
    // const index = currentLocations.indexOf(subArea.uid);
    // if (index < 0) return;
    // currentLocations.splice(index, 1);
    // this.selectedRegion.locations = currentLocations;
    // this.updateDocument(this.selectedRegion.uid, {
    //   properties: { "region:locations": currentLocations },
    // });
    await this.deleteDocument('subarea', subArea.uid);
    this.getSubAreaList(this.selectedRegion.uid);
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
