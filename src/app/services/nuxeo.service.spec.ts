import { TestBed } from '@angular/core/testing';

import { NuxeoService } from './nuxeo.service';

describe('NuxeoService', () => {
  let service: NuxeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NuxeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
