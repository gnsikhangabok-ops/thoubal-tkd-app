// Helpers shared by the delete actions across the admin modules

/** Small red bin button for table rows */
export const deleteBtnCls = '!border-red-300 !text-red-600 hover:!bg-red-50'

/** Count rows in each table that point at a record: [[table, column, label]] → [{ label, n }] */
export async function countLinked(supabase, id, refs) {
  return Promise.all(refs.map(([table, column, label]) =>
    supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, id)
      .then(({ count, error }) => ({ label, n: error ? 0 : count || 0 })),
  ))
}

/** Friendlier text for a database refusal */
export const deleteError = (e) => (/foreign key|violates/i.test(e?.message || '')
  ? 'Other records still point at this one, so it can’t be deleted. Deactivate it instead, or remove those records first.'
  : /permission|policy|row-level/i.test(e?.message || '') ? `Your account isn’t allowed to delete this (${e.message}).` : e?.message)
