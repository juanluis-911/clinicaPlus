import Link from 'next/link'
import {
  Calendar, Users, FileText, Pill, ShoppingCart, ClipboardList,
  Check, Star, Stethoscope, Building2, UserCheck, ArrowRight,
  Shield, Zap, BarChart3, MessageSquare, ChevronRight, Menu,
  HeartPulse, FlaskConical, Receipt, Bell,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING PAGE — MediFlow
   Server Component — sin AppLayout, sin sidebar
───────────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: 'MediFlow — La plataforma que tu clínica necesita',
  description:
    'Gestiona pacientes, agenda, expedientes clínicos, recetas y farmacia desde un solo lugar. Diseñado para médicos mexicanos.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm shadow-sky-200">
              <HeartPulse size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">MediFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#funciones" className="hover:text-sky-600 transition-colors">Funciones</a>
            <a href="#para-quien" className="hover:text-sky-600 transition-colors">¿Para quién?</a>
            <a href="#como-funciona" className="hover:text-sky-600 transition-colors">Cómo funciona</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:block text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/registro"
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-sky-200"
            >
              Registrarse gratis <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-slate-950 min-h-[92vh] flex items-center">
        {/* Orbs de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[5%] w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] left-[55%] w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                Lanzamiento 2025 · Hecho en México
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
                Tu clínica,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                  organizada
                </span>{' '}
                y sin caos.
              </h1>

              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-lg">
                MediFlow centraliza tu agenda, expedientes clínicos, recetas,
                farmacia y facturación. Menos papeleo, más tiempo para tus pacientes.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/registro"
                  className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-base px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 hover:-translate-y-0.5"
                >
                  Empieza gratis hoy <ArrowRight size={16} />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base px-7 py-3.5 rounded-2xl transition-colors"
                >
                  Ver cómo funciona
                </a>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Sin tarjeta de crédito · Configuración en menos de 5 minutos
              </p>
            </div>

            {/* Mock UI */}
            <div className="relative hidden lg:block">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '+500', label: 'Médicos activos' },
              { value: '24/7', label: 'Disponible siempre' },
              { value: '100%', label: 'En la nube · Seguro' },
              { value: '< 5 min', label: 'Tiempo de configuración' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-sky-600">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONES ──────────────────────────────────────────────────────── */}
      <section id="funciones" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sky-600 font-semibold text-sm uppercase tracking-widest mb-3">Funciones</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Todo lo que tu clínica necesita,<br className="hidden sm:block" /> en un solo lugar
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto text-lg">
              Diseñado específicamente para el flujo de trabajo de médicos y clínicas mexicanas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ─────────────────────────────────────────────────────── */}
      <section id="para-quien" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sky-600 font-semibold text-sm uppercase tracking-widest mb-3">¿Para quién?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Hecho para profesionales de la salud
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PERSONAS.map((p) => (
              <PersonaCard key={p.title} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[20%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sky-400 font-semibold text-sm uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Listo en minutos, no en días
            </h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto">
              Sin instalaciones. Sin servidores. Sin IT. Solo crea tu cuenta y empieza.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Línea conectora */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-sky-500/40 via-sky-400/60 to-sky-500/40" />

            {STEPS.map((s, i) => (
              <StepCard key={s.title} {...s} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sky-600 font-semibold text-sm uppercase tracking-widest mb-3">Testimonios</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Lo que dicen nuestros médicos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section className="relative py-28 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-white/5 rounded-full" />
          <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-white/5 rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            ¿Listo para transformar tu consulta?
          </h2>
          <p className="mt-5 text-sky-100 text-lg max-w-xl mx-auto">
            Únete a cientos de médicos que ya administran su clínica de forma más inteligente con MediFlow.
          </p>
          <Link
            href="/auth/registro"
            className="mt-8 inline-flex items-center gap-2 bg-white text-sky-600 hover:text-sky-700 font-bold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-sky-700/30 hover:shadow-sky-700/40 transition-all hover:-translate-y-0.5"
          >
            Crear cuenta gratis <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-sky-200 text-sm">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center">
                  <HeartPulse size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">MediFlow</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                La plataforma médica diseñada para modernizar consultorios y clínicas en México.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-4 text-sm">Producto</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#funciones" className="hover:text-sky-400 transition-colors">Funciones</a></li>
                <li><a href="#precios" className="hover:text-sky-400 transition-colors">Precios</a></li>
                <li><a href="#como-funciona" className="hover:text-sky-400 transition-colors">Cómo funciona</a></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-4 text-sm">Acceso</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/auth/registro" className="hover:text-sky-400 transition-colors">Crear cuenta</Link></li>
                <li><Link href="/auth/login" className="hover:text-sky-400 transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2025 MediFlow. Todos los derechos reservados.</p>
            <p className="text-slate-600">Hecho con ❤️ en México</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────────────────────────────────────── */

function MockDashboard() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-sky-500/10 rounded-3xl blur-2xl" />

      {/* Window chrome */}
      <div className="relative bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/80 backdrop-blur-sm">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border-b border-slate-700/50">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-slate-500 font-mono">MediFlow — Dashboard</span>
        </div>

        <div className="flex h-[380px]">
          {/* Sidebar mock */}
          <div className="w-12 bg-slate-900/80 border-r border-slate-700/40 flex flex-col items-center py-4 gap-4">
            {[HeartPulse, Calendar, Users, FileText, Pill, ShoppingCart].map((Icon, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  i === 0
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon size={14} />
              </div>
            ))}
          </div>

          {/* Content mock */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-3 w-28 bg-white/10 rounded-full mb-1.5" />
                <div className="h-2 w-20 bg-white/5 rounded-full" />
              </div>
              <div className="h-7 w-20 bg-sky-500/20 border border-sky-500/30 rounded-lg" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { color: 'sky', icon: Users, label: 'Pacientes', val: '124' },
                { color: 'violet', icon: Calendar, label: 'Citas hoy', val: '8' },
                { color: 'emerald', icon: Receipt, label: 'Recetas', val: '312' },
              ].map((c) => (
                <div key={c.label} className="bg-slate-700/40 rounded-xl p-2.5">
                  <div className={`w-6 h-6 rounded-lg mb-2 flex items-center justify-center bg-${c.color}-500/20`}>
                    <c.icon size={12} className={`text-${c.color}-400`} />
                  </div>
                  <div className="text-white text-sm font-bold">{c.val}</div>
                  <div className="text-slate-500 text-[10px]">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Agenda items */}
            <div className="space-y-1.5">
              {[
                { name: 'María G.', time: '09:00', color: 'sky' },
                { name: 'Carlos R.', time: '09:30', color: 'violet' },
                { name: 'Ana M.', time: '10:00', color: 'emerald' },
                { name: 'José L.', time: '10:30', color: 'amber' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2.5 bg-slate-700/30 rounded-lg px-2.5 py-1.5">
                  <div className={`w-1.5 h-6 rounded-full bg-${item.color}-400`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-white/80">{item.name}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5">
        <Bell size={11} /> 3 citas esta mañana
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, color }) {
  const colors = {
    sky:     { bg: 'bg-sky-50',     icon: 'bg-sky-100 text-sky-600',     border: 'border-sky-100' },
    violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
    rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',    border: 'border-rose-100' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',  border: 'border-amber-100' },
    cyan:    { bg: 'bg-cyan-50',    icon: 'bg-cyan-100 text-cyan-600',    border: 'border-cyan-100' },
  }
  const c = colors[color] ?? colors.sky

  return (
    <div className={`group ${c.bg} border ${c.border} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}>
      <div className={`w-12 h-12 ${c.icon} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon size={22} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function PersonaCard({ icon: Icon, title, subtitle, points, color }) {
  const colors = {
    sky:    'from-sky-500 to-sky-600',
    violet: 'from-violet-500 to-violet-600',
    emerald:'from-emerald-500 to-emerald-600',
  }
  return (
    <div className="border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 group">
      <div className={`bg-gradient-to-br ${colors[color]} p-8`}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={26} className="text-white" />
        </div>
        <h3 className="text-xl font-extrabold text-white">{title}</h3>
        <p className="text-white/70 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="p-6 bg-white">
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
              <div className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check size={11} className="text-emerald-600" />
              </div>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StepCard({ index, icon: Icon, title, description }) {
  return (
    <div className="relative text-center">
      {/* Número de paso */}
      <div className="relative inline-flex">
        <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Icon size={28} className="text-sky-400" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-sky-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center">
          {index}
        </span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  )
}

function TestimonialCard({ name, role, avatar, text, stars = 5 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-5">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    description: 'Gestiona citas fácilmente. Vista diaria, semanal y mensual. Avisos y recordatorios automáticos.',
    color: 'sky',
  },
  {
    icon: Users,
    title: 'Expediente clínico',
    description: 'Historial completo por paciente: antecedentes, consultas, signos vitales, diagnósticos y documentos.',
    color: 'violet',
  },
  {
    icon: FileText,
    title: 'Recetas digitales',
    description: 'Genera recetas en PDF con tu logo y firma. Compártelas por WhatsApp con un solo toque.',
    color: 'emerald',
  },
  {
    icon: ShoppingCart,
    title: 'Farmacia & POS',
    description: 'Control de inventario de medicamentos, punto de venta y corte de caja integrado.',
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp integrado',
    description: 'Comparte recetas y expedientes directamente al teléfono del paciente desde la app.',
    color: 'rose',
  },
  {
    icon: BarChart3,
    title: 'Reportes & estadísticas',
    description: 'Visualiza el crecimiento de tu consulta, ingresos y métricas clave en tiempo real.',
    color: 'cyan',
  },
]

const PERSONAS = [
  {
    icon: Stethoscope,
    title: 'Médicos independientes',
    subtitle: 'Consultorios privados · Especialistas',
    color: 'sky',
    points: [
      'Lleva el expediente completo de cada paciente',
      'Genera recetas profesionales en segundos',
      'Organiza tu agenda sin secretaria',
      'Accede desde cualquier dispositivo',
    ],
  },
  {
    icon: Building2,
    title: 'Clínicas y hospitales',
    subtitle: 'Multi-usuario · Multi-consultorio',
    color: 'violet',
    points: [
      'Gestiona múltiples médicos y asistentes',
      'Farmacia con control de inventario',
      'Reportes por médico y por área',
      'Permisos por rol de usuario',
    ],
  },
  {
    icon: UserCheck,
    title: 'Asistentes médicas',
    subtitle: 'Recepción · Administración',
    color: 'emerald',
    points: [
      'Agenda y confirma citas rápidamente',
      'Registra nuevos pacientes al instante',
      'Cobra y genera recibos en el POS',
      'Vista clara del flujo diario',
    ],
  },
]

const STEPS = [
  {
    icon: UserCheck,
    title: 'Crea tu cuenta',
    description: 'Regístrate gratis en menos de 2 minutos. Solo tu nombre y correo electrónico.',
  },
  {
    icon: Building2,
    title: 'Configura tu clínica',
    description: 'Agrega tu logo, datos de la clínica, horarios y médicos. Listo en 5 minutos.',
  },
  {
    icon: Zap,
    title: '¡Empieza a trabajar!',
    description: 'Registra pacientes, agenda citas y genera recetas desde el primer día.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Dra. Sofía Méndez',
    role: 'Médico General · CDMX',
    avatar: 'SM',
    text: 'MediFlow transformó completamente mi consulta. Antes tenía hojas por todos lados, ahora todo está en mi computadora y en mi celular. Mis pacientes notan la diferencia.',
    stars: 5,
  },
  {
    name: 'Dr. Alejandro Torres',
    role: 'Internista · Monterrey',
    avatar: 'AT',
    text: 'El módulo de expediente clínico es increíble. Puedo ver el historial completo de mis pacientes de años anteriores en segundos. Muy recomendado.',
    stars: 5,
  },
  {
    name: 'Lic. Paola Ruiz',
    role: 'Asistente médica · Guadalajara',
    avatar: 'PR',
    text: 'La agenda y el POS de farmacia nos ahorra al menos 2 horas diarias. La interfaz es muy intuitiva, no necesité capacitación especial.',
    stars: 5,
  },
]
