import { redirect } from "next/navigation";

/** Ruta histórica; el levantamiento detallado vive en `Levantamiento-detallado`. */
export default function CotizadorPreliminarRedirectPage() {
  redirect("/dashboard/Levantamiento-detallado");
}
