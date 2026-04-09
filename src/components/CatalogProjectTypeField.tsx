"use client";

import { CATALOG_PROJECT_TYPES } from "@/lib/catalog-project-types";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  innerRowClassName?: string;
  buttonClassName?: string;
  inputClassName?: string;
};

export function CatalogProjectTypeField({
  id,
  value,
  onChange,
  className,
  placeholder,
  inputClassName,
}: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClassName ?? className}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {CATALOG_PROJECT_TYPES.map((projectType) => (
        <option key={projectType} value={projectType}>
          {projectType}
        </option>
      ))}
    </select>
  );
}