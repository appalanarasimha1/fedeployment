import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-asset-view',
  templateUrl: './asset-view.component.html',
  styleUrls: ['./asset-view.component.css']
})
export class AssetViewComponent implements OnInit {
  sector: string;
  folderStructure: string;
  assetName: string;
  file = '';
  fileUrl = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const routeParams = this.route.params.subscribe(params => {
      this.sector = params['sector'];
      this.folderStructure = params['folderStructure'].replaceAll('+', '/');
      this.assetName = params['assetName'];
      this.fetchAsset();
    });
  }

  fetchAsset() {
    this.apiService.get(`/path/${encodeURIComponent(this.sector)}/workspaces${this.folderStructure}${encodeURIComponent(this.assetName)}`).subscribe((doc: any) => {
     
      this.file = doc;
      this.fileUrl = `${window.location.origin}/nuxeo/${doc.properties['file:content'].data.split('/nuxeo/')[1]}`;
    });
  }

}
