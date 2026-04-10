import { supabase } from '@/integrations/supabase/client';

interface AddLineItemInput {
  quoteId: string;
  description: string;
  amount: number;
  sortOrder: number;
  addedBy: string;
}

/**
 * Adds a post-acceptance cost line item to an existing quote
 * and updates the quote total accordingly.
 */
export async function addQuoteLineItem(input: AddLineItemInput) {
  const { error: lineError } = await supabase.from('quote_line_items').insert({
    quote_id: input.quoteId,
    description: input.description,
    unit_price: input.amount,
    quantity: 1,
    sort_order: input.sortOrder,
    is_addition: true,
    added_by: input.addedBy,
  });

  if (lineError) {
    return { success: false as const, error: lineError.message };
  }
  return { success: true as const };
}

export async function updateQuoteTotal(quoteId: string, newTotal: number) {
  const { error } = await supabase
    .from('quotes')
    .update({ total: newTotal, subtotal: newTotal, updated_at: new Date().toISOString() })
    .eq('id', quoteId);

  if (error) {
    return { success: false as const, error: error.message };
  }
  return { success: true as const };
}
