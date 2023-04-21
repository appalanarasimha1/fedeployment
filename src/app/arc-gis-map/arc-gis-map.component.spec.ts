import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArcGisMapComponent } from './arc-gis-map.component';

describe('ArcGisMapComponent', () => {
  let component: ArcGisMapComponent;
  let fixture: ComponentFixture<ArcGisMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArcGisMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArcGisMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
