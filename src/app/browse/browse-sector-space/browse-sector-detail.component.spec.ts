import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseSectorDetailComponent } from './browse-sector-detail.component';

describe('BrowseSectorDetailComponent', () => {
  let component: BrowseSectorDetailComponent;
  let fixture: ComponentFixture<BrowseSectorDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrowseSectorDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseSectorDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
