export const buildQueryOptions = (query, searchableFields = []) => {
  const {
    page = 1,
    limit = 10,
    sort_by = "createdAt",
    sort_order = "desc",
    search = "",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = search
    ? {
        OR: searchableFields.map((field) => ({
          [field]: { contains: search, mode: "insensitive" },
        })),
      }
    : {};

  return {
    skip,
    take: Number(limit),
    orderBy: { [sort_by]: sort_order },
    where,
  };
};
