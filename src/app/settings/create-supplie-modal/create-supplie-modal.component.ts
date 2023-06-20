import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
// import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ApiService } from "../../services/api.service";

@Component({
  selector: 'app-create-supplie-modal',
  templateUrl: './create-supplie-modal.component.html',
  styleUrls: ['./create-supplie-modal.component.css']
})
export class CreateSupplieModalComponent implements OnInit {

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  suppliersCtrl = new FormControl();
  filteredFruits: Observable<string[]>;
  fruits: any = [];
  suppliersRegion: any = [
    {
      id: 1,
      name: 'OX'
    },
    {
      id: 2,
      name: 'TR'
    },
    {
      id: 3,
      name: 'LN'
    }
  ];
  renameEmail : boolean = false;
  createSuppliers: string = '';
  suppliersName: string = '';
  supportEmail = "";
  loading = false;
  selectedRegion = [];
  selectedMonth;
  currentSuppliers = [];
  supplierId;

  @ViewChild('suppliersInput') suppliersInput: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<CreateSupplieModalComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.filteredFruits = this.suppliersCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => {
        const selectedInitials = this.selectedRegion?.map(region => region.initial) || [];
        return fruit ? this._filter(fruit) : this.suppliersRegion.filter(region => !selectedInitials.includes(region.initial))
      }));
   }

  ngOnInit(): void {
    this.suppliersName = this.data.supplierInput;
    this.suppliersRegion = this.data.suppliersRegion;
    this.suppliersRegion.sort((a, b) => a.initial > b.initial ? 1 : -1);
    this.selectedMonth = new Date();
    this.selectedMonth.setMonth(this.selectedMonth.getMonth() + 6);
    this.currentSuppliers = this.data.currentSuppliers || [];;
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add our fruit
    if ((value || '').trim()) {
      this.fruits.push({
        id:Math.random(),
        name:value.trim()
      });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.suppliersCtrl.setValue(null);
  }

  remove(fruit, indx): void {
    this.fruits.splice(indx, 1);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.fruits.push(event.option.value);
    this.suppliersInput.nativeElement.value = '';
    this.suppliersCtrl.setValue(null);
    this.selectedRegion = this.fruits || [];
  }

  isSupplierNameExisted() {
    return this.currentSuppliers.includes(this.suppliersName);
  }

  async createSupplier() {
    this.loading = true;
    const regions = this.selectedRegion.map(region => region.uid);
    const payload = {
      name: this.suppliersName,
      supportEmail: this.supportEmail,
      regions: regions,
      activated: true,
      expiry: this.selectedMonth || new Date(),
      supplierId: this.supplierId,
    }
    await this.apiService.post('/settings/supplier', payload, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }

  private _filter(value: any): any[] {
    if (typeof value === 'object') return;
    const selectedInitials = this.selectedRegion?.map(region => region.initial) || [];
    return this.suppliersRegion.filter(fruit => (fruit?.name?.toLowerCase().includes(value?.toLowerCase())
      || fruit.initial?.toLowerCase().includes(value?.toLowerCase()))
      && !selectedInitials.includes(fruit.initial));
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

  validateEmail(email) {
    if (!email) return true;
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  validateSupplierId() {
    if (!this.supplierId) return true;
    return this.supplierId.length === 3;
  }

}
