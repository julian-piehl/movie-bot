import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import { TMDBService } from './tmdb.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.themoviedb.org/3/',
    }),
    CacheModule.register({
      ttl: 1000 * 60 * 60,
    }),
  ],
  providers: [TMDBService],
  exports: [TMDBService],
})
export class TMDBModule {}
