import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { catchError, map } from 'rxjs';

import { GetApproximateStationDto } from './dto';
import { getMinMaxCoordinate } from './utils';
import { DISTANCE_THRESHOLD } from './config';
import { GetAltitudeDto } from './dto';

@Injectable()
export class StationsService {
  constructor(private readonly httpService: HttpService) {}

  getApproximateStations(getApproximateStationDto: GetApproximateStationDto) {
    const { x, y, limit = 5 } = getApproximateStationDto;

    const [minX, maxX, minY, maxY] = getMinMaxCoordinate(
      Number(x),
      Number(y),
      DISTANCE_THRESHOLD,
    );

    const baseUrl =
      'https://api.csdi.gov.hk/apim/dataquery/api/?id=afcd_rcd_1635133835075_48993&layer=cpwdl&bbox-crs=WGS84';

    const scopeParam = `bbox=${minX},${minY},${maxX},${maxY}`;
    const limitParam = `limit=${limit}`;
    const offSetParam = `offset=0`;

    const url = `${baseUrl}&${scopeParam}&${limitParam}&${offSetParam}`;
    return this.httpService
      .get(url)
      .pipe(map((res: AxiosResponse) => res.data))
      .pipe(
        catchError(() => {
          throw new ForbiddenException('API not available');
        }),
      );
  }

  getAltitude(getAltitudeDto: GetAltitudeDto) {
    const { x, y } = getAltitudeDto;

    const apiKey = process.env.GOOGLE_MAP_API;
    const baseUrl = 'https://maps.googleapis.com/maps/api/elevation/json';

    const locationsParam = `locations=${y}%2C${x}`;
    const keyParam = `key=${apiKey}`;

    const url = `${baseUrl}?${locationsParam}&${keyParam}`;
    return this.httpService
      .get(url)
      .pipe(map((res: AxiosResponse) => res.data))
      .pipe(
        catchError(() => {
          throw new ForbiddenException('API not available');
        }),
      );
  }
}
