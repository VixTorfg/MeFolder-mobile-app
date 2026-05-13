import { useMemo } from "react";

interface PaginationResult<T> {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalItems: number;
  totalPages: number;
}

export const usePagination = <T>(
  data: T[],
  pageNumber: number,
  pageSize: number,
): PaginationResult<T> => {
  return useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
      totalItems,
      totalPages,
    };
  }, [data, pageNumber, pageSize]);
};
