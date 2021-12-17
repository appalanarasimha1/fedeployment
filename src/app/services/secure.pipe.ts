import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Pipe({
  name: 'secure'
})
export class SecurePipe implements PipeTransform {
  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private apiService: ApiService) { }

  transform(url): Observable<SafeUrl> {
    console.log(url);
    return this.http
      .get(url, {headers: { 'X-Authentication-Token': localStorage.getItem('token') }, withCredentials: true, responseType: 'blob'})
      .pipe(map(val => val));
    
    // return this.apiService.get(url);
  }

}