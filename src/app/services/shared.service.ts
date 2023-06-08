import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment'; // for interface
import { startCase, camelCase, isEmpty, pluck } from 'lodash';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import JSEncrypt from 'jsencrypt';
import { ASSET_TYPE, EXTERNAL_USER, EXTERNAL_GROUP_GLOBAL, localStorageVars, permissions } from '../common/constant';
import { ApiService } from './api.service';
import { apiRoutes } from "src/app/common/config";
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { NuxeoService } from './nuxeo.service';
import { KeycloakService } from 'keycloak-angular';
import { IChildAssetACL, IEntry } from '../common/interfaces';


@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public todaysDateUTC = new Date().toUTCString();
  public todayDateKSAInMilli = new Date().getTime() + 3 * 60 * 60 * 1000;
  public MeterType;
  public user = JSON.parse(localStorage.getItem('user')) || null;

  // /* <!-- sprint12-fixes start --> */
  public sidebarToggleResize = new BehaviorSubject(false);
  private _subject = new Subject<any>();

  constructor(
    private router: Router,
    private apiService: ApiService,
    private _snackBar: MatSnackBar,
    protected readonly keycloak: KeycloakService
    ) {}

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
    return number.toLocaleString('en-US'); // 'en-IN' for indian numeric system.
  }

  public isEmpty(value: any): boolean {
    return isEmpty(value);
  }

  pluck(data, key) {
    return pluck(data, key);
  }
  
  checkAssetMimeTypes(document: any): string {
    return this.checkMimeType(document);
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if (!url) return '';

    if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
      return '../../../assets/images/no-preview-big.png';
    }
    
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('nuxeo/')[1]}`;
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

  async fetchExternalUserInfo() {
    await this.getExternalGroupUser();
    await this.getExternalGroupUserGlobal();
  }

  async getExternalGroupUser() {
    try {
      const res = await this.apiService.get(apiRoutes.GROUP_USER_LIST.replace('[groupName]', EXTERNAL_USER)).toPromise();
      const users = res?.['entries'];
      const listExternalUser = users?.map(user => user.id);
      localStorage.setItem("listExternalUser", JSON.stringify(listExternalUser));
    } catch(e) {
      console.error('error while fetching external users');
    }
  }

  async getExternalGroupUserGlobal() {
    try {
      const res = await this.apiService.get(apiRoutes.GROUP_USER_LIST.replace('[groupName]', EXTERNAL_GROUP_GLOBAL)).toPromise();
      const users = res?.['entries'];
      const listExternalUserGlobal = users?.map(user => user.id);
      localStorage.setItem("listExternalUserGlobal", JSON.stringify(listExternalUserGlobal));
    } catch (e) {
      console.error('error while fetching external global users');
    }
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


  // markRecentlyViewed(data: any) {
  //   let found = false;
  //   // tslint:disable-next-line:prefer-const
  //   let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
  //   if (recentlyViewed.length) {
  //     recentlyViewed.map((item: any, index: number) => {
  //       if (item.uid === data.uid) {
  //         found = true;
  //         recentlyViewed[index] = data;
  //       }
  //     });
  //   }
  //   if (found) {
  //     localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
  //     return;
  //   }

  //   data['isSelected'] = false;
  //   recentlyViewed.push(data);
  //   localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
  //   return;
  // }

  chekForReportRoles(role: string): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return ["ceo's office", "ground x"].includes(user?.sector?.toLowerCase()) || user?.groups.indexOf(role) != -1;
  }

  toTop(): void {
    $("body").animate({ scrollTop: 0 }, "slow");
    // window.scroll(0,0);
  }

  checkExternalUser(user = JSON.parse(localStorage.getItem('user'))) {
    if(typeof user == "string") {
      return user.includes('neom') ? false : true;
    }
    if (!user?.groups) return false;
    return user?.groups.includes(EXTERNAL_USER);
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
      type: parentFolder.childType ?? "Workspace",
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

  removeWorkspacesFromString(data: string): string {
    return data.replace(/\/workspaces/gi, '');
  }

  showSnackbar(data: string, duration: number, verticalPosition: MatSnackBarVerticalPosition, horizontalPosition: MatSnackBarHorizontalPosition, panelClass: string, actionName?: string, action?: any, timeout = 500): void {
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
    }, timeout);
  }

  markRecentlyViewed(data: any): any[] {
    let found = false;

    // tslint:disable-next-line:prefer-const
    let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed.splice(index, 1);
          recentlyViewed.push(data);
        }
      });
    }
    if (found) {
      localStorage.setItem(
        localStorageVars.RECENTLY_VIEWED,
        JSON.stringify(recentlyViewed, this.getCircularReplacer())
      );
      return [...recentlyViewed.reverse()];
    }

    data["isSelected"] = false;
    recentlyViewed.push(data);
    localStorage.setItem(
      localStorageVars.RECENTLY_VIEWED,
      JSON.stringify(recentlyViewed, this.getCircularReplacer())
    );
    return [...recentlyViewed.reverse()];
  }

  getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }

  checkMimeType(document): string {
    const mimeType = document?.properties?.['file:content']?.['mime-type'];

    if(mimeType?.includes('image'))
      return ASSET_TYPE.PICTURE;
    if(mimeType?.includes('video'))
      return ASSET_TYPE.VIDEO;
    if(mimeType?.includes('pdf'))
      return ASSET_TYPE.FILE;

    return 'nopreview';
  }

  copyLink(assetId: string, assetType: string, sectorName: string): string {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    if(assetType === 'folder') {
      selBox.value = encodeURI(`${window.location.origin}/workspace/${sectorName}/${assetId}`);
    } else {
      selBox.value = encodeURI(`${window.location.origin}/asset-view?assetId=${assetId}`);
    }
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    return selBox.value;
  }

  timeSince(date) {
    return moment(date).fromNow();
  }

  isInThisWeek(date) {
    const now = moment();
    const input = moment(date);
    return now.isoWeek() === input.isoWeek();
  }

  encryptText(text, key) {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(key);
    return encrypt.encrypt(text).toString();
  }

  // oneTimeTask() {
  //   if(localStorage.getItem("logout-once-again")) {
  //     return;
  //   }
  //   this.nuxeo.logout();
  //   localStorage.setItem("logout-once-again", "true");
  //   this.keycloak.logout(window.location.origin + '/login');
  // }

  newEvent(event) {
    this._subject.next(event);
  }

  get events$ () {
    return this._subject.asObservable();
  }

  getNoPreview(item) {
    const splitedData = item?.title?.split('.');
    const mimeType = splitedData[splitedData?.length - 1];
    const lowercaseMime = mimeType.toLowerCase();

    if(lowercaseMime == 'doc' || lowercaseMime == 'docx'){
      return '../../../assets/images/word.png';
    } 
    if(lowercaseMime == 'ppt' || lowercaseMime == 'pptx'){
      return '../../../assets/images/ppt.png';
    }
    return '../../../assets/images/no-preview.png';

  }

  numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getFolderCollaborators(selectedFolder?) {
    const currentWorkspace = selectedFolder ? selectedFolder : JSON.parse(localStorage.getItem('workspaceState'));
    if (!currentWorkspace?.contextParameters?.acls) return [];
    const localAces = currentWorkspace.contextParameters.acls.find(acl => acl.name === 'local');
    if (!localAces?.aces) return;
    const folderCollaborators = {};
    localAces.aces.forEach(ace => {
      if (!ace.granted || ace.username.id === "Administrator" || ace.username.id === 'administrators') return;
      if (!ace.granted || ace.username === "Administrator" || ace.username === 'administrators') return;
      if (folderCollaborators[ace.username.id || ace.username]) {
        folderCollaborators[ace.username.id || ace.username].permission.push(ace.permission);
        folderCollaborators[ace.username.id || ace.username].ids.push(ace.id);
        folderCollaborators[ace.username.id || ace.username].end = this.getLatestEndDate(folderCollaborators[ace.username.id || ace.username].end, ace.end)
        return;
      }
      folderCollaborators[ace.username.id || ace.username] = {
        user: ace.username,
        permission: [ace.permission],
        externalUser: ace.externalUser,
        end: ace.end,
        id: ace.id,
        ids: [ace.id],
      }
    });
    return folderCollaborators;
  }

  getLatestEndDate(date1: string, date2: string) {
    if(new Date(date1).getTime() > new Date(date2).getTime()) {
      return date1;
    } else {
      return date2;
    }
  }

  createAdminCollaborator(data: IChildAssetACL) {
    const user = this.user ? JSON.parse(localStorage.getItem('user')) : null;
    return {
        "user": data.creator,
        "permission": [
            "Everything"
        ],
        "externalUser": this.checkExternalUser(data.creator),
        "end": null,
        "id": `${data.creator}:Everything:true:${user.id}::`,
        "ids": [
          `${data.creator}:Everything:true:${user.id}::`
        ]
    }
  }
  
  public async removeAllPermissions(folderCollaborators, creator: string, currentUserId: string, folderId: string) {
    const arr = [];
    for (const key in folderCollaborators) {
      if(key.toLowerCase() === creator.toLowerCase() || key.toLowerCase() === currentUserId.toLowerCase()) {
        continue;
      }
      const ids = folderCollaborators[key].ids;
      for (const id of ids) {
        folderCollaborators[key].id = id;
        await this.removePermission(folderCollaborators[key].id, folderId);
      }
    }
  }

  public removePermission(id: string, folderId: string) {
    const params = {
      acl: "local",
      id: id,
    };
    const payload = {
      params,
      context: {},
      input: folderId,
    };
    return this.apiService
      .post(apiRoutes.REMOVE_PERMISSION, payload)
      .toPromise();
  }

  isFolderAdmin(item?: IEntry): boolean {
    const currentWorkspace = item || JSON.parse(localStorage.getItem("workspaceState"));
    let adminAcl = null;
    currentWorkspace?.contextParameters?.acls?.[0].name === 'local' && currentWorkspace?.contextParameters?.acls?.[0].aces?.forEach(element => {
      if(element.username === this.user.username && element.permission.toLowerCase() === permissions.lockFolderPermissions.ADMIN.toLowerCase()) {
        adminAcl = element;
      }
    });

    if(adminAcl && (adminAcl.end && new Date(adminAcl.end).getTime() > new Date().getTime() || !adminAcl.end)) {
      return true;
    }
    return false;
  }

}
