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
  private resetFilter = new Subject<string>();
  private termSearch = new Subject<string>();
  private showRecent = new Subject<boolean>();
  constructor() {}

  // Observable string streams
  sectorChanged$ = this.sectorChangedSource.asObservable();
  sectorSelected$ = this.sectorSelected.asObservable();
  showHideLoader$ = this.showHideLoader.asObservable();
  resetFilter$ = this.resetFilter.asObservable();
  termSearch$ = this.termSearch.asObservable();
  showRecent$ = this.showRecent.asObservable();

  sectorDataPush(sector) {
    this.sectorChangedSource.next(sector);
  }

  sectorChange(sector) {
    this.sectorSelected.next(sector);
  }

  loaderValueChange(loaderValue: boolean) {
    this.showHideLoader.next(loaderValue);
  }

  resetFilterInit(triggeredFrom: string) {
    this.resetFilter.next(triggeredFrom);
  }

  termSearchInit(term: string) {
    this.termSearch.next(term);
  }

  showRecentInit(show: boolean) {
    this.showRecent.next(show);
  }
}
