import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IHeaderSearchCriteria } from '../common/subHeader/interface';

@Injectable({
  providedIn: "root",
})
export class DataService {
  private sectorChangedSource = new Subject<string>();
  private sectorSelected = new Subject<IHeaderSearchCriteria>();
  private showHideLoader = new Subject<boolean>();
  private showHideLoaderNew = new Subject<boolean>();
  private resetFilter = new Subject<string>();
  private termSearch = new Subject<string>();
  private termSearchForHide = new Subject<string>();
  private termSearchForTheme = new Subject<string>();
  private showRecent = new Subject<boolean>();
  private tagsMetaReal = new Subject<boolean>();
  private searchBarClick = new Subject<boolean>();
  private uploadedAssetData = new Subject<string>();
  private showEverything = new Subject<boolean>();
  private showFooter = new Subject<boolean>();
  private folderPermission = new Subject<boolean>();
  private fetchAssets = new Subject<any>();
  private cardSelection = new Subject<any>();
  constructor() {}

  // Observable string streams
  sectorChanged$ = this.sectorChangedSource.asObservable();
  sectorSelected$ = this.sectorSelected.asObservable();
  showHideLoader$ = this.showHideLoader.asObservable();
  showHideLoaderNew$ = this.showHideLoaderNew.asObservable();
  resetFilter$ = this.resetFilter.asObservable();
  termSearch$ = this.termSearch.asObservable();
  termSearchForHide$ = this.termSearchForHide.asObservable();
  termSearchForTheme$ = this.termSearchForTheme.asObservable();
  showRecent$ = this.showRecent.asObservable();
  tagsMetaReal$ = this.tagsMetaReal.asObservable();
  searchBarClick$ = this.searchBarClick.asObservable();
  uploadedAssetData$ = this.uploadedAssetData.asObservable();
  showEverything$ = this.showEverything.asObservable();
  showFooter$ = this.showFooter.asObservable();
  folderPermission$ = this.folderPermission.asObservable();
  fetchAssets$ = this.fetchAssets.asObservable();
  cardSelection$ = this.cardSelection.asObservable();

  sectorDataPush(sector) {
    this.sectorChangedSource.next(sector);
  }

  sectorChange(sector) {
    this.sectorSelected.next(sector);
  }

  loaderValueChange(loaderValue: boolean) {
    this.showHideLoader.next(loaderValue);
  }

  loaderValueChangeNew(loaderValue: boolean) {
    this.showHideLoaderNew.next(loaderValue);
  }
  resetFilterInit(triggeredFrom: string) {
    this.resetFilter.next(triggeredFrom);
  }

  termSearchInit(term: string) {
    this.termSearch.next(term);
  }

  termSearchForHideInit(term: string) {
    this.termSearchForHide.next(term);
  }

  termSearchForThemeInit(term: string) {
    this.termSearchForTheme.next(term);
  }
  showRecentInit(show: boolean) {
    this.showRecent.next(show);
  }
  tagsMetaRealInit(data: any) {
    this.tagsMetaReal.next(data);
  }

  searchBarClickInit(show: boolean) {
    this.searchBarClick.next(show);
  }

  uploadedAssetDataInit(data: any) {
    this.uploadedAssetData.next(data);
  }
  showEverythingInit(data:boolean){
    this.showEverything.next(data)
  }
  showFooterInit(data:boolean){
    this.showFooter.next(data)
  }
  folderPermissionInit(data:boolean){
    this.folderPermission.next(data)
  }

  fetchAssetsInit(data: any) {
    this.fetchAssets.next(data);
  }

  cardSelectionInit(data: any) {
    this.cardSelection.next(data);
  }
}
