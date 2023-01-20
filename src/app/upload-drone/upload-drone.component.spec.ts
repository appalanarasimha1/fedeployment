import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDroneComponent } from './upload-drone.component';

describe('UploadDroneComponent', () => {
  let component: UploadDroneComponent;
  let fixture: ComponentFixture<UploadDroneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadDroneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDroneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
