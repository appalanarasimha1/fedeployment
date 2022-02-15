import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { NuxeoService } from 'src/app/services/nuxeo.service';
import { SharedService } from 'src/app/services/shared.service';
import { TOTAL_ASSETS_LABEL } from 'src/app/common/constant';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'report-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class ReportMainComponent implements OnInit {
  totalAssets: any = 'loading';
  totalUsers = 'loading';
  reportData;
  totalDownloads: any = 'loading';
  searchTermsAndCount;
  readonly TOTAL_ASSETS_LABEL = TOTAL_ASSETS_LABEL;
  loading = false;
  public usersByCountSearchLabels: Label[] = [
    'Mudit',
    'Ankur',
    'Administrator',
    'Divjot',
    'Sheriff',
  ];
  public usersByCountSearchLegend = false;
  public usersByCountSearchData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Picture', stack: 'a' },
    { data: [28, 0, 40, 19, 86, 27, 90], label: 'Video', stack: 'a' },
    { data: [28, 0, 40, 19, 86, 27, 90], label: 'File', stack: 'a' },
  ];
  
  public usersByCountDownloadLabels: Label[] = [
    'Mudit',
    'Ankur',
    'Administrator',
    'Divjot',
    'Sheriff',
  ];
  public usersByCountDownloadLegend = false;
  public usersByCountDownloadData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Picture', stack: 'a' },
    { data: [28, 0, 40, 19, 86, 27, 90], label: 'Video', stack: 'a' },
    { data: [28, 0, 40, 19, 86, 27, 90], label: 'File', stack: 'a' },
  ];

  downloadsByFormatData = [];
  downloadsByFormatLabel = [
    'Picture',
    'Video',
    'File',
  ];
  colors: Array<any> = [ { backgroundColor: ['#01dd93', '#4ce7b3', '#99f1d3'], borderColor: 'transparent' } ];

  popularSearchTermData = [[350, 450, 100]];
  popularSearchTermLabel = [
    'car',
    'beach',
    'neom',
  ];

  assetBySectorAndFormatData = [[350, 450, 100]];
  assetBySectorAndFormatLabel = [];

  mostContributingUserData = [[
    'Mudit',
    'Ankur',
    'Administrator',
    'Divjot',
    'Sheriff']];
    mostContributingUserLabel = [];

    uploadByFormatData = [];
    uploadByFormatLabel = ['Picture', 'Video', 'File'];

  constructor(
    public nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private dataService: DataService,
    private apiService: ApiService) { }

  ngOnInit(): void {
    this.fetchTotalAssets();
    this.fetchReportFromMongo();
    this.fetchMostSearchedTags();
  }
  
  fetchTotalAssets() {
    const headers = { };
    let url = apiRoutes.SEARCH_PP_ASSETS;
    const params = { currentPageIndex: 0, offset: 0, pageSize: 1, ecm_fulltext: '', highlight: '' };
    this.totalAssets = 'loading';
    this.loading = true;

    // this.dataService.loaderValueChange(true);
    this.nuxeo.nuxeoClient.request(url, { queryParams: params, headers })
      .get().then((result) => {
        this.totalAssets = 0;
        result.aggregations.system_primaryType_agg.buckets.map(item => this.totalAssets += item.docCount);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      }).catch((error) => {
        console.log('report fetch totalasset error = ', error);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
        }
      );
  }

  fetchReportFromMongo() {
    const headers = { };
    let url = apiRoutes.REPORT_FETCH;
    this.totalUsers = 'loading';
    this.loading = true;

    // this.dataService.loaderValueChange(true);
    this.nuxeo.nuxeoClient.request(url, { headers })
      .get().then((result) => {
        this.reportData = result.resultsCount;
        this.calculateTotalDownload(result.data.downloadAssetCount);
        this.calculateTotalUpload(result.data.uploadAssetCount);
        this.totalUsers = result.data.userCount;
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      }).catch((error) => {
        console.log('report fetch totalasset error = ', error);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
        }
      );
  }

  fetchMostSearchedTags() {
    this.apiService.get('/searchTerm/fetch').subscribe((response: any) => {
      // const buckets = response?.data?.properties.buckets.filter(item => {
      //   if(item.key.trim())
      //    return item;
      // });
      // response.data.properties.buckets = buckets;
      this.searchTermsAndCount = response?.data?.properties.buckets || [];
    });
  }

  calculateTotalDownload(downloadAssetCount: {_id: string, countType: any[]}[]) {
    this.totalDownloads = 0;
    let videoCount = 0;
    let fileCount = 0;
    let pictureCount = 0;
    downloadAssetCount.map(item => {
      item.countType.map(countItem => {
        this.totalDownloads += countItem.count;
        if(countItem.type.toLowerCase() === 'video') {
          videoCount += countItem.count;
        }
        if(countItem.type.toLowerCase() === 'picture') {
          pictureCount += countItem.count;
        }
        if(countItem.type.toLowerCase() === 'file') {
          fileCount += countItem.count;
        }
      });
      // [[10, 20, 30]];
      // ['picture', 'video', 'file'];
    });
    this.downloadsByFormatData = [[pictureCount, videoCount, fileCount ]];
  }

  calculateTotalUpload(uploadAssetCount: {_id: string, countType: any[]}[]) {
    // this.totalUploads = 0;
    let videoCount = 0;
    let fileCount = 0;
    let pictureCount = 0;

    uploadAssetCount.map(item => {
      item.countType.map(countItem => {
        // this.totaluploads += countItem.count;
        if(countItem.type.toLowerCase() === 'video') {
          videoCount += countItem.count;
        }
        if(countItem.type.toLowerCase() === 'picture') {
          pictureCount += countItem.count;
        }
        if(countItem.type.toLowerCase() === 'file') {
          fileCount += countItem.count;
        }
      });
    });
    this.uploadByFormatData = [[pictureCount, videoCount, fileCount ]];
  }


}
