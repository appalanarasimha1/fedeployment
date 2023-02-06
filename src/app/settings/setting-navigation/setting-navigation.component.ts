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
    const url = '/settings/supplier/count';
    const res = await this.apiService.get(url, { headers: {} }).toPromise() as any;

    if (!res) return;
    this.supplierCount = res || 0;
  }

  async getRegionList() {
    const url = '/settings/area/count';
    const res = await this.apiService.get(url, { headers: {} }).toPromise() as any;

    if (!res) return;
    this.regionCount = res || 0;
  }

  async getDeviceList() {
    const url = '/settings/camera/count';
    const res = await this.apiService.get(url, { headers: {} }).toPromise() as any;

    if (!res) return;
    this.deviceCount = res || 0;
  }
}
