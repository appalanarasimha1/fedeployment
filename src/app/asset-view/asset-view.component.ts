import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-asset-view',
  templateUrl: './asset-view.component.html',
  styleUrls: ['./asset-view.component.css']
})
export class AssetViewComponent implements OnInit {
  // sector: string;
  // folderStructure: string;
  // assetName: string;
  file = '';
  fileUrl = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const routeParams = this.route.queryParams.subscribe(params => {
      const assetId = params['assetId'];
      this.fetchAsset(assetId);
    });
  }

  async fetchAsset(assetId: string): Promise<void>{
    
    const doc: any = await this.apiService.get(`/id/${assetId}?fetch-acls=username%2Ccreator%2Cextended&depth=children`,
      {headers: { "fetch-document": "properties"}}).toPromise();
      this.file = doc;
      this.fileUrl = `${window.location.origin}/nuxeo/${doc.properties['file:content'].data.split('/nuxeo/')[1]}`;
    // this.apiService.get(`/path${this.sector.trim()}/workspaces${this.folderStructure.trim()}${encodeURIComponent(this.assetName)}`).subscribe((doc: any) => {
    //   this.file = doc;
    //   this.fileUrl = `${window.location.origin}/nuxeo/${doc.properties['file:content'].data.split('/nuxeo/')[1]}`;
    // });
  }

}
