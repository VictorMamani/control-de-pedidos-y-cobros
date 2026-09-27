"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export function QuotationLineEditor({ disabled = false }: { disabled?: boolean }) {
  const [lineIds, setLineIds] = useState([0]);
  const nextId = lineIds.length ? Math.max(...lineIds) + 1 : 0;

  function addLine() {
    if (lineIds.length < 20) setLineIds((current) => [...current, nextId]);
  }

  function removeLine(id: number) {
    if (lineIds.length > 1) setLineIds((current) => current.filter((lineId) => lineId !== id));
  }

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-[#345246]">Productos o servicios</legend>
      {lineIds.map((id, index) => (
        <div key={id} className="border-t border-[#e8efec] pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[#526c60]">Línea {index + 1}</p>
            <button type="button" onClick={() => removeLine(id)} disabled={disabled || lineIds.length === 1} aria-label={`Quitar línea ${index + 1}`} className="grid size-8 place-items-center rounded-md text-[#8b625b] hover:bg-[#fff4f1] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label htmlFor={`line-description-${id}`} className="mb-1 block text-xs font-medium text-[#345246]">Descripción</label>
              <input id={`line-description-${id}`} name="description" required minLength={2} maxLength={120} placeholder="Ej. Teclado mecánico" className="h-10 w-full rounded-lg border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`line-sku-${id}`} className="mb-1 block text-xs font-medium text-[#345246]">Código · opcional</label>
              <input id={`line-sku-${id}`} name="sku" maxLength={40} className="h-10 w-full rounded-lg border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`line-quantity-${id}`} className="mb-1 block text-xs font-medium text-[#345246]">Cantidad</label>
              <input id={`line-quantity-${id}`} name="quantity" type="number" inputMode="decimal" min="0.001" max="10000" step="0.001" defaultValue="1" required className="h-10 w-full rounded-lg border border-[#d9e5df] bg-white px-3 text-sm tabular-nums outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor={`line-price-${id}`} className="mb-1 block text-xs font-medium text-[#345246]">Precio unitario (Bs)</label>
              <input id={`line-price-${id}`} name="unitPrice" type="number" inputMode="decimal" min="0" max="10000000" step="0.01" required className="h-10 w-full rounded-lg border border-[#d9e5df] bg-white px-3 text-sm tabular-nums outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addLine} disabled={disabled || lineIds.length >= 20} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfe2d8] px-3 text-xs font-semibold text-[#28785f] hover:bg-[#f5faf7] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">
        <Plus aria-hidden="true" className="size-4" /> Añadir línea
      </button>
      <p className="text-[11px] text-[#71877d]">Hasta 20 líneas. Se copian a la orden cuando la cotización se acepta.</p>
    </fieldset>
  );
}
