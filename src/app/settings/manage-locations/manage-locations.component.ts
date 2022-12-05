import { Component, OnInit, ElementRef, ViewChild, Renderer2, VERSION, Input } from '@angular/core';
import { NuxeoService } from "src/app/services/nuxeo.service";
import { apiRoutes } from "src/app/common/config";
import { adminPanelWorkspacePath } from "src/app/common/constant";
import { ApiService } from "../../services/api.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { CreateLocationModalComponent } from '../create-location-modal/create-location-modal.component';
import { CreateSubAreaModalComponent } from '../create-sub-area-modal/create-sub-area-modal.component';

@Component({
  selector: 'app-manage-locations',
  templateUrl: './manage-locations.component.html',
  styleUrls: ['./manage-locations.component.css']
})
export class ManageLocationsComponent implements OnInit {

  @Input() name: string;

  showExternalUserPage: boolean = false;
  renameUserName: boolean = false;
  regionList = [];
  subAreaList = [];
  regionInput = "";
  selectedRegion = null;
  subAreaInput = "";
  renameRegionInput = "";

  constructor(
    public matDialog: MatDialog,
    private nuxeo: NuxeoService,
    private apiService: ApiService,
  ) { }

  ngOnInit(): void {
    this.getOrCreateAdminPanelWorkspace();
    this.getRegionList();
  }

  async getOrCreateAdminPanelWorkspace() {
    if (!this.nuxeo || !this.nuxeo.nuxeoClient) return;
    try {
      const folder = await this.nuxeo.nuxeoClient.repository().fetch(adminPanelWorkspacePath);
      if (!folder) return this.createAdminPanelFolderStructure();
    } catch (err) {
      this.createAdminPanelFolderStructure();
    }
  }

  createFolder(type, name, path) {
    return this.nuxeo.nuxeoClient.operation('Document.Create')
    .params({
      type,
      name,
    })
    .input(path)
    .execute();
  }

  async createAdminPanelFolderStructure() {
    // create AdminPanelWorkspace
    await this.createFolder("MiscFolder", "AdminPanelWorkspace", "/default-domain/workspaces");
    await this.createFolder("Folder", "SupplierFolder", adminPanelWorkspacePath);
    await this.createFolder("Folder", "RegionFolder", adminPanelWorkspacePath);
    await this.createFolder("Folder", "LocationFolder", adminPanelWorkspacePath);
  }

  async getRegionList() {
    const url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Region' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (!res) return;
    const regions = res["entries"];
    this.regionList = regions.map(region => ({
      initial: region.properties["region:initial"],
      name: region.title,
      uid: region.uid,
      locations: region.properties["region:locations"]
    }));
  }

  async getSubAreaList(ids) {
    if (!ids || ids.length === 0) return [];
    const idsString = ids.map(id => `'${id}'`).join()
    const url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'SubArea' AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:uuid IN (${idsString})`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (!res) {
      this.subAreaList = [];
      return;
    }
    this.subAreaList = res['entries'].map(area => ({
      locationId: area.properties["subArea:locationId"],
      name: area.title,
      uid: area.uid,
    }))
  }

  openCreateLocationModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      regionName: this.regionInput,
    }

    const modalDialog = this.matDialog.open(CreateLocationModalComponent, dialogConfig);

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
    }

    const modalDialog = this.matDialog.open(CreateSubAreaModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        const subAreaId = result.uid;
        const currentLocations = this.selectedRegion.locations || [];
        currentLocations.push(subAreaId);
        this.selectedRegion.locations = currentLocations;
        this.updateDocument(this.selectedRegion.uid, {properties: {"region:locations": currentLocations}});
        this.getSubAreaList(currentLocations);
      }
    });
  }

  deleteDocument(id) {
    return this.nuxeo.nuxeoClient.operation('Document.Delete')
    .params({})
    .input(id)
    .execute();
  }

  updateDocument(id, params) {
    return this.nuxeo.nuxeoClient.operation('Document.Update')
    .params(params)
    .input(id)
    .execute();
  }

  async removeRegion(region) {
    await this.deleteDocument(region.uid);
    this.getRegionList();
  }

  async removeSubArea(subArea) {
    const currentLocations = this.selectedRegion.locations || [];
    const index = currentLocations.indexOf(subArea.uid);
    if (index < 0) return;
    currentLocations.splice(index, 1);
    this.selectedRegion.locations = currentLocations;
    this.updateDocument(this.selectedRegion.uid, {properties: {"region:locations": currentLocations}});
    this.getSubAreaList(currentLocations);
  }

  openSubAreaList(region) {
    this.showExternalUserPage = !this.showExternalUserPage;
    this.selectedRegion = region;
    this.renameRegionInput = this.selectedRegion.name;
    const locations = region.locations;
    this.getSubAreaList(locations);
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
    this.updateDocument(this.selectedRegion.uid, {properties: {"dc:title": this.renameRegionInput}});
  }

}
