import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Barra de navegación */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VKY</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition">Funcionalidades</a>
            <a href="#how" className="hover:text-gray-900 transition">Cómo funciona</a>
            <a href="#pricing" className="hover:text-gray-900 transition">Precios</a>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition px-4 py-2">
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="text-sm font-medium bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero principal */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Plataforma médica de nueva generación</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Gestión médica
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Agenda, telemedicina, historiales digitales y facturación en una sola plataforma.
            Diseñada para clínicas modernas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-900/20 text-center">
              Empieza gratis →
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-center">
              Ver funcionalidades
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-6">Sin tarjeta de crédito · Configuración en 2 minutos</p>
        </div>
      </section>

      {/* Logos de clientes */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm text-gray-400 mb-8">Utilizado por clínicas en toda Latinoamérica</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-40">
            <span className="text-lg md:text-xl font-bold text-gray-900">🏥 MedCenter</span>
            <span className="text-lg md:text-xl font-bold text-gray-900">🩺 SaludPlus</span>
            <span className="text-lg md:text-xl font-bold text-gray-900">⚕️ ClínicaVida</span>
            <span className="text-lg md:text-xl font-bold text-gray-900">💊 FarmaciaTop</span>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Un sistema completo para administrar tu clínica sin complicaciones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📹', title: 'Telemedicina', desc: 'Videollamadas HD con chat en tiempo real. Waiting room y grabación de sesiones.', color: 'from-blue-500 to-blue-600' },
              { icon: '📅', title: 'Agenda Online', desc: 'Calendario interactivo, disponibilidad por doctor y reserva online 24/7.', color: 'from-emerald-500 to-emerald-600' },
              { icon: '📋', title: 'Historial Digital', desc: 'Expedientes completos, recetas electrónicas y línea de tiempo de paciente.', color: 'from-violet-500 to-violet-600' },
              { icon: '💰', title: 'Facturación', desc: 'Cobros automáticos, múltiples métodos de pago y dashboard de ingresos.', color: 'from-amber-500 to-orange-500' },
            ].map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="how" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Cómo funciona</h2>
            <p className="text-lg text-gray-500">Tres pasos para transformar tu clínica</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Registra tu clínica', desc: 'Crea tu cuenta en segundos. Agrega doctores, horarios y configuración básica.' },
              { step: '02', title: 'Conecta con pacientes', desc: 'Los pacientes agendan citas online. Tú confirmas con un clic.' },
              { step: '03', title: 'Gestiona todo', desc: 'Historiales, facturación, telemedicina — todo en un solo lugar.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold text-gray-200 mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Consultas mensuales' },
              { value: '500+', label: 'Clínicas activas' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9', label: 'Satisfacción' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Precios simples</h2>
            <p className="text-lg text-gray-500">Sin sorpresas. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Básico', price: 'US$83', period: '/mes', features: ['1 doctor', '50 citas/mes', 'Historiales básicos', 'Soporte email'], highlighted: false },
              { name: 'Profesional', price: 'US$168', period: '/mes', features: ['5 doctores', 'Citas ilimitadas', 'Telemedicina', 'Facturación', 'Soporte prioritario'], highlighted: true },
              { name: 'Enterprise', price: 'US$423', period: '/mes', features: ['Doctores ilimitados', 'Todo lo anterior', 'API personalizada', 'Soporte 24/7', 'Onboarding dedicado'], highlighted: false },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 ${p.highlighted ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-4' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${p.highlighted ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className={`text-sm ml-1 ${p.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center text-sm">
                      <svg className={`w-4 h-4 mr-3 flex-shrink-0 ${p.highlighted ? 'text-cyan-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`block text-center py-3 rounded-xl font-medium transition ${p.highlighted ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  Empezar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Llamado a la acción */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transforma tu clínica hoy
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Únete a cientos de clínicas que ya confían en VKY.
          </p>
          <Link href="/auth/register" className="inline-block px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-900/20">
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* Pie de página */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-gray-900">VKY.SaaS</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 VKY. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
