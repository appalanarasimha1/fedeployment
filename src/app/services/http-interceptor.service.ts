import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest,HttpResponse
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
// import { HttpResponse } from '@angular/common/http';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(private router: Router) { }
  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
      req = req.clone(
        {setHeaders: { 'X-Authentication-Token': localStorage.getItem('token') }
      });
    return next.handle(req)
        // .pipe(
        //     tap((httpEvent: any) =>{
        //         // Skip request
        //         if(httpEvent.type === 0){
        //             return;
        //         }           
        //         console.log("response: ", httpEvent.headers);  

        //         let minTargetApiVersion : string;
        //         if (httpEvent instanceof HttpResponse) {
        //             if(httpEvent.headers.has('mintargetapiversion')) {
        //                 minTargetApiVersion = httpEvent.headers.get('mintargetapiversion');
        //                 console.log("qwsdfghjmklopoiuytrewsxcvbnjuytfd",minTargetApiVersion);
                        
        //             }
        //         }
        //     })
    // )
  }
}