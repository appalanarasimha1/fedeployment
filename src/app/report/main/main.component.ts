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
import { Departments ,Workspace} from './../../config/sector.config';

@Component({
  selector: "report-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class ReportMainComponent implements OnInit {
  totalAssets: any = "loading";
  totalUsers = "loading";
  sectorReport:any;
  reportData;
  totalDownloads: any = "loading";
  totalPreviews: any = "loading";
  public totalSearches: any = "loading";
  public searchTermsAndCount = [];
  public userSearchCount = [];
  public sectorCount = [];
  readonly TOTAL_ASSETS_LABEL = TOTAL_ASSETS_LABEL;
  loading = false;
  public usersByCountSearchLabels: Label[] = [
    "Mudit",
    "Ankur",
    "Administrator",
    "Divjot",
    "Sheriff",
  ];
  public usersByCountSearchLegend = false;
  public usersByCountSearchData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: "Picture", stack: "a" },
    { data: [28, 0, 40, 19, 86, 27, 90], label: "Video", stack: "a" },
    { data: [28, 0, 40, 19, 86, 27, 90], label: "File", stack: "a" },
  ];

  // public usersByCountDownloadLabels: Label[] = [];
  // public usersByCountDownloadLegend = false;
  // public usersByCountDownloadData: ChartDataSets[] = [
  //   { data: [65, 59, 80, 81, 56, 55, 40], label: 'Picture', stack: 'a' },
  //   { data: [28, 0, 40, 19, 86, 27, 90], label: 'Video', stack: 'a' },
  //   { data: [28, 0, 40, 19, 86, 27, 90], label: 'File', stack: 'a' },
  // ];
  public usersByCountDownloadData = [];
  public usersByCountUploadData = [];

  downloadsByFormatData = [];
  downloadsByFormatLabel = ["Picture", "Video", "File"];

  // popularSearchTermData = [[350, 450, 100]];
  // popularSearchTermLabel = [
  //   'car',
  //   'beach',
  //   'neom',
  // ];
  public popularSearchTermData = [];

  assetBySectorAndFormatData = [[350, 450, 100]];
  assetBySectorAndFormatLabel = [];

  mostContributingUserData = [
    ["Mudit", "Ankur", "Administrator", "Divjot", "Sheriff"],
  ];
  mostContributingUserLabel = [];

  uploadByFormatData = [];
  uploadByFormatLabel = ["Picture", "Video", "File"];

  constructor(
    public nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private dataService: DataService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.fetchTotalAssets();
    this.fetchReportFromMongo();
    this.fetchMostSearchedTags();
    this.fetchSearchCount();
    this.findUserBySearchCount();
    this.fetchSectorByCount();
  }

  fetchTotalAssets() {
    const headers = {};
    let url = apiRoutes.SEARCH_PP_ASSETS;
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 1,
      ecm_fulltext: "",
      highlight: "",
    };
    this.totalAssets = "loading";
    this.loading = true;

    // this.dataService.loaderValueChange(true);
    this.nuxeo.nuxeoClient
      .request(url, { queryParams: params, headers })
      .get()
      .then((result) => {
        this.totalAssets = 0;
        result.aggregations.system_primaryType_agg.buckets.map(
          (item) => (this.totalAssets += item.docCount)
        );
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      })
      .catch((error) => {
        console.log("report fetch totalasset error = ", error);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      });
  }

  fetchReportFromMongo() {
    const headers = {};
    let url = apiRoutes.REPORT_FETCH;
    let url1 = apiRoutes.REPORT_SECTOR_FETCH;
    this.totalUsers = "loading";
    this.loading = true;

    // this.dataService.loaderValueChange(true);
    this.nuxeo.nuxeoClient
      .request(url, { headers })
      .get()
      .then((result) => {
        this.reportData = result.resultsCount;
        this.calculateTotalDownload(result.data.downloadAssetCount);
        this.calculateTotalPreviews(result.data.previewAssetCount);
        this.calculateTotalUpload(result.data.uploadAssetCount);
        this.totalUsers = result.data.userCount;

        this.loading = false;
        // this.dataService.loaderValueChange(false);
      })
      .catch((error) => {
        console.log("report fetch totalasset error = ", error);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      });

      
    this.nuxeo.nuxeoClient
      .request(url1, { headers })
      .get()
      .then((result) => {
        this.sectorReport = result.data.sectorReport

        this.loading = false;
        // this.dataService.loaderValueChange(false);
      })
      .catch((error) => {
        console.log("report fetch totalasset error = ", error);
        this.loading = false;
        // this.dataService.loaderValueChange(false);
      });
  }

  fetchMostSearchedTags() {
    this.apiService.get("/searchTerm/fetch").subscribe((response: any) => {
      let data;
      response?.data?.properties.buckets.map((item) => {
        if (item.key.trim()) {
          data = { name: item.key, count: item.doc_count };
          this.searchTermsAndCount.push(data);
        }
      });
    });
  }

  fetchSearchCount() {
    this.apiService
      .get("/searchTerm/searchCount")
      .subscribe((response: any) => {
        this.totalSearches = response.data;
      });
  }

  findUserBySearchCount() {
    this.apiService
      .get("/searchTerm/findUserBySearchCount")
      .subscribe((response: any) => {
        let data;
        response?.data?.properties.buckets.map((item) => {
          if (item.key.trim()) {
            data = { name: item.key, count: item.doc_count };
            this.userSearchCount.push(data);
          }
        });
        this.userSearchCount.sort((a,b)=>b.count - a.count)
      });
  }

  fetchSectorByCount() {
    this.apiService.get('/searchTerm/fetchSectorByCount').subscribe(async (response: any) => {
      // console.log("sc d kdc kd",response?.data?.properties.buckets);
      await this.sectorMapping(response?.data?.properties.buckets)
    });
  }

  calculateTotalDownload(downloadAssetCount: {_id: string, countType: any[]}[]) {
    this.totalDownloads = 0;
    let videoCount = 0;
    let fileCount = 0;
    let pictureCount = 0;

    downloadAssetCount.map((item) => {
      let downloadData = { name: item._id, count: 0 };
      item.countType.map((countItem) => {
        this.totalDownloads += countItem.count;
        downloadData.count += countItem.count;
        if (countItem.type.toLowerCase() === "video") {
          videoCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "picture") {
          pictureCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "file") {
          fileCount += countItem.count;
        }
      });
      if (this.usersByCountDownloadData.length < 10) {
        this.usersByCountDownloadData.push(downloadData);
      }
      // [[10, 20, 30]];
      // ['picture', 'video', 'file'];
    });
    this.usersByCountDownloadData.sort((a,b)=>b.count-a.count)

    this.downloadsByFormatData = [[pictureCount, videoCount, fileCount]];
  }

  calculateTotalPreviews(
    previewAssetCount: { _id: string; countType: any[] }[]
  ) {
    this.totalPreviews = 0;
    let videoCount = 0;
    let fileCount = 0;
    let pictureCount = 0;

    previewAssetCount.map((item) => {
      let downloadData = { name: item._id, count: 0 };
      item.countType.map((countItem) => {
        this.totalPreviews += countItem.count;
        downloadData.count += countItem.count;
        if (countItem.type.toLowerCase() === "video") {
          videoCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "picture") {
          pictureCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "file") {
          fileCount += countItem.count;
        }
      });
    });
  }

  calculateTotalUpload(uploadAssetCount: { _id: string; countType: any[];userInfo:any }[]) {
    // this.totalUploads = 0;
    let videoCount = 0;
    let fileCount = 0;
    let pictureCount = 0;

    uploadAssetCount.map((item) => {
      let checkName = item.userInfo[0]?.firstName + " " +item.userInfo[0]?.lastName 
      let finalName = checkName;
      if(checkName.includes('undefined')) finalName = item._id
      if(checkName.includes('null')) finalName = item._id
      let uploadData = { name:finalName, count: 0 };
      item.countType.map((countItem) => {
        // this.totaluploads += countItem.count;
        if (countItem.type.toLowerCase() === "video") {
          videoCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "picture") {
          pictureCount += countItem.count;
        }
        if (countItem.type.toLowerCase() === "file") {
          fileCount += countItem.count;
        }
        uploadData.count += countItem.count;
      });
      if (this.usersByCountUploadData.length < 10) {
        this.usersByCountUploadData.push(uploadData);
      }
    });
    // this.usersByCountUploadData=this.usersByCountUploadData.sort((a,b) => b.count - a.count);
    this.uploadByFormatData = [[pictureCount, videoCount, fileCount]];
  }

  async sectorMapping(sectorData){
    let obj= this.toLowerKeys(Departments)
    let newObj={}
    sectorData.map(ob=>{
      if(obj.hasOwnProperty(ob.key)){
          let value = obj[ob.key]
          if (!newObj.hasOwnProperty(value)) {
              newObj[value]=0
          }
          newObj[value]=newObj[value] + ob.doc_count
      }
    })
    Object.keys(newObj).map(m=>{
      let newValue:any = {}

      newValue.name = Workspace[m]
      newValue.count = newObj[m]
      if(this.sectorCount.length < 11){
        this.sectorCount.push(newValue)
      }
      
    })
    this.sectorCount.sort((a,b)=>b.count-a.count)
  }

  toLowerKeys(obj) {
    return Object.keys(obj).reduce((accumulator, key) => {
      accumulator[key.toLowerCase()] = obj[key];
      return accumulator;
    }, {});
  }
}
