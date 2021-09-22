import { Injectable } from '@angular/core';
import * as moment from 'moment';
import {Moment} from 'moment';
import {startCase, camelCase} from 'lodash';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public todaysDateUTC = new Date().toUTCString();
  public todayDateKSAInMilli = new Date().getTime() + 3 * 60 * 60 * 1000;
  public MeterType;

  constructor(private router: Router) {
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


   public getDateFormatted(dateGroup: {year: number, month: number, day: number, hour: number, week: number}, aggregationDuration: string) {

    if (aggregationDuration === AGGREGATE_DATA_HOUR) {
      const date = new Date(dateGroup.year, dateGroup.month - 1, dateGroup.day, dateGroup.hour);
      const newtime = date.getTime();

      const plus3hours = new Date(newtime + (3 * 60 * 60 * 1000));

      dateGroup.year = plus3hours.getFullYear();
      dateGroup.month = plus3hours.getMonth();
      dateGroup.day = plus3hours.getDate();
      dateGroup.hour = plus3hours.getHours();

      return `${dateGroup.year}-${this.getDoubleDigit(dateGroup.month + 1)}-${this.getDoubleDigit(dateGroup.day)} ${this.getDoubleDigit(dateGroup.hour)}:00`;

    } else if (aggregationDuration === AGGREGATE_DATA_DAY) {
      return `${this.getDoubleDigit(dateGroup.year)}-${this.getDoubleDigit(dateGroup.month)}-${this.getDoubleDigit(dateGroup.day)}`;
    } else if (aggregationDuration === AGGREGATE_DATA_WEEK) {
      return `${this.getDoubleDigit(dateGroup.year)}-${this.getDoubleDigit(dateGroup.month)} week-${this.getDoubleDigit(dateGroup.week)}`;
    }
  }

  gmtToKSA(dateString: string): string {
    if (!dateString) { return '-'; }
    const timeInMS = new Date(dateString).getTime() + (3 * 60 * 60 * 1000);
    return `${new Date(timeInMS).getUTCFullYear()}-${this.getDoubleDigit(new Date(timeInMS).getUTCMonth()+1)}-${this.getDoubleDigit(new Date(timeInMS).getUTCDate())} ${this.getDoubleDigit(new Date(timeInMS).getUTCHours())}:${this.getDoubleDigit(new Date(timeInMS).getUTCMinutes())}`;
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
    if (daysDifference === 0 ) {
      // tslint:disable-next-line:max-line-length
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

}
