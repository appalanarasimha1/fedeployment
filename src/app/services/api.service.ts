import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

const SERVER_URL = environment.apiServiceBaseUrl;
const apiVersion1 = environment.apiVersion;
// const SERVER_URL1 = environment.mainNuxeoUrl;

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private getHeaders(customHeader: any = {}) {
    return {
      "Access-Control-Allow-Origin": "*",
      accept: "text/plain,application/json, application/json",
      "Access-Control-Allow-Methods": "PUT,DELETE,POST,GET,OPTIONS",
      "enrichers-document":
        "thumbnail,permissions,preview,acls,favorites,audit,tags,folderAssetsCount,breadcrumb",
      "X-Authentication-Token": localStorage.getItem("token"),
      properties: "*",
      ...customHeader
    };
  }

  constructor(private http: HttpClient) {}

  get(urlAddress: string, options?: any) {
    const customHeader = options?.headers || {};
    options = options
      ? Object.assign(options, { headers: this.getHeaders(customHeader) })
      : { headers: this.getHeaders() };
    return this.http
      .get<any>(SERVER_URL + apiVersion1 + urlAddress, options)
      .pipe(map((data) => data));
  }

  getVideo(urlAddress: string, options?: any) {
    options = {
      "Access-Control-Allow-Origin": "*",
      accept: "*/*",
      "Content-Type": "*",
      responseType: "arraybuffer",
      "Access-Control-Allow-Methods": "PUT,DELETE,POST,GET,OPTIONS",
      "enrichers-document":
        "thumbnail,permissions,preview,acls,favorites,audit",
      "X-Authentication-Token": localStorage.getItem("token"),
      properties: "*",
    };
    return this.http
      .get<any>(SERVER_URL + apiVersion1 + urlAddress, options)
      .pipe(map((data) => data));
  }

  post(urlAddress: string, payload: any, options?: any) {
    const customHeader = options?.headers || {};
    options = options
      ? Object.assign(options, { headers: this.getHeaders(customHeader) })
      : { headers: this.getHeaders() };
    return this.http
      .post<any>(SERVER_URL + apiVersion1 + urlAddress, payload, options)
      .pipe(map((data) => data));
  }

  put(urlAddress: string, payload: any, options?: any) {
    options = options || { headers: this.getHeaders() };
    return this.http
      .put<any>(SERVER_URL + apiVersion1 + urlAddress, payload, options)
      .pipe(map((data) => data));
  }

  // putMain(urlAddress: string, payload: any, options?: any) {
  //   options = options || { headers: this.getHeaders() };
  //   return this.http
  //     .put<any>(SERVER_URL1 + apiVersion1 + urlAddress, payload, options)
  //     .pipe(map((data) => data));
  // }

  delete(urlAddress: string, options?: any) {
    options = options || { headers: this.getHeaders() };
    return this.http
      .delete<any>(SERVER_URL + apiVersion1 + urlAddress, options)
      .pipe(map((data) => data));
  }

  streamPost(urlAddress: string, payload: any, options?: any) {
    options = options || { headers: this.getHeaders() };
    return this.http
      .post<any>(SERVER_URL + apiVersion1 + urlAddress, payload, options)
      .pipe(
        map((data) => {
          console.log(data);
          return data;
        })
      );
  }
}
