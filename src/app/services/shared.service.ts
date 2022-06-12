import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment'; // for interface
import { startCase, camelCase, isEmpty, pluck } from 'lodash';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { localStorageVars } from '../common/constant';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public todaysDateUTC = new Date().toUTCString();
  public todayDateKSAInMilli = new Date().getTime() + 3 * 60 * 60 * 1000;
  public MeterType;

  // /* <!-- sprint12-fixes start --> */
  public sidebarToggleResize = new BehaviorSubject(false);

  constructor(
    private router: Router,
    private _snackBar: MatSnackBar) {}

  setSidebarToggle(slideToggle) {
    this.sidebarToggleResize.next(slideToggle);
  }
  getSidebarToggle() {
    return this.sidebarToggleResize;
  }
  // /* <!-- sprint12-fixes end --> */

  public stringShortener(str: string, strLength: number): string {
    if (!str) return '';
    if (str.length > strLength) {
      return str.substring(0, strLength) + '...';
    }
    else return str;
  }

  toUsCommaSystem(number: string|number): string {
    return number.toLocaleString('en-US');
  }

  public isEmpty(value: any): boolean {
    return isEmpty(value);
  }

  pluck(data, key) {
    return pluck(data, key);
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    if (!url) return '';
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // this.modalLoading = true;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);

          // this.modalLoading = false;
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);

        // this.modalLoading = false;
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'

        // this.modalLoading = false;
        console.log(e);

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }


  public getDateRangeArray(differenceFromDate, differenceInDays = 1): Moment[] {
    return [moment(differenceFromDate).subtract(differenceInDays, 'days'), moment(differenceFromDate)];
  }

  public sortByName(obj: any[]) {
    const sortedObject: any = obj.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return sortedObject;
  }


  // public getDateFormatted(dateGroup: {year: number, month: number, day: number, hour: number, week: number}, aggregationDuration: string) {

  //   if (aggregationDuration === AGGREGATE_DATA_HOUR) {
  //     const date = new Date(dateGroup.year, dateGroup.month - 1, dateGroup.day, dateGroup.hour);
  //     const newtime = date.getTime();

  //     const plus3hours = new Date(newtime + (3 * 60 * 60 * 1000));

  //     dateGroup.year = plus3hours.getFullYear();
  //     dateGroup.month = plus3hours.getMonth();
  //     dateGroup.day = plus3hours.getDate();
  //     dateGroup.hour = plus3hours.getHours();

  //     return `${dateGroup.year}-${this.getDoubleDigit(dateGroup.month + 1)}-${this.getDoubleDigit(dateGroup.day)} ${this.getDoubleDigit(dateGroup.hour)}:00`;

  //   } else if (aggregationDuration === AGGREGATE_DATA_DAY) {
  //     return `${this.getDoubleDigit(dateGroup.year)}-${this.getDoubleDigit(dateGroup.month)}-${this.getDoubleDigit(dateGroup.day)}`;
  //   } else if (aggregationDuration === AGGREGATE_DATA_WEEK) {
  //     return `${this.getDoubleDigit(dateGroup.year)}-${this.getDoubleDigit(dateGroup.month)} week-${this.getDoubleDigit(dateGroup.week)}`;
  //   }
  // }

  gmtToKSA(dateString: string): string {
    if (!dateString) { return '-'; }
    const timeInMS = new Date(dateString).getTime() + (3 * 60 * 60 * 1000);
    return `${new Date(timeInMS).getUTCFullYear()}-${this.getDoubleDigit(new Date(timeInMS).getUTCMonth() + 1)}-${this.getDoubleDigit(new Date(timeInMS).getUTCDate())} ${this.getDoubleDigit(new Date(timeInMS).getUTCHours())}:${this.getDoubleDigit(new Date(timeInMS).getUTCMinutes())}`;
  }

  /**
   * return Date in GMT(YYYY-MM-DD HH:mm:ss)
   */
  getTodayIsoString(): string {
    const dateStringArr = new Date().toISOString().split('T');
    return `${dateStringArr[0]} ${dateStringArr[1].split('.')[0]}`;
  }

  /**
   * if toDate is 2021-5-1
   * ex case 1: 2021-5-1 02:30:00 output '02:30'
   * case 2: 2021-4-30 18:10:00 output 'yesterday'
   * case 3: 2021-4-29 07:10:00 output '2 days ago'
   * @param fromDate
   * @param toDate
   */
  returnDaysAgoFromTodayDate(fromDate: Date, showHours: boolean, toDate?: Date) {
    if (!fromDate) { //NOTE: when in development phase, for the notifications which did not have createdOn field
      return showHours ? `yesterday` : `1 day`;
    }
    const today = toDate ? toDate : moment();

    const daysDifference = moment(today).diff(moment(fromDate), 'days');
    if (daysDifference === 0) {
      let output = `${this.getDoubleDigit(new Date(fromDate).getUTCHours() + 3)}:${this.getDoubleDigit(new Date(fromDate).getUTCMinutes())}`;
      if (!showHours) {
        output = `${moment(today).diff(moment(fromDate), 'hours')} hours`;
      }
      return output;
    } else if (daysDifference === 1) {
      return showHours ? 'yesterday' : `1 day`;
    } else {
      return showHours ? `${daysDifference} days ago` : `${daysDifference} days`;
    }
  }

  getDoubleDigit(value: number) {
    if (value < 10) {
      return '0' + value;
    }
    return value;
  }

  /**
   * Returns days difference from date to current date
   * @param dateString - from date
   */
  returnDaysDiffTillCurrentDate(dateString: any): number {

    if (!dateString) {
      return NaN;
    }

    return moment().diff(moment(dateString), 'days');
  }

  toStartCase(value: string): string {
    return startCase(value);
  }

  toCamelCase(value: string): string {
    return camelCase(value);
  }


  /**
   * Returns days difference from date toDate
   * ex: 2021-5-1 18:30:00 to 2021-5-2 06:10:00 will output 1
   * ex: 2021-5-1 18:30:00 to 2021-5-1 20:10:00 will output 0
   * Date format can be any
   * @param fromDate
   * @param toDate
   */
  calculateDaysBetweenTwoDates(fromDate: Date, toDate: Date): number {
    if (fromDate && toDate) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }
    return moment().diff(moment(fromDate), 'days');
  }

  redirectToLogin() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }


  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed[index] = data;
        }
      });
    }
    if (found) {
      localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
      return;
    }

    data['isSelected'] = false;
    recentlyViewed.push(data);
    localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
    return;
  }

  chekForReportRoles(role: string): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return ["ceo's office", "ground x"].includes(user?.sector?.toLowerCase()) || user?.groups.indexOf(role) != -1;
  }

  toTop(): void {
    window.scroll(0,0);
  }

  capitaliseSelectiveTags(tag: string): string {
    if(tag.toLowerCase().trim() === 'neom') {
      return tag.toUpperCase();
    }
    return tag;
  }

  async getCreateFolderPayload(name: string, sector: string, parentFolder: any, description?: String, associatedDate?: string, isPrivate?: boolean) {
    return {
      "entity-type": "document",
      repository: "default",
      path: parentFolder.path,
      type: parentFolder.type ?? "Workspace",
      parentRef: parentFolder.id,
      isCheckedOut: true,
      isRecord: false,
      retainUntil: null,
      hasLegalHold: false,
      isUnderRetentionOrLegalHold: false,
      isVersion: false,
      isProxy: false,
      changeToken: null,
      isTrashed: false,
      title: "null",
      properties: {
        "webc:themePage": "workspace",
        "webc:theme": "sites",
        "webc:moderationType": "aposteriori",
        "dc:path": parentFolder.path.replace('/null', ''),
        "dc:parentId": parentFolder.id,
        "dc:description": description,
        "dc:title": name,
        "dc:start": associatedDate ? new Date(associatedDate).toISOString() : null,
        "dc:parentName": parentFolder.title,
        "dc:sector": sector,
        "dc:primaryType": "event",
        "dc:folderType": associatedDate ? "singleDayEvent" : "generic",
        "dc:isPrivate": isPrivate,
      },
      facets: ["Folderish", "NXTag", "SuperSpace"],
      schemas: [
        {
          name: "webcontainer",
          prefix: "webc",
        },
        {
          name: "file",
          prefix: "file",
        },
        {
          name: "common",
          prefix: "common",
        },
        {
          name: "files",
          prefix: "files",
        },
        {
          name: "dublincore",
          prefix: "dc",
        },
        {
          name: "publishing",
          prefix: "publish",
        },
        {
          name: "facetedTag",
          prefix: "nxtag",
        },
      ],
      name: name,
    };
  }

  removeWrokspaceFromBreadcrumb(data: string): string {
    return data.replace(/\/workspaces/gi, '');
  }

  showSnackbar(data: string, duration: number, verticalPosition: MatSnackBarVerticalPosition, horizontalPosition: MatSnackBarHorizontalPosition, panelClass: string, actionName?: string, action?: any): void {
    setTimeout(()=>{
      const snackBarRef = this._snackBar.open(data, actionName || '', {
        duration: duration,
        verticalPosition: verticalPosition,
        horizontalPosition: horizontalPosition,
        panelClass: [panelClass],
      });
      if (actionName) {
        snackBarRef.onAction().subscribe(() => action());
      }
    }, 500);
  }

}
