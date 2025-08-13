export const paginate = (items = [], page = 1, limit = 10) => {
  const totalItems = Array.isArray(items) ? items.length : 0;

  let perPage = parseInt(limit);
  let currentPage = parseInt(page);

  if (isNaN(perPage) || perPage <= 0) perPage = 10;
  if (isNaN(currentPage) || currentPage <= 0) currentPage = 1;

  const totalPages = Math.ceil(totalItems / perPage) || 1;

  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    data: paginatedItems,
    meta: {
      totalItems,
      totalPages,
      currentPage,
      perPage,
    },
  };
};
