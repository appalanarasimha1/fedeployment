import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../services/api.service";

@Component({
  selector: "app-setting-navigation",
  templateUrl: "./setting-navigation.component.html",
  styleUrls: ["./setting-navigation.component.css"],
})
export class SettingNavigationComponent implements OnInit {
  supplierCount = 0;
  regionCount = 0;
  deviceCount = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getSupplierList();
    this.getRegionList();
    this.getDeviceList();
  }

  async getSupplierList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Supplier' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService.get(url, { headers: {} }).toPromise();

    if (!res) return;
    this.supplierCount = res["resultsCount"];
  }

  async getRegionList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Region' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService.get(url, { headers: {} }).toPromise();

    if (!res) return;
    this.regionCount = res["resultsCount"];
  }

  async getDeviceList() {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=1&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Device' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService.get(url, { headers: {} }).toPromise();

    if (!res) return;
    this.deviceCount = res["resultsCount"];
  }
}
