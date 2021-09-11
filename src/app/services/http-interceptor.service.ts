import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class InterceptorService implements HttpInterceptor {
    constructor() { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('token');
        if (token) {

            // if the token is  stored in localstorage add it to http header
            const headers = new HttpHeaders().set('access-token', token);
            // clone http to the custom AuthRequest and send it to the server
            const AuthRequest = request.clone({ headers });
            return next.handle(AuthRequest);
        } else {
            return next.handle(request);
        }
    }
}