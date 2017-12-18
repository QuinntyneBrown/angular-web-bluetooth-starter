import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { WebBluetoothModule } from '@manekinekko/angular-web-bluetooth';

import { AppComponent } from './app.component';
import { HeartRateComponent } from './heart-rate/heart-rate.component';

@NgModule({
  declarations: [
    AppComponent,
    HeartRateComponent
  ],
  entryComponents: [
    HeartRateComponent
  ],
  imports: [
    BrowserModule,
    WebBluetoothModule.forRoot({
      enableTracing: true
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
