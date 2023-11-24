import { Controller, Get, Query } from '@nestjs/common';
import { StationsService } from './stations.service';
import { GetApproximateStationDto } from './dto';
import { lastValueFrom, map } from 'rxjs';
import * as haversine from 'haversine';

type Result = {
  point: string;
  country_park: string;
  coordinate: {
    lat: number;
    long: number;
  };
  serviceHour: string;
  distance: string;
  difficultyScore: number;
  travelTime: string;
};

@Controller('stations')
export class StationsController {
  constructor(private stationService: StationsService) {}

  computeSlopeDistance({
    diffDistance,
    diffAltitude,
  }: {
    diffDistance: number;
    diffAltitude: number;
  }): number {
    return Math.sqrt(diffDistance * diffDistance + diffAltitude * diffAltitude);
  }

  computeEstimateTravelTimeInMinute(distanceM: number) {
    const NORMAL_WALKING_SPEED = 1.34; // meter / second
    return distanceM / NORMAL_WALKING_SPEED / 60;
  }

  computeDifficultyScore({
    diffDistance,
    diffAltitude,
  }: {
    diffDistance: number;
    diffAltitude: number;
  }): number {
    const slopeDistance = this.computeSlopeDistance({
      diffAltitude,
      diffDistance,
    });
    return (slopeDistance + diffAltitude) / 1000;
  }

  @Get()
  async getStations(@Query() approximateDto: GetApproximateStationDto) {
    if (approximateDto?.x && approximateDto?.y) {
      const currentX = approximateDto.x;
      const currentY = approximateDto.y;
      const currentElevation = await lastValueFrom(
        this.stationService
          .getAltitude({ x: currentX, y: currentY })
          .pipe(map((res) => res)),
      );
      const { results } = currentElevation || {};
      const { elevation: currentAltitude } = results[0] || {};
      const stations = await lastValueFrom(
        this.stationService
          .getApproximateStations(approximateDto)
          .pipe(map((res) => res)),
      );
      const { features } = stations || {};
      const result: Result[] = [];
      for (const feature of features) {
        const { geometry, properties } = feature || {};
        const { coordinates } = geometry || {};
        const {
          COUNTRY_PARK_TC,
          COUNTRY_PARK_EN,
          FACILITY_NAME_TC,
          FACILITY_NAME_EN,
          SERVICE_HOUR_TC,
        } = properties || {};
        const [x, y] = coordinates || [];
        const elevation = await lastValueFrom(
          this.stationService.getAltitude({ x, y }).pipe(map((res) => res)),
        );
        const { results } = elevation || {};
        const { elevation: altitude } = results[0] || {};
        const distance = haversine(
          {
            latitude: currentY,
            longitude: currentX,
          },
          {
            latitude: y,
            longitude: x,
          },
          {
            unit: 'meter',
          },
        );
        const diffAltitude = altitude - currentAltitude;
        const slopeDistance: number = this.computeSlopeDistance({
          diffDistance: distance,
          diffAltitude,
        });
        const travelTime =
          this.computeEstimateTravelTimeInMinute(slopeDistance);
        const difficultyScore: number = this.computeDifficultyScore({
          diffDistance: distance,
          diffAltitude,
        });
        result.push({
          point: `${COUNTRY_PARK_EN} - ${COUNTRY_PARK_TC}`,
          country_park: `${FACILITY_NAME_EN} - ${FACILITY_NAME_TC}`,
          coordinate: {
            lat: y,
            long: x,
          },
          serviceHour: SERVICE_HOUR_TC,
          distance: `${slopeDistance} (m)`,
          travelTime: `${travelTime} minutes`,
          difficultyScore,
        });
      }
      return result.sort(
        (a: Result, b: Result) => a.difficultyScore - b.difficultyScore,
      );
    }
    return [];
  }
}
