import { Component, input } from '@angular/core';
import { Screening } from '../../schedule/models/schedule';

@Component({
  selector: 'app-hold-form',
  template: '<form></form>',
})
export class HoldForm {
  readonly screening = input.required<Screening>();
}
