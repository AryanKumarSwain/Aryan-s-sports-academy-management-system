import { NextRequest } from 'next/server';

export type PaginationParams = {
  page: number;
  limit: number;
  search?: string;
};

export function parsePagination(req: NextRequest, defaultLimit = 20): PaginationParams {
  const url = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(url.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.get('limit') ?? String(defaultLimit), 10) || defaultLimit));
  const search = url.get('search')?.trim() || undefined;
  return { page, limit, search };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function skipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
