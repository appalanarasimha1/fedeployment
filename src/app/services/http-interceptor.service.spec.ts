import { TestBed } from '@angular/core/testing';

import { InterceptorService } from './http-interceptor.service';

describe('HttpInterceptorService', () => {
  let service: InterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
