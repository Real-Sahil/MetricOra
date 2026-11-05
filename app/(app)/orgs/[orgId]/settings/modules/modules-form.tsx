"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormActions, FormError, FormSection } from "@/components/forms/form-kit";
import { MODULES } from "@/lib/nav/modules";
import { saveFocusModules } from "./actions";

export function ModulesForm({ orgId, canEdit, initial }: { orgId: string; canEdit: boolean; initial: string[] }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function toggle(key: string) {
    setSaved(false);
    setChosen((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  }

  function save(modules: string[]) {
    setError("");
    start(async () => {
      const res = await saveFocusModules({ orgId, modules });
      if (!res.ok) return setError(res.error);
      setChosen(modules);
      setSaved(true);
      router.refresh();
    });
  }

  const groups = [
    { title: "Optional areas", wave: "second" as const },
    { title: "Parked areas", wave: "parked" as const },
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-6 px-4 py-6 sm:px-8">
      <p className="text-sm text-[#5B6A78]">
        Choose the areas your team uses. The Carbon Reduction Plan, imports, records, waste, fuel, calculations, reports and settings are always on.
        Switching an area off only hides it from the menu and quick find: its records, limits and links to it are unchanged. Leave every box empty to follow your plan.
      </p>
      {groups.map((g) => (
        <FormSection key={g.wave} title={g.title} cols={2}>
          {MODULES.filter((m) => m.wave === g.wave).map((m) => (
            <label key={m.key} className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-[#E3E8EE] bg-white p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={chosen.includes(m.key)} disabled={!canEdit || pending} onChange={() => toggle(m.key)} />
              <span>
                <span className="block font-medium text-[#131d29]">{m.label}</span>
                <span className="block text-xs text-[#5B6A78]">{m.text}</span>
              </span>
            </label>
          ))}
        </FormSection>
      ))}
      <FormError>{error}</FormError>
      {saved ? <p role="status" className="text-sm text-[#5B6A78]">Saved. The menu has been updated.</p> : null}
      {canEdit ? (
        <FormActions start={<Button type="button" variant="outline" disabled={pending || chosen.length === 0 && initial.length === 0} onClick={() => save([])}>Clear focus</Button>}>
          <Button type="button" disabled={pending} onClick={() => save(chosen)}>{pending ? "Saving" : "Save modules"}</Button>
        </FormActions>
      ) : (
        <p className="text-sm text-[#5B6A78]">Only an administrator can change the modules.</p>
      )}
    </div>
  );
}
