import Foundation
import SwiftUI
import Combine

class AppViewModel: ObservableObject {

    // MARK: - Published State

    @Published var perfil: PerfilUsuario?
    @Published var personaje: Personaje = Personaje()
    @Published var registros: [RegistroAlimento] = []
    @Published var amigos: [Amigo] = Amigo.muestra
    @Published var historialBatallas: [Batalla] = []
    @Published var objetosComprados: Set<String> = []
    @Published var onboardingCompleto: Bool = false
    @Published var mostrarSubidaNivel: Bool = false
    @Published var nivelAlcanzado: Int = 1
    @Published var ultimaMonedaGanada: Int = 0
    @Published var mostrarGananciaMonedasHome: Bool = false

    // MARK: - Computed - Resumen de hoy

    var registrosDeHoy: [RegistroAlimento] {
        let hoy = Calendar.current.startOfDay(for: Date())
        return registros.filter { Calendar.current.startOfDay(for: $0.fecha) == hoy }
    }

    var caloriasHoy: Int { registrosDeHoy.reduce(0) { $0 + $1.calorias } }
    var proteinasHoy: Double { registrosDeHoy.reduce(0.0) { $0 + $1.proteinas } }
    var aguaHoyMl: Int { registrosDeHoy.reduce(0) { $0 + $1.mililitrosAgua } }

    var porcentajeCalorias: Double {
        guard let p = perfil, p.caloriasMeta > 0 else { return 0 }
        return min(1.0, Double(caloriasHoy) / Double(p.caloriasMeta))
    }

    var porcentajeProteina: Double {
        guard let p = perfil, p.proteinaMeta > 0 else { return 0 }
        return min(1.0, proteinasHoy / p.proteinaMeta)
    }

    var porcentajeAgua: Double {
        guard let p = perfil, p.aguaMetaMl > 0 else { return 0 }
        return min(1.0, Double(aguaHoyMl) / Double(p.aguaMetaMl))
    }

    // MARK: - Persistence Keys

    private enum Keys {
        static let perfil       = "heroeVital_perfil"
        static let personaje    = "heroeVital_personaje"
        static let registros    = "heroeVital_registros"
        static let amigos       = "heroeVital_amigos"
        static let batallas     = "heroeVital_batallas"
        static let comprados    = "heroeVital_comprados"
        static let onboarding   = "heroeVital_onboarding"
    }

    private var timer: AnyCancellable?

    // MARK: - Init

    init() {
        cargarDatos()
        iniciarDecaimiento()
    }

    // MARK: - Persistence

    func cargarDatos() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        if let data = UserDefaults.standard.data(forKey: Keys.perfil),
           let decoded = try? decoder.decode(PerfilUsuario.self, from: data) {
            perfil = decoded
        }
        if let data = UserDefaults.standard.data(forKey: Keys.personaje),
           let decoded = try? decoder.decode(Personaje.self, from: data) {
            personaje = decoded
        }
        if let data = UserDefaults.standard.data(forKey: Keys.registros),
           let decoded = try? decoder.decode([RegistroAlimento].self, from: data) {
            registros = decoded
        }
        if let data = UserDefaults.standard.data(forKey: Keys.amigos),
           let decoded = try? decoder.decode([Amigo].self, from: data) {
            amigos = decoded
        } else {
            amigos = Amigo.muestra
        }
        if let data = UserDefaults.standard.data(forKey: Keys.batallas),
           let decoded = try? decoder.decode([Batalla].self, from: data) {
            historialBatallas = decoded
        }
        if let data = UserDefaults.standard.data(forKey: Keys.comprados),
           let decoded = try? decoder.decode([String].self, from: data) {
            objetosComprados = Set(decoded)
        }
        onboardingCompleto = UserDefaults.standard.bool(forKey: Keys.onboarding)
    }

    func guardarDatos() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        UserDefaults.standard.set(try? encoder.encode(perfil),                              forKey: Keys.perfil)
        UserDefaults.standard.set(try? encoder.encode(personaje),                           forKey: Keys.personaje)
        UserDefaults.standard.set(try? encoder.encode(registros),                           forKey: Keys.registros)
        UserDefaults.standard.set(try? encoder.encode(amigos),                              forKey: Keys.amigos)
        UserDefaults.standard.set(try? encoder.encode(historialBatallas),                   forKey: Keys.batallas)
        UserDefaults.standard.set(try? encoder.encode(Array(objetosComprados)),             forKey: Keys.comprados)
        UserDefaults.standard.set(onboardingCompleto,                                       forKey: Keys.onboarding)
    }

    // MARK: - Onboarding

    func completarOnboarding(perfil p: PerfilUsuario) {
        perfil = p
        // Apply type bonuses
        personaje.ataque  += p.tipoPersonaje.bonusAtaque
        personaje.defensa += p.tipoPersonaje.bonusDefensa
        personaje.agilidad += p.tipoPersonaje.bonusAgilidad
        personaje.fuerza  += p.tipoPersonaje.bonusFuerza
        personaje.monedas = 75
        personaje.hambre  = 100
        personaje.sed     = 100
        personaje.hp      = personaje.hpMaximo
        onboardingCompleto = true
        guardarDatos()
    }

    // MARK: - Hunger & Thirst Decay

    private func iniciarDecaimiento() {
        // Apply decay since last update
        aplicarDecaimientoTiempo()

        // Check every 5 minutes
        timer = Timer.publish(every: 300, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.aplicarDecaimientoTiempo()
            }
    }

    func aplicarDecaimientoTiempo() {
        let ahora = Date()
        let segundosTranscurridos = ahora.timeIntervalSince(personaje.ultimaActualizacion)
        guard segundosTranscurridos > 60 else { return }

        // Hunger drops ~10pts / 3 hours (1pt per 18 min = 1080 s)
        let decaimientoHambre = segundosTranscurridos / 1080.0 * 10.0
        // Thirst drops ~10pts / 2 hours (1pt per 12 min = 720 s)
        let decaimientoSed    = segundosTranscurridos / 720.0 * 10.0

        personaje.hambre = max(0, personaje.hambre - decaimientoHambre)
        personaje.sed    = max(0, personaje.sed    - decaimientoSed)
        personaje.ultimaActualizacion = ahora

        // HP damage if severely neglected
        if personaje.hambre == 0 || personaje.sed == 0 {
            let daño = Int(segundosTranscurridos / 3600.0)
            personaje.hp = max(1, personaje.hp - daño)
        }

        guardarDatos()
    }

    // MARK: - Food / Water Logging

    func registrarAlimento(_ registro: RegistroAlimento) {
        var r = registro

        // Calculate impact based on macros and user goal
        let caloriasPct = perfil.map { Double(registro.calorias) / Double($0.caloriasMeta) } ?? 0.05
        r.impactoHambre = min(40, caloriasPct * 60)
        r.impactoSed    = min(30, Double(registro.mililitrosAgua) / 500.0 * 40.0)
        r.impactoHP     = Int(r.impactoHambre / 5) + Int(registro.proteinas / 10)
        r.impactoExp    = Int(caloriasPct * 20) + Int(registro.proteinas / 5) + (registro.mililitrosAgua > 200 ? 5 : 0)

        // Coin reward for healthy choices
        let monedasBase = registro.tipo == .agua ? 3 : (registro.calorias > 0 ? 2 : 1)
        let bonusProteina = registro.proteinas > 20 ? 3 : 0
        r.monedasGanadas = monedasBase + bonusProteina

        registros.insert(r, at: 0)

        personaje.hambre = min(100, personaje.hambre + r.impactoHambre)
        personaje.sed    = min(100, personaje.sed    + r.impactoSed)
        personaje.hp     = min(personaje.hpMaximo, personaje.hp + r.impactoHP)
        personaje.experiencia += r.impactoExp
        personaje.monedas += r.monedasGanadas

        verificarSubidaNivel()
        verificarLogroDiario()
        guardarDatos()
    }

    private func verificarSubidaNivel() {
        while personaje.experiencia >= personaje.experienciaParaSiguienteNivel {
            personaje.subirDeNivel()
            nivelAlcanzado = personaje.nivel
            mostrarSubidaNivel = true
        }
    }

    private func verificarLogroDiario() {
        guard let p = perfil else { return }
        let hoy = Calendar.current.startOfDay(for: Date())
        if let ultimo = personaje.ultimoRegistroDia, Calendar.current.startOfDay(for: ultimo) == hoy { return }

        let metasCumplidas = (porcentajeCalorias >= 0.9 ? 1 : 0)
                           + (porcentajeProteina >= 0.9 ? 1 : 0)
                           + (porcentajeAgua >= 0.9 ? 1 : 0)

        if metasCumplidas >= 2 {
            let bonusMonedas = 10 + metasCumplidas * 5
            personaje.monedas += bonusMonedas
            personaje.rachaActual += 1
            personaje.mejorRacha = max(personaje.mejorRacha, personaje.rachaActual)
            ultimaMonedaGanada = bonusMonedas
            mostrarGananciaMonedasHome = true
            personaje.ultimoRegistroDia = Date()
        }
        _ = p
    }

    // MARK: - Shop

    func puedeComprar(_ objeto: ObjetoTienda) -> Bool {
        personaje.monedas >= objeto.precio && !objetosComprados.contains(objeto.id)
    }

    func comprar(_ objeto: ObjetoTienda) -> Bool {
        guard puedeComprar(objeto) else { return false }
        personaje.monedas -= objeto.precio
        objetosComprados.insert(objeto.id)

        switch objeto.tipo {
        case .accesorio, .arma, .armadura:
            personaje.accesorios.append(objeto.id)
        case .mueble, .decoracion:
            personaje.objetosEnCasa.append(objeto.id)
        }

        personaje.aplicarObjeto(objeto)
        guardarDatos()
        return true
    }

    // MARK: - Battle

    func iniciarBatalla(contra enemigo: Amigo) -> Batalla {
        var turnos: [TurnoBatalla] = []
        var hpJugador  = personaje.hp
        var hpEnemigo  = enemigo.hpMaximo
        var turno      = 0

        let nombreJugador = perfil?.nombrePersonaje ?? "Héroe"
        let ataqueJugador  = personaje.ataque  + (personaje.estaHambriento ? -3 : 0) + (personaje.estaSediento ? -2 : 0)
        let defensaJugador = personaje.defensa + (personaje.estaHambriento ? -2 : 0)

        while hpJugador > 0 && hpEnemigo > 0 && turno < 20 {
            turno += 1

            if turno % 2 == 1 {
                // Jugador ataca
                let esCritico = Int.random(in: 1...10) == 10
                var danio = max(1, ataqueJugador - enemigo.defensa / 2 + Int.random(in: 1...6))
                if esCritico { danio *= 2 }
                hpEnemigo -= danio
                let desc = esCritico
                    ? "\(nombreJugador) lanza un golpe CRÍTICO por \(danio) de daño! ⚡"
                    : "\(nombreJugador) ataca a \(enemigo.nombrePersonaje) por \(danio) de daño."
                turnos.append(TurnoBatalla(atacante: nombreJugador, defensor: enemigo.nombrePersonaje, danio: danio, descripcion: desc, esCritico: esCritico))
            } else {
                // Enemigo ataca
                let esCritico = Int.random(in: 1...12) == 12
                var danio = max(1, enemigo.ataque - defensaJugador / 2 + Int.random(in: 1...6))
                if esCritico { danio *= 2 }
                hpJugador -= danio
                let desc = esCritico
                    ? "\(enemigo.nombrePersonaje) ejecuta un ataque CRÍTICO por \(danio) de daño! ⚡"
                    : "\(enemigo.nombrePersonaje) contraataca por \(danio) de daño."
                turnos.append(TurnoBatalla(atacante: enemigo.nombrePersonaje, defensor: nombreJugador, danio: danio, descripcion: desc, esCritico: esCritico))
            }
        }

        let resultado: ResultadoBatalla
        let monedasGanadas: Int
        let monedasPerdidas: Int
        let expGanada: Int

        if hpJugador > hpEnemigo {
            resultado = .victoria
            monedasGanadas = max(5, Int(Double(enemigo.monedas) * Double.random(in: 0.08...0.15)))
            monedasPerdidas = 0
            expGanada = 15 + enemigo.nivel * 5
        } else if hpEnemigo > hpJugador {
            resultado = .derrota
            monedasGanadas = 0
            monedasPerdidas = max(3, Int(Double(personaje.monedas) * Double.random(in: 0.05...0.12)))
            expGanada = 5
        } else {
            resultado = .empate
            monedasGanadas = 2
            monedasPerdidas = 0
            expGanada = 8
        }

        personaje.monedas += monedasGanadas - monedasPerdidas
        personaje.monedas = max(0, personaje.monedas)
        personaje.experiencia += expGanada
        personaje.hp = max(1, personaje.hp / 2)

        if resultado == .victoria {
            personaje.totalBatallasGanadas += 1
        } else if resultado == .derrota {
            personaje.totalBatallasPerdidas += 1
        }

        verificarSubidaNivel()

        let batalla = Batalla(
            enemigo: enemigo,
            resultado: resultado,
            monedasGanadas: monedasGanadas,
            monedasPerdidas: monedasPerdidas,
            expGanada: expGanada,
            turnos: turnos
        )
        historialBatallas.insert(batalla, at: 0)
        guardarDatos()
        return batalla
    }

    // MARK: - Friends

    func agregarAmigo(_ amigo: Amigo) {
        guard !amigos.contains(where: { $0.id == amigo.id }) else { return }
        amigos.append(amigo)
        guardarDatos()
    }

    func eliminarAmigo(id: UUID) {
        amigos.removeAll { $0.id == id }
        guardarDatos()
    }

    // MARK: - Reset (dev)

    func resetearTodo() {
        onboardingCompleto = false
        perfil = nil
        personaje = Personaje()
        registros = []
        historialBatallas = []
        objetosComprados = []
        amigos = Amigo.muestra
        guardarDatos()
    }
}
