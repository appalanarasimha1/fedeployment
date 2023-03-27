import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { ManageExternalUsersComponent } from './manage-external-users/manage-external-users.component';
import { ManageLocationsComponent } from './manage-locations/manage-locations.component';
import { ManageAccessListComponent } from './manage-access-list/manage-access-list.component';
import { ManageSuppliersComponent } from './manage-suppliers/manage-suppliers.component';
import { SettingsComponent } from './settings.component';


const routes: Routes = [
  {
    path: '', component: SettingsComponent,
    children: [
      {path: 'manage-external-users', component: ManageExternalUsersComponent},
      {path: 'manage-suppliers', component: ManageSuppliersComponent},
      {path: 'devices', component: DeviceSettingsComponent},
      {path: 'manage-locations', component: ManageLocationsComponent},
      {path: 'manage-access-list', component: ManageAccessListComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
