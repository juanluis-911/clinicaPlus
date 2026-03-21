import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/catalogo-medicamentos?q=amox
// Busca en catálogo global + entradas propias del médico
// Devuelve objetos completos { nombre, concentracion, forma, mg_kg_min, mg_kg_max, nota_dosis }
export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (q.length < 1) return NextResponse.json({ data: [] })

  // Si la búsqueda incluye números/unidades (ej: "Amoxicilina 500 mg"),
  // usar solo la parte alfabética para encontrar el medicamento.
  // "Amoxicilina 500 mg" → "Amoxicilina", "amox" → "amox"
  const cleanQ = q.replace(/\s+\d.*$/, '').trim() || q

  const { data, error } = await supabase
    .from('catalogo_medicamentos')
    .select('nombre, concentracion, forma, mg_kg_min, mg_kg_max, nota_dosis')
    .or(`medico_id.is.null,medico_id.eq.${user.id}`)
    .ilike('nombre', `%${cleanQ}%`)
    .order('nombre')
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// POST /api/catalogo-medicamentos
// Body: { nombre, concentracion?, forma?, mg_kg_min?, mg_kg_max?, nota_dosis? }
// Guarda en el catálogo propio del médico (ignora duplicados)
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { nombre, concentracion, forma, mg_kg_min, mg_kg_max, nota_dosis } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const { error } = await supabase
    .from('catalogo_medicamentos')
    .insert({
      medico_id:    user.id,
      nombre:       nombre.trim(),
      concentracion: concentracion?.trim() || null,
      forma:        forma?.trim() || null,
      mg_kg_min:    mg_kg_min ?? null,
      mg_kg_max:    mg_kg_max ?? null,
      nota_dosis:   nota_dosis?.trim() || null,
    })

  // Ignorar error de duplicado (23505)
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
