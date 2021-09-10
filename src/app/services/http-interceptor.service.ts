import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {
  constructor(private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(req);
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
              console.log('event--->>>', event);
          }
          return event;
      }));
    // return next.handle(req).tap((event: HttpEvent<any>) => {
    //   if (event instanceof HttpResponse) {
    //     // do stuff with response if you want
    //   }
    // }, (err: any) => {
    //   if (err instanceof HttpErrorResponse) {
    //     if (err.status === 401) {
    //       this.router.navigate(['/login']);
    //     }
    //   }
    // });
    // return;
    // All HTTP requests are going to go through this method
  }
}
