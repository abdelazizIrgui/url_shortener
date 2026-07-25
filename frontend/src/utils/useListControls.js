import { useEffect, useMemo, useState } from "react";

/**
 * Client-side search + filter + sort + pagination for an array that's
 * already fully loaded (e.g. "my links", "my campaigns"). Keeps the page
 * clamped to a valid range whenever the filtered set shrinks, and resets
 * back to page 1 whenever the search/filter/sort changes.
 *
 * @param {Array} items - source array
 * @param {Object} options
 * @param {(item: any, query: string) => boolean} [options.searchFn] - predicate used when `search` is non-empty. `query` is already trimmed + lowercased.
 * @param {Object.<string, (a:any,b:any)=>number>} [options.sorters] - map of sortKey -> comparator
 * @param {string} [options.defaultSort] - initial sort key (must exist in sorters)
 * @param {(item:any, filters:Object)=>boolean} [options.filterFn] - predicate applied using current `filters` state
 * @param {Object} [options.defaultFilters] - initial filters object
 * @param {number} [options.pageSize=10]
 */
export function useListControls(items, {
  searchFn,
  sorters = {},
  defaultSort = "",
  filterFn,
  defaultFilters = {},
  pageSize = 10,
} = {}) {
  const [search, setSearchRaw] = useState("");
  const [sort, setSortRaw] = useState(defaultSort);
  const [filters, setFiltersRaw] = useState(defaultFilters);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = items || [];

    if (search.trim() && searchFn) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => searchFn(item, q));
    }
    if (filterFn) {
      result = result.filter((item) => filterFn(item, filters));
    }
    if (sort && sorters[sort]) {
      result = [...result].sort(sorters[sort]);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Keep page in range when the filtered set shrinks below the current page.
  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  return {
    paged,
    total: filtered.length,
    totalCount: items?.length || 0,
    page,
    totalPages,
    setPage,
    search,
    setSearch: (value) => { setSearchRaw(value); setPage(1); },
    sort,
    setSort: (value) => { setSortRaw(value); setPage(1); },
    filters,
    setFilter: (key, value) => { setFiltersRaw((prev) => ({ ...prev, [key]: value })); setPage(1); },
  };
}
