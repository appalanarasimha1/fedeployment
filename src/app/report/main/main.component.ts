import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { NuxeoService } from 'src/app/services/nuxeo.service';
import { SharedService } from 'src/app/services/shared.service';
import { TOTAL_ASSETS_LABEL } from 'src/app/common/constant';

@Component({
  selector: 'report-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class ReportMainComponent implements OnInit {
  totalAssets = 'loading';
  readonly = TOTAL_ASSETS_LABEL

  constructor(
    public nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private dataService: DataService,
    private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchTotalAssets();
  }
  
  fetchTotalAssets() {
    const headers = { };
    let url = apiRoutes.SEARCH_PP_ASSETS;
    const params = { currentPageIndex: 0, offset: 0, pageSize: 1 };
    this.totalAssets = 'loading';

    this.dataService.loaderValueChange(true);
    this.nuxeo.nuxeoClient.request(url, { queryParams: params, headers })
      .get().then((result) => {
        this.totalAssets = result.resultsCount;
        this.dataService.loaderValueChange(false);
      }).catch((error) => {
        console.log('report fetch totalasset error = ', error);
        
        this.dataService.loaderValueChange(false);
        }
      );
  }

}
