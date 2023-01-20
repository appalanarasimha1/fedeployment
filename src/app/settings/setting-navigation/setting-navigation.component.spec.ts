import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingNavigationComponent } from './setting-navigation.component';

describe('SettingNavigationComponent', () => {
  let component: SettingNavigationComponent;
  let fixture: ComponentFixture<SettingNavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingNavigationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
