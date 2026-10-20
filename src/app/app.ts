import { Component } from '@angular/core';
import { Layout } from './core/layout/layout';

@Component({
  imports: [Layout],
  selector: 'app-root',
  template: '<app-layout />',
})
export class App {}
