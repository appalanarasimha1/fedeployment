import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataApiComponent } from './data-api.component';

describe('DataApiComponent', () => {
  let component: DataApiComponent;
  let fixture: ComponentFixture<DataApiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataApiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
