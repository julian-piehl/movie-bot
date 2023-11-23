import { isNullish } from '@sapphire/utilities';
import { Palette } from '@vibrant/color';
import { EmbedBuilder } from 'discord.js';
import Vibrant from 'node-vibrant';
import { Canvas, CanvasRenderingContext2D, loadImage } from 'skia-canvas';
import { Movie, MovieDetails } from '../../tmdb/movie.model';

export function generateMovieEmbed(movie: Movie) {
  return new EmbedBuilder()
    .setTitle(movie.title)
    .setDescription(movie.overview.length > 0 ? movie.overview : null)
    .setThumbnail(movie.poster)
    .setImage(movie.backdrop);
}

export async function generateMovieImage(movie: MovieDetails) {
  const backdropWidth = 1280;
  const posterWidth = 480;
  const height = 720;

  const leftSpacing = 50;

  const palette = await Vibrant.from(movie.poster!).getPalette();

  const canvas = new Canvas(backdropWidth, height);
  const context = canvas.getContext('2d');

  // ===== Draw Backdrop Image =====
  const backdropImage = await loadImage(movie.backdrop!);
  context.filter = 'blur(20px)';
  context.drawImage(backdropImage, -((posterWidth * 0.8) / 2), 0, backdropWidth - (posterWidth * 0.8) / 2, height);
  context.filter = 'none';

  // ===== Draw Poster Image =====
  context.save();
  context.beginPath();
  context.moveTo(backdropWidth - posterWidth * 0.8, 0);
  context.lineTo(backdropWidth, 0);
  context.lineTo(backdropWidth, height);
  context.lineTo(backdropWidth - posterWidth, height);
  context.closePath();
  context.clip();

  const posterImage = await loadImage(movie.poster!);
  context.drawImage(posterImage, backdropWidth - posterWidth, 0, posterWidth, height);

  context.restore();

  // ===== Draw Backdrop Overlay =====
  context.fillStyle = palette.DarkVibrant?.hex ?? '#6441a5';
  context.globalAlpha = 0.8;

  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(backdropWidth - Math.floor(posterWidth * 0.8) + 0.5, 0);
  context.lineTo(backdropWidth - posterWidth + 0.5, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  // ===== Draw Date and Time ======
  context.fillStyle = getTextFillColor(palette);
  context.font = '500 28px';
  context.globalAlpha = 0.8;

  const hours = Math.floor(movie.runtime / 60);
  const minutes = movie.runtime % 60;
  const releaseYear = new Date(movie.release_date).getFullYear();

  context.fillText(`${releaseYear} - ${hours}h ${minutes}m`, leftSpacing, 75);

  // ===== Draw Watch Provider =====
  const providers = movie['watch/providers'].results['DE'].flatrate;
  if (providers.length >= 1) {
    let providerImageUrl;
    let providerImageHeight = 50;
    let providerImageRightSpacing = 30;
    let providerImageTopSpacing = 30;
    switch (providers[0].provider_id) {
      case 337:
        // Disney Plus (2739)
        providerImageUrl = 'https://image.tmdb.org/t/p/h100_filter(negate,000,666)/uzKjVDmQ1WRMvGBb7UNRE0wTn1H.png';
        providerImageHeight = 75;
        providerImageTopSpacing = 15;
        break;
      case 8:
      case 1796:
        // Netflix / Netflix basic with Ads (213)
        providerImageUrl = 'https://image.tmdb.org/t/p/h50_filter(negate,000,666)/wwemzKWzjKYJFfCeiB57q3r4Bcm.png';
        providerImageRightSpacing = 50;
        break;
      case 9:
      case 119:
        // Amazon Prime Video (1024)
        providerImageUrl = 'https://www.themoviedb.org/t/p/h50_filter(negate,000,666)/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png';
        break;
      case 283:
        // Crunchyroll (1112)
        providerImageUrl = 'https://www.themoviedb.org/t/p/h50_filter(negate,000,666)/81QfupgVijSH5v1H3VUbdlPm2r8.png';
        providerImageHeight = 40;
        break;
    }

    if (providerImageUrl) {
      const providerImage = await loadImage(providerImageUrl);
      const providerImageWidth = providerImage.width * (providerImageHeight / providerImage.height);

      context.drawImage(
        providerImage,
        backdropWidth - posterWidth * 0.8 - providerImageWidth - providerImageRightSpacing,
        providerImageTopSpacing,
        providerImageWidth,
        providerImageHeight
      );
    }
  }

  // ===== Draw Title =====
  const test = palette.DarkVibrant!.r * 0.299 + palette.DarkVibrant!.g * 0.587 + palette.DarkVibrant!.b * 0.114;
  console.log(test);

  context.font = 'bold 70px';
  context.globalAlpha = 1.0;
  const lines = getLines(context, movie.title, backdropWidth - posterWidth - leftSpacing - 20);
  for (var i = 0; i < lines.length; i++) {
    context.fillText(lines[i], leftSpacing, 150 + (70 + 10) * i);
  }

  // ===== Draw Votes =====
  drawStar(context, leftSpacing + 30, height - 150 - 25, 5, 30.5, 15.5);
  const votePercentage = Math.round(movie.vote_average * 10);
  context.fillText(`${votePercentage}%`, leftSpacing + 65, height - 150);

  // ===== Draw Genres =====
  const genreYPos = height - 75;

  context.font = 'bold 28px';
  var genreTextPos = leftSpacing;

  for (var i = 0; i < movie.genres.length; i++) {
    const textMetrics = context.measureText(movie.genres[i].name);

    // Only Draw Genre if enough space is left
    if (genreTextPos + textMetrics.width + 30 + 20 >= backdropWidth - posterWidth) {
      break;
    }

    context.globalAlpha = 0.4;

    context.beginPath();
    context.roundRect(genreTextPos, genreYPos - textMetrics.actualBoundingBoxAscent, textMetrics.width + 30, 40, 50);
    context.fill();

    context.globalAlpha = 1.0;

    context.fillText(movie.genres[i].name, genreTextPos + 15, genreYPos);

    genreTextPos += textMetrics.width + 30 + 20;
  }

  // ===== Export Image =====
  return canvas.toBuffer('png');
}

function getTextFillColor(palette: Palette) {
  if (
    isNullish(palette.DarkVibrant) ||
    palette.DarkVibrant.r * 0.299 + palette.DarkVibrant.g * 0.587 + palette.DarkVibrant.b * 0.114 > 150
  ) {
    return '#000000';
  } else {
    return '#ffffff';
  }
}

function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  var words = text.split(' ');
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  if (lines.length > 3) {
    lines = lines.slice(0, 3);
    lines[2] = lines[2] + '...';
  }

  return lines;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  var rot = (Math.PI / 2) * 3;
  var x = cx;
  var y = cy;
  var step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (var i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
