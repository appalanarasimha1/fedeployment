import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-asset-view',
  templateUrl: './asset-view.component.html',
  styleUrls: ['./asset-view.component.css']
})
export class AssetViewComponent implements OnInit {
  file = '';
  fileUrl = '';
  loading = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const routeParams = this.route.queryParams.subscribe(params => {
      const assetId = params['assetId'];
      this.fetchAsset(assetId);
    });
  }

  async fetchAsset(assetId: string): Promise<void> {
    this.loading = true;
    try {
      const doc: any = await this.apiService.get(`/id/${assetId}?fetch-acls=username`,
        {headers: { "fetch-document": "properties"}}).toPromise();
      this.file = doc;
      this.fileUrl = `${window.location.origin}/nuxeo/${doc.properties['file:content'].data.split('nuxeo/')[1]}`;
      this.loading = false;
    } catch (error) {
      this.router.navigate(['/asset-not-accessed'])
    }
  }

}
