// components/settings/SubserviceItem.tsx
"use client";

import React from "react";
import EditSubserviceModal from "./EditSubserviceModal";
import DeleteSubserviceModal from "./DeleteSubserviceModal";

interface Props {
  serviceId: number;
  name: string;
}

export function SubserviceItem({ serviceId, name }: Props) {
  return (
    <div className="inline-flex items-center gap-2 mb-2">
      <span className="px-3 py-1.5 bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full">
        {name}
      </span>
      <EditSubserviceModal serviceId={serviceId} oldName={name} />
      <DeleteSubserviceModal serviceId={serviceId} name={name} />
    </div>
  );
}
