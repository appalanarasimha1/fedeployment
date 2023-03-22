import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseHomeComponent } from './browse-home.component';

describe('BrowseHomeComponent', () => {
  let component: BrowseHomeComponent;
  let fixture: ComponentFixture<BrowseHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrowseHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
