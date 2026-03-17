import Foundation
import SwiftUI

// MARK: - Enums

enum Sexo: String, Codable, CaseIterable {
    case masculino = "Masculino"
    case femenino = "Femenino"
    case otro = "Otro"
}

enum Objetivo: String, Codable, CaseIterable {
    case perderPeso  = "Perder Peso"
    case definirse   = "Definirse"
    case mantenerse  = "Mantenerse"
    case ganarMasa   = "Ganar Masa"
    case ganarFuerza = "Ganar Fuerza"

    var descripcion: String {
        switch self {
        case .perderPeso:  return "Reducir peso corporal con déficit calórico"
        case .definirse:   return "Tonificar músculos y reducir grasa"
        case .mantenerse:  return "Mantener peso y composición corporal actual"
        case .ganarMasa:   return "Ganar músculo con superávit calórico"
        case .ganarFuerza: return "Aumentar fuerza máxima y potencia"
        }
    }

    var emoji: String {
        switch self {
        case .perderPeso:  return "⚡"
        case .definirse:   return "🗡️"
        case .mantenerse:  return "⚖️"
        case .ganarMasa:   return "💪"
        case .ganarFuerza: return "🔥"
        }
    }

    var colorTema: Color {
        switch self {
        case .perderPeso:  return .orange
        case .definirse:   return .yellow
        case .mantenerse:  return .blue
        case .ganarMasa:   return .purple
        case .ganarFuerza: return .red
        }
    }
}

enum NivelActividad: String, Codable, CaseIterable {
    case sedentario          = "Sedentario"
    case ligeramenteActivo   = "Ligeramente Activo"
    case moderadamenteActivo = "Moderadamente Activo"
    case muyActivo           = "Muy Activo"
    case atletico            = "Atlético"

    var descripcion: String {
        switch self {
        case .sedentario:          return "Poco o nada de ejercicio"
        case .ligeramenteActivo:   return "Ejercicio ligero 1-3 días/semana"
        case .moderadamenteActivo: return "Ejercicio moderado 3-5 días/semana"
        case .muyActivo:           return "Ejercicio intenso 6-7 días/semana"
        case .atletico:            return "Entrenamiento profesional o trabajo físico"
        }
    }

    var multiplicador: Double {
        switch self {
        case .sedentario:          return 1.2
        case .ligeramenteActivo:   return 1.375
        case .moderadamenteActivo: return 1.55
        case .muyActivo:           return 1.725
        case .atletico:            return 1.9
        }
    }
}

enum TipoPersonaje: String, Codable, CaseIterable {
    case guerrero = "Guerrero"
    case mago     = "Mago"
    case arquero  = "Arquero"
    case sanador  = "Sanador"

    var descripcion: String {
        switch self {
        case .guerrero: return "Alto ataque y defensa. Domina el combate cuerpo a cuerpo."
        case .mago:     return "Magia devastadora. Bonus con proteínas e hidratación perfecta."
        case .arquero:  return "Ágil y preciso. Se potencia con actividad diaria y cardio."
        case .sanador:  return "Resistencia suprema. Recupera HP rápido y tiene ventajas de salud."
        }
    }

    var colorPrimario: Color {
        switch self {
        case .guerrero: return Color(red: 0.8, green: 0.2, blue: 0.2)
        case .mago:     return Color(red: 0.5, green: 0.1, blue: 0.8)
        case .arquero:  return Color(red: 0.2, green: 0.6, blue: 0.2)
        case .sanador:  return Color(red: 0.2, green: 0.4, blue: 0.9)
        }
    }

    var colorSecundario: Color {
        switch self {
        case .guerrero: return Color(red: 0.6, green: 0.1, blue: 0.1)
        case .mago:     return Color(red: 0.3, green: 0.0, blue: 0.6)
        case .arquero:  return Color(red: 0.1, green: 0.4, blue: 0.1)
        case .sanador:  return Color(red: 0.1, green: 0.2, blue: 0.7)
        }
    }

    var emoji: String {
        switch self {
        case .guerrero: return "⚔️"
        case .mago:     return "🔮"
        case .arquero:  return "🏹"
        case .sanador:  return "💚"
        }
    }

    var bonusAtaque:  Int { switch self { case .guerrero: return 5; case .mago: return 3; case .arquero: return 4; case .sanador: return 1 } }
    var bonusDefensa: Int { switch self { case .guerrero: return 5; case .mago: return 1; case .arquero: return 2; case .sanador: return 3 } }
    var bonusAgilidad:Int { switch self { case .guerrero: return 1; case .mago: return 2; case .arquero: return 5; case .sanador: return 3 } }
    var bonusFuerza:  Int { switch self { case .guerrero: return 4; case .mago: return 2; case .arquero: return 2; case .sanador: return 1 } }
}

enum TipoAlimento: String, Codable, CaseIterable {
    case comida     = "Comida"
    case bebida     = "Bebida"
    case agua       = "Agua"
    case snack      = "Snack"
    case suplemento = "Suplemento"

    var emoji: String {
        switch self {
        case .comida:     return "🍽️"
        case .bebida:     return "🥤"
        case .agua:       return "💧"
        case .snack:      return "🍎"
        case .suplemento: return "💊"
        }
    }
}

enum TipoObjeto: String, Codable, CaseIterable {
    case accesorio  = "Accesorio"
    case mueble     = "Mueble"
    case decoracion = "Decoración"
    case arma       = "Arma"
    case armadura   = "Armadura"

    var emoji: String {
        switch self {
        case .accesorio:  return "💍"
        case .mueble:     return "🪑"
        case .decoracion: return "🖼️"
        case .arma:       return "⚔️"
        case .armadura:   return "🛡️"
        }
    }
}

enum EstadoVital {
    case excelente, bien, regular, critico

    var color: Color {
        switch self {
        case .excelente: return .green
        case .bien:      return .yellow
        case .regular:   return .orange
        case .critico:   return .red
        }
    }

    var texto: String {
        switch self {
        case .excelente: return "Excelente"
        case .bien:      return "Bien"
        case .regular:   return "Regular"
        case .critico:   return "¡Crítico!"
        }
    }
}

enum ResultadoBatalla: String, Codable {
    case victoria = "Victoria"
    case derrota  = "Derrota"
    case empate   = "Empate"

    var color: Color {
        switch self {
        case .victoria: return .green
        case .derrota:  return .red
        case .empate:   return .yellow
        }
    }

    var emoji: String {
        switch self {
        case .victoria: return "🏆"
        case .derrota:  return "💀"
        case .empate:   return "🤝"
        }
    }
}

// MARK: - Data Models

struct PerfilUsuario: Codable {
    var id: UUID = UUID()
    var nombre: String
    var pesoKg: Double
    var estaturaCm: Double
    var edad: Int
    var sexo: Sexo
    var objetivo: Objetivo
    var nivelActividad: NivelActividad
    var tipoPersonaje: TipoPersonaje
    var nombrePersonaje: String
    var fechaRegistro: Date = Date()

    var caloriasMeta: Int {
        let tmb: Double
        if sexo == .masculino {
            tmb = 10 * pesoKg + 6.25 * estaturaCm - 5 * Double(edad) + 5
        } else {
            tmb = 10 * pesoKg + 6.25 * estaturaCm - 5 * Double(edad) - 161
        }
        let tdee = tmb * nivelActividad.multiplicador
        switch objetivo {
        case .perderPeso:  return Int(tdee - 500)
        case .definirse:   return Int(tdee - 200)
        case .mantenerse:  return Int(tdee)
        case .ganarMasa:   return Int(tdee + 350)
        case .ganarFuerza: return Int(tdee + 200)
        }
    }

    var proteinaMeta: Double {
        switch objetivo {
        case .perderPeso:  return pesoKg * 1.6
        case .definirse:   return pesoKg * 1.8
        case .mantenerse:  return pesoKg * 1.4
        case .ganarMasa:   return pesoKg * 2.0
        case .ganarFuerza: return pesoKg * 2.2
        }
    }

    var aguaMetaLitros: Double { pesoKg * 0.033 }
    var aguaMetaMl: Int { Int(aguaMetaLitros * 1000) }
}

struct Personaje: Codable {
    var nivel: Int = 1
    var experiencia: Int = 0
    var experienciaParaSiguienteNivel: Int = 100
    var hp: Int = 100
    var hpMaximo: Int = 100
    var ataque: Int = 10
    var defensa: Int = 10
    var agilidad: Int = 10
    var fuerza: Int = 10
    var hambre: Double = 80.0
    var sed: Double = 80.0
    var monedas: Int = 50
    var rachaActual: Int = 0
    var mejorRacha: Int = 0
    var accesorios: [String] = []
    var objetosEnCasa: [String] = []
    var ultimaActualizacion: Date = Date()
    var totalBatallasGanadas: Int = 0
    var totalBatallasPerdidas: Int = 0
    var ultimoRegistroDia: Date? = nil

    var estaHambriento: Bool { hambre < 30 }
    var estaSediento: Bool   { sed < 30 }
    var estaMuyDebil: Bool   { hp < hpMaximo / 4 }

    var poderTotal: Int {
        let penalizacion = (estaHambriento ? 5 : 0) + (estaSediento ? 5 : 0)
        return max(1, ataque + defensa + agilidad + fuerza - penalizacion)
    }

    var estadoHambre: EstadoVital {
        if hambre > 70 { return .excelente }
        if hambre > 50 { return .bien }
        if hambre > 30 { return .regular }
        return .critico
    }

    var estadoSed: EstadoVital {
        if sed > 70 { return .excelente }
        if sed > 50 { return .bien }
        if sed > 30 { return .regular }
        return .critico
    }

    var estadoHP: EstadoVital {
        let ratio = Double(hp) / Double(hpMaximo)
        if ratio > 0.7 { return .excelente }
        if ratio > 0.5 { return .bien }
        if ratio > 0.25 { return .regular }
        return .critico
    }

    mutating func subirDeNivel() {
        nivel += 1
        experiencia -= experienciaParaSiguienteNivel
        experienciaParaSiguienteNivel = Int(Double(experienciaParaSiguienteNivel) * 1.5)
        hpMaximo += 15
        hp = hpMaximo
        ataque += 2
        defensa += 2
        agilidad += 1
        fuerza += 2
        monedas += 25
    }

    mutating func aplicarObjeto(_ objeto: ObjetoTienda) {
        hpMaximo += objeto.bonusHP
        hp = min(hp + objeto.bonusHP, hpMaximo)
        ataque  += objeto.bonusAtaque
        defensa += objeto.bonusDefensa
        agilidad += objeto.bonusAgilidad
        fuerza  += objeto.bonusFuerza
    }
}

struct RegistroAlimento: Codable, Identifiable {
    var id: UUID = UUID()
    var fecha: Date = Date()
    var tipo: TipoAlimento
    var descripcion: String
    var calorias: Int
    var proteinas: Double = 0
    var carbohidratos: Double = 0
    var grasas: Double = 0
    var mililitrosAgua: Int = 0
    var imagenData: Data?
    var impactoHP: Int
    var impactoHambre: Double
    var impactoSed: Double
    var impactoExp: Int
    var monedasGanadas: Int = 0
}

struct Amigo: Codable, Identifiable {
    var id: UUID
    var nombre: String
    var nombrePersonaje: String
    var tipoPersonaje: TipoPersonaje
    var nivel: Int
    var ataque: Int
    var defensa: Int
    var agilidad: Int
    var fuerza: Int
    var hpMaximo: Int
    var monedas: Int
    var rachaActual: Int
    var totalBatallasGanadas: Int

    var poderTotal: Int { ataque + defensa + agilidad + fuerza }
    var hp: Int { hpMaximo }
}

struct ObjetoTienda: Codable, Identifiable {
    var id: String
    var nombre: String
    var descripcion: String
    var precio: Int
    var tipo: TipoObjeto
    var emoji: String
    var bonusHP: Int = 0
    var bonusAtaque: Int = 0
    var bonusDefensa: Int = 0
    var bonusAgilidad: Int = 0
    var bonusFuerza: Int = 0
}

struct Batalla: Codable, Identifiable {
    var id: UUID = UUID()
    var fecha: Date = Date()
    var enemigo: Amigo
    var resultado: ResultadoBatalla
    var monedasGanadas: Int
    var monedasPerdidas: Int
    var expGanada: Int
    var turnos: [TurnoBatalla]
}

struct TurnoBatalla: Codable, Identifiable {
    var id: UUID = UUID()
    var atacante: String
    var defensor: String
    var danio: Int
    var descripcion: String
    var esCritico: Bool = false
}

// MARK: - Tienda Catálogo

extension ObjetoTienda {
    static let catalogo: [ObjetoTienda] = [
        // Accesorios
        ObjetoTienda(id: "corona_bronce",   nombre: "Corona de Bronce",  descripcion: "Una pequeña corona que muestra tu rango.",   precio: 40,  tipo: .accesorio,  emoji: "👑",  bonusDefensa: 1),
        ObjetoTienda(id: "capa_roja",       nombre: "Capa Escarlata",    descripcion: "Una elegante capa roja que intimida.",       precio: 60,  tipo: .accesorio,  emoji: "🧣",  bonusAtaque: 2),
        ObjetoTienda(id: "anillo_poder",    nombre: "Anillo de Poder",   descripcion: "Aumenta tu fuerza mágica.",                  precio: 80,  tipo: .accesorio,  emoji: "💍",  bonusFuerza: 3),
        ObjetoTienda(id: "amuleto_vida",    nombre: "Amuleto de Vida",   descripcion: "Otorga puntos de vida adicionales.",         precio: 100, tipo: .accesorio,  emoji: "📿",  bonusHP: 20),
        ObjetoTienda(id: "guantes_batalla", nombre: "Guantes de Batalla",descripcion: "Aumentan el ataque cuerpo a cuerpo.",        precio: 90,  tipo: .accesorio,  emoji: "🥊",  bonusAtaque: 3),
        // Armas
        ObjetoTienda(id: "espada_hierro",   nombre: "Espada de Hierro",  descripcion: "Una espada confiable para todo combate.",    precio: 120, tipo: .arma,       emoji: "⚔️",  bonusAtaque: 5),
        ObjetoTienda(id: "baston_magico",   nombre: "Bastón Mágico",     descripcion: "Canaliza el poder arcano.",                  precio: 130, tipo: .arma,       emoji: "🪄",  bonusFuerza: 4, bonusAtaque: 3),
        ObjetoTienda(id: "arco_elfico",     nombre: "Arco Élfico",       descripcion: "Ataque a distancia con precisión élfica.",   precio: 140, tipo: .arma,       emoji: "🏹",  bonusAtaque: 4, bonusAgilidad: 3),
        // Armaduras
        ObjetoTienda(id: "escudo_madera",   nombre: "Escudo de Madera",  descripcion: "Protección básica pero confiable.",          precio: 80,  tipo: .armadura,   emoji: "🛡️",  bonusDefensa: 4),
        ObjetoTienda(id: "cota_malla",      nombre: "Cota de Malla",     descripcion: "Armadura ligera de eslabones de metal.",     precio: 150, tipo: .armadura,   emoji: "🪖",  bonusDefensa: 6, bonusHP: 10),
        ObjetoTienda(id: "armadura_plata",  nombre: "Armadura de Plata", descripcion: "Protección plateada de alto nivel.",        precio: 250, tipo: .armadura,   emoji: "⚜️",  bonusDefensa: 10, bonusHP: 20),
        // Muebles
        ObjetoTienda(id: "silla_comoda",    nombre: "Silla Cómoda",      descripcion: "Para descansar entre batallas.",             precio: 30,  tipo: .mueble,     emoji: "🪑"),
        ObjetoTienda(id: "mesa_festin",     nombre: "Mesa del Festín",   descripcion: "Una gran mesa para banquetes épicos.",       precio: 70,  tipo: .mueble,     emoji: "🍽️"),
        ObjetoTienda(id: "cama_real",       nombre: "Cama Real",         descripcion: "Descanso real para un héroe real.",          precio: 120, tipo: .mueble,     emoji: "🛏️"),
        ObjetoTienda(id: "estante_trofeos", nombre: "Estante de Trofeos",descripcion: "Exhibe tus victorias con orgullo.",          precio: 90,  tipo: .mueble,     emoji: "🏆"),
        // Decoraciones
        ObjetoTienda(id: "planta_magica",   nombre: "Planta Mágica",     descripcion: "Una planta que brilla con energía vital.",   precio: 35,  tipo: .decoracion, emoji: "🌿"),
        ObjetoTienda(id: "cuadro_batalla",  nombre: "Cuadro de Batalla", descripcion: "Una pintura épica de tu mejor victoria.",    precio: 55,  tipo: .decoracion, emoji: "🖼️"),
        ObjetoTienda(id: "alfombra_dragon", nombre: "Alfombra del Dragón",descripcion: "Una alfombra con un dragón tejido.",        precio: 75,  tipo: .decoracion, emoji: "🐉"),
        ObjetoTienda(id: "ventana_magica",  nombre: "Ventana Mágica",    descripcion: "Una ventana con vistas a mundos lejanos.",   precio: 110, tipo: .decoracion, emoji: "🌌"),
    ]
}

// MARK: - Amigos de muestra

extension Amigo {
    static let muestra: [Amigo] = [
        Amigo(id: UUID(), nombre: "Carlos M.",    nombrePersonaje: "Ignisfang",   tipoPersonaje: .guerrero, nivel: 3, ataque: 18, defensa: 17, agilidad: 12, fuerza: 15, hpMaximo: 140, monedas: 180, rachaActual: 5, totalBatallasGanadas: 8),
        Amigo(id: UUID(), nombre: "Sofía R.",     nombrePersonaje: "Lunara",      tipoPersonaje: .mago,     nivel: 4, ataque: 22, defensa: 11, agilidad: 16, fuerza: 14, hpMaximo: 130, monedas: 310, rachaActual: 12, totalBatallasGanadas: 15),
        Amigo(id: UUID(), nombre: "Andrés P.",    nombrePersonaje: "Swiftwind",   tipoPersonaje: .arquero,  nivel: 2, ataque: 15, defensa: 12, agilidad: 20, fuerza: 10, hpMaximo: 110, monedas: 95, rachaActual: 3, totalBatallasGanadas: 4),
        Amigo(id: UUID(), nombre: "Valentina G.", nombrePersonaje: "Hearthkeeper",tipoPersonaje: .sanador,  nivel: 5, ataque: 12, defensa: 20, agilidad: 15, fuerza: 12, hpMaximo: 175, monedas: 420, rachaActual: 20, totalBatallasGanadas: 22),
        Amigo(id: UUID(), nombre: "Diego F.",     nombrePersonaje: "Ironblood",   tipoPersonaje: .guerrero, nivel: 6, ataque: 28, defensa: 25, agilidad: 13, fuerza: 22, hpMaximo: 200, monedas: 560, rachaActual: 8, totalBatallasGanadas: 30),
        Amigo(id: UUID(), nombre: "Mariana C.",   nombrePersonaje: "Starbright",  tipoPersonaje: .mago,     nivel: 2, ataque: 16, defensa: 9,  agilidad: 14, fuerza: 11, hpMaximo: 105, monedas: 70, rachaActual: 1, totalBatallasGanadas: 2),
    ]
}
