import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BluetoothCore } from '@manekinekko/angular-web-bluetooth';


@Injectable()
export class HeartRateService {

  static GATT_CHARACTERISTIC_HR_MEASUREMENT = 'heart_rate_measurement';
  static GATT_PRIMARY_SERVICE = 'heart_rate';

  constructor(
    public ble: BluetoothCore
  ) {}

  public getFakeValue() {
    this.ble.fakeNext();
  }

  public getDevice() {
    return this.ble.getDevice$();
  }

  public streamValues() {
    return this.ble.streamValues$()
      .map( (value: DataView) => this.parseHeartRate(value));
  }

  /**
   * Get GATT Characteristic value.
   * This logic is specific to this service, this is why we can't abstract it elsewhere.
   * The developer is free to provide any service, and characteristics she wants.
   *
   * @return {Observable<Number>} Emites the value of the requested service read from the device
   */
  public getHeartRate() {
    console.log('Getting Heart Rate Service...');

    try {
        return this.ble
          .discover$({
            filters: [{ services: [HeartRateService.GATT_PRIMARY_SERVICE] }],
            optionalServices: [HeartRateService.GATT_PRIMARY_SERVICE],
          } as RequestDeviceOptions)
          .mergeMap( (gatt: BluetoothRemoteGATTServer)  => {
            return this.ble.getPrimaryService$(gatt, HeartRateService.GATT_PRIMARY_SERVICE);
          })
          .mergeMap( (primaryService: BluetoothRemoteGATTService) => {
            return this.ble.getCharacteristic$(primaryService, HeartRateService.GATT_CHARACTERISTIC_HR_MEASUREMENT);
          })
          .mergeMap( (characteristic: BluetoothRemoteGATTCharacteristic) =>  {
            return this.ble.readValue$(characteristic);
          });
    } catch (e) {
      console.error('Oops! can not read value from %s');
    }
  }

  // The following little helper parses the data provided by the `hear_rate_measurement` service
  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_measurement.xml
  private parseHeartRate(data) {
    const flags = data.getUint8(0);
    const rate16Bits = flags & 0x1; // eslint-disable-line no-bitwise
    const result = {
      heartRate: 0,
      contactDetected: false,
      energyExpended: 0,
      rrIntervals: []
    };
    let index = 1;
    if (rate16Bits) {
      result.heartRate = data.getUint16(index, /*littleEndian=*/true);
      index += 2;
    } else {
      result.heartRate = data.getUint8(index);
      index += 1;
    }
    const contactDetected = flags & 0x2; // eslint-disable-line no-bitwise
    const contactSensorPresent = flags & 0x4; // eslint-disable-line no-bitwise
    if (contactSensorPresent) {
      result.contactDetected = !!contactDetected;
    }
    const energyPresent = flags & 0x8; // eslint-disable-line no-bitwise
    if (energyPresent) {
      result.energyExpended = data.getUint16(index, /*littleEndian=*/true);
      index += 2;
    }
    const rrIntervalPresent = flags & 0x10; // eslint-disable-line no-bitwise
    if (rrIntervalPresent) {
      const rrIntervals = [];
      for (; index + 1 < data.byteLength; index += 2) {
        rrIntervals.push(data.getUint16(index, /*littleEndian=*/true));
      }
      result.rrIntervals = rrIntervals;
    }
    return result;
  }

}
