import { Component, OnInit, NgZone } from '@angular/core';
import { HeartRateService } from '../heart-rate.service';
import { BluetoothCore } from '@manekinekko/angular-web-bluetooth';

type HeartRateMeasurement = {
  contactDetected: boolean,
  energyExpended: number,
  heartRate: number,
  rrIntervals: number[]
};

@Component({
  selector: 'ble-heart-rate',
  template: `
    <a href="#" (click)="getHeartRate()" class="{{hearRateZone}}">
      Current HR <br/> {{heartRate || 'N/A'}}
      <hr/>
      Active Zone <br/> {{hearRateZone || 'N/A'}}
    </a>
  `,
  styles: [`
    a {
      position: relative;
      color: rgba(1,1,1,1);
      text-decoration: none;
      font-family: monospace;
      font-weight: 700;
      font-size: 3em;
      text-transform: capitalize;
      display: block;
      padding: 4px;
      border-radius: 8px;
      margin: 100px auto;
      width: 410px;
      text-align: center;
      transition: all .1s ease;
      background-color: #f5f5f5;
      box-shadow: 0px 9px 0px #dedede, 0px 9px 25px rgba(0,0,0,.7);
      transition: background-color 0.5s ease;
    }

    a:active {
      box-shadow: 0px 3px 0px rgba(245, 245, 245,1), 0px 3px 6px rgba(0,0,0,.9);
      position: relative;
      top: 6px;
    }

    a.maximum {
      color: rgba(255,255,255,1);
      background-color: #CD2834;
      box-shadow: 0px 9px 0px #B52231, 0px 9px 25px rgba(0,0,0,.7);
      text-shadow: #B52231 1px, 1px, 2px;
    }
    a.maximum:active {
      box-shadow: 0px 3px 0px rgba(219,31,5,1), 0px 3px 6px rgba(0,0,0,.9);
    }
    
    a.hard {
      color: rgba(255,255,255,1);
      background-color: #ff8c00;
      box-shadow: 0px 9px 0px #e77f00, 0px 9px 25px rgba(0,0,0,.7);
      text-shadow: #e77f00 1px, 1px, 2px;
    }
    a.hard:active {
      box-shadow: 0px 3px 0px rgba(255, 140, 0,1), 0px 3px 6px rgba(0,0,0,.9);
    }
    
    a.moderate {
      color: rgba(255,255,255,1);
      background-color: #3cb371;
      box-shadow: 0px 9px 0px #36a266, 0px 9px 25px rgba(0,0,0,.7);
      text-shadow: #36a266 1px, 1px, 2px;
    }
    a.moderate:active {
      box-shadow: 0px 3px 0px rgba(60, 179, 113,1), 0px 3px 6px rgba(0,0,0,.9);
    }
    
    a.light {
      color: rgba(255,255,255,1);
      background-color: #1e90ff;
      box-shadow: 0px 9px 0px #1b82e7, 0px 9px 25px rgba(0,0,0,.7);
      text-shadow: #1b82e7 1px, 1px, 2px;
    }
    a.light:active {
      box-shadow: 0px 3px 0px rgba(30, 144, 255,1), 0px 3px 6px rgba(0,0,0,.9);
    }
    
    a.resting {
      color: rgba(255,255,255,1);
      background-color: #808080;
      box-shadow: 0px 9px 0px #747474, 0px 9px 25px rgba(0,0,0,.7);
      text-shadow: #747474 1px, 1px, 2px;
    }
    a.resting:active {
      box-shadow: 0px 3px 0px rgba(128, 128, 128,1), 0px 3px 6px rgba(0,0,0,.9);
    }
  `],
  providers: [ HeartRateService ]
})
export class HeartRateComponent implements OnInit {
  private age: number;
  private targetHR: number;
  private heartRate: string;
  private hearRateZone: string;
  private device: any = {};

  constructor(
    public _zone: NgZone,
    public _heartRateService: HeartRateService
  ) {
    this.age = 34;
    this.targetHR = 220 - this.age;
  }

  ngOnInit() {
    this.getDeviceStatus();
    this.streamValues();
  }

  streamValues() {
    this._heartRateService.streamValues().subscribe(this.showHeartRate.bind(this));
  }

  getDeviceStatus() {
    this._heartRateService.getDevice().subscribe(
      (device) => {
        if (device) {
          this.device = device;
        } else {
          // device not connected or disconnected
          this.device = null;
          this.heartRate = '--';
        }
      }
    );
  }

  getFakeValue() {
    this._heartRateService.getFakeValue();
  }

  getHeartRate() {
    return this._heartRateService.getHeartRate().subscribe(this.showHeartRate.bind(this));
  }

  /* Define which HR zone you currently are (http://www.crossfitbloomfield.com/wp-content/uploads/2015/11/Training_Zone_Diagram.jpg)
   *
   * Target HR = 220 - age
   * Effort:
   *   (red)    Maximum     90-100% target HR
   *   (orange) Hard        80-90% target HR
   *   (green)  Moderate    70-80% target HR
   *   (blue)   Light       60-70% target HR
   *   (grey)   Very Light  50-60% target HR
   */
  getCurrentHearRateZone(hear_rate: number): string {
    const current_target_hr_pct: number = (hear_rate * 100) / this.targetHR;
    if (current_target_hr_pct > 90) {
      return 'maximum';
    } else if (current_target_hr_pct > 80) {
      return 'hard';
    } else if (current_target_hr_pct > 70) {
      return 'moderate';
    } else if (current_target_hr_pct > 60) {
      return 'light';
    } else {
      return 'resting';
    }
  }

  showHeartRate(hr_measurement: HeartRateMeasurement) {
    // force change detection
    this._zone.run( () =>  {
      console.log('Got measurement: ', hr_measurement);
      this.heartRate = '' + hr_measurement.heartRate;
      this.hearRateZone = this.getCurrentHearRateZone(hr_measurement.heartRate);
    });
  }
}
