import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseSectorFolderComponent } from './browse-sector-folder.component';

describe('BrowseSectorFolderComponent', () => {
  let component: BrowseSectorFolderComponent;
  let fixture: ComponentFixture<BrowseSectorFolderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrowseSectorFolderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseSectorFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
