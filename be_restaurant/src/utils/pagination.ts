export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  status?: string;
  search?: string;
  [key: string]: any; // Allow other filter parameters
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getPaginationParams = (query: any): PaginationParams => {
  const page = Number.parseInt(query.page) || 1;
  const limit = Number.parseInt(query.limit) || 10;
  const sortBy = query.sortBy || "created_at";
  const sortOrder = (
    query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC"
  ) as "ASC" | "DESC";

  const params: PaginationParams = { page, limit, sortBy, sortOrder };

  // Extract search parameter
  if (query.search) {
    params.search = query.search;
  }

  // Extract status parameter
  if (query.status) {
    params.status = query.status;
  }

  // Extract other common filter parameters
  if (query.start_date) params.start_date = query.start_date;
  if (query.end_date) params.end_date = query.end_date;
  if (query.date) params.date = query.date;
  if (query.table_id) params.table_id = query.table_id;
  if (query.user_id) params.user_id = query.user_id;
  if (query.customer_id) params.customer_id = query.customer_id;
  if (query.event_id) params.event_id = query.event_id;

  return params;
};

export const buildPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
