// app/lib/serviceLoader.ts
import { safeQuery } from "@/app/lib/db";

type ServiceRow = {
  id: number;
  name: string;
  subserviceId: number | null;
  subserviceName: string | null;
};

export async function loadServices() {
  // Join services with subservices
  const { rows } = await safeQuery<ServiceRow>(
    `
    SELECT s.id, s.name, ss.id AS "subserviceId", ss.name AS "subserviceName"
    FROM services s
    LEFT JOIN subservices ss ON ss.service_id = s.id
    `
  );

  // Group rows by service
  const serviceMap: Record<
    number,
    { id: number; name: string; subServices: string[] }
  > = {};

  for (const row of rows) {
    if (!serviceMap[row.id]) {
      serviceMap[row.id] = {
        id: row.id,
        name: row.name,
        subServices: [],
      };
    }
    if (row.subserviceName) {
      serviceMap[row.id].subServices.push(row.subserviceName);
    }
  }

  return Object.values(serviceMap);
}
