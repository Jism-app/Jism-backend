import { Controller, Get, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // No @UseGuards here deliberately — exercises is the public-read
  // catalog table per the spec's RLS policy. Anyone with the API URL can
  // browse exercises without being logged in (e.g. a "preview the app"
  // flow before signup, if that's ever wanted).
  @Get()
  findAll(
    @Query('muscle') muscle?: string,
    @Query('equipment') equipment?: string,
    @Query('movement_pattern') movementPattern?: string,
  ) {
    return this.exercisesService.findAll({ muscle, equipment, movementPattern });
  }
}
