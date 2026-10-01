import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SearchHistoryService } from './search-history.service';
import { CreateSearchHistoryDto } from './dto/create-search-history.dto';
import { SearchHistory } from './entities/search-history.entity';

@ApiTags('search-history')
@Controller('search-history')
export class SearchHistoryController {
  constructor(private readonly service: SearchHistoryService) {}

  // ── GET /api/search-history ──────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get last 20 city searches' })
  @ApiResponse({ status: 200, type: [SearchHistory] })
  findAll(): Promise<SearchHistory[]> {
    return this.service.findAll();
  }

  // ── POST /api/search-history ─────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a city search to history' })
  @ApiResponse({ status: 201, type: SearchHistory })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateSearchHistoryDto): Promise<SearchHistory> {
    return this.service.create(dto);
  }

  // ── DELETE /api/search-history/clear ────────────────────
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all search history' })
  @ApiResponse({ status: 200, description: '{ deleted: number }' })
  clear(): Promise<{ deleted: number }> {
    return this.service.clear();
  }

  // ── DELETE /api/search-history/:id ──────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a single history entry' })
  @ApiParam({ name: 'id', description: 'UUID of the search history entry' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: boolean }> {
    return this.service.remove(id);
  }
}
