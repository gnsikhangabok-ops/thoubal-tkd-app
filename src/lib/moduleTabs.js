/**
 * Tabs bound to one list filter, with live counts.
 *   const tabs = moduleTabs(list, 'status', [['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']])
 *   <ModuleHeader tabs={tabs.items} activeTab={tabs.active} onTabChange={tabs.select} />
 */
export function moduleTabs(list, key, options) {
  return {
    key,
    items: options.map(([value, label]) => ({ value, label, count: list.countFor(key, value) })),
    active: list.filterValues[key] || '',
    select: (value) => list.setFilter(key, value),
  }
}
