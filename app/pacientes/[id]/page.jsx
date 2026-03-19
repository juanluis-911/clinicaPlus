import { redirect } from 'next/navigation'

export default async function PacienteDetailPage({ params }) {
  const { id } = await params
  redirect(`/pacientes/${id}/expediente`)
}
