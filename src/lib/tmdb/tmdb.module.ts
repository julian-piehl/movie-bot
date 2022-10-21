import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TMDBService } from './tmdb.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.themoviedb.org/3/',
    }),
  ],
  providers: [TMDBService],
  exports: [TMDBService],
})
export class TMDBModule {}
