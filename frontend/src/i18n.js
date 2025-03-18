import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage = localStorage.getItem('appLanguage') || 'es';
console.log('i18n inicializado con idioma:', savedLanguage);

const resources = {
  en: {
    translation: {
        "INICIO": "HOME",
        "PARAMETRIZACIÓN": "PARAMETERS",
        "TAREAS": "TASKS",
        "EVENTOS": "EVENTS",
        "PROPUESTAS": "PROPOSALS",
        "RECUENTOS": "COUNTS",
        "Mi Perfil": "My Profile",
        "Cerrar Sesión": "Logout",
        "CONSULTA DE ARTÍCULOS": "ARTICLE QUERY",
        "MOSTRAR FILTROS": "SHOW FILTERS",
        "NUEVO ARTÍCULO": "NEW ARTICLE",
        "change_password": "Change Password",
        "current_password": "Current Password",
        "new_password": "New Password",
        "update_password": "Update Password",
        "cancel": "Cancel",
        "error_password_change": "Error changing password.",
        "loading_stats": "Loading statistics...",
        "welcome_title": "Welcome to Inventory Management",
        "welcome_subtitle": "Optimize your resources, manage your orders and keep your operations up to date.",
        "pending_orders": "Pending Orders",
        "inventory_products": "Products in Inventory",
        "registered_stores": "Registered Stores",
        "manage_orders": "Manage Orders",
        "view_inventory": "View Inventory",
        "query_stores": "Query Stores",
        "CONSULTA DE ARTÍCULOS": "ARTICLE QUERY",
        "OCULTAR FILTROS": "HIDE FILTERS",
        "MOSTRAR FILTROS": "SHOW FILTERS",
        "NUEVO ARTÍCULO": "NEW ARTICLE",
        "Id Artículo": "Article ID",
        "BUSCAR": "SEARCH",
        "Cargados {{count}} resultados de {{total}} encontrados": "Loaded {{count}} results out of {{total}} found",
        "Última actualización": "Last update",
        "Seleccionados {{count}} resultados de {{total}}": "Selected {{count}} results out of {{total}}",
        "ACTIVAR": "ACTIVATE",
        "PAUSAR": "PAUSE",
        "ID ARTÍCULO": "ARTICLE ID",
        "ARTÍCULO": "ARTICLE",
        "ESTADO RAM": "RAM STATUS",
        "UNIDADES BOX": "BOX UNITS",
        "UNIDAD DE EMPAQUETADO": "PACKAGING UNIT",
        "MÚLTIPLO MÍNIMO": "MINIMUM MULTIPLE",
        "ESTADO SFI": "SFI STATUS",
        "session_required": "You must log in to access this page",
        "session_expired": "Your session has expired, please log in again",
        "invalid_token": "Invalid token",
        "CREATE AN ACCOUNT TO ACCESS THE SYSTEM": "CREATE AN ACCOUNT TO ACCESS THE SYSTEM",
        "REGISTRANDO...": "REGISTERING...",
        "BACK TO LOGIN": "BACK TO LOGIN",        
        "register": {
          "title": "REGISTER",
          "username": "Username",
          "password": "Password",
          "submit_button": "REGISTER",
          "success_message": "User registered successfully",
          "user_exists": "Username already exists",
          "error_message": "Error registering user"
        },
        "Mi Perfil": "My Profile",
        "Cerrar Sesión": "Logout",
        "WELCOME TO RAM": "WELCOME TO RAM",
        "SIGN IN WITH YOUR EMAIL OR USER ACCOUNT": "SIGN IN WITH YOUR EMAIL OR USER ACCOUNT",
        "Username": "Username",
        "Password": "Password",
        "SIGN IN": "SIGN IN",
        "REGISTER": "REGISTER",
        "FORGOT YOUR PASSWORD?": "FORGOT YOUR PASSWORD?",
        "INICIANDO...": "SIGNING IN...",
        "PARAMETERS": "PARAMETERS",
        "Parametrización de artículos": "Article Configuration",
        "Consulta de tienda": "Store Query",
        "Consulta y nuevo Alias": "Query and New Alias",
        "Consulta stocks": "Stock Query",
    }
  },
  es: {
    translation: {
        "change_password": "Cambiar Contraseña",
        "current_password": "Contraseña Actual",
        "new_password": "Nueva Contraseña",
        "update_password": "Actualizar Contraseña",
        "cancel": "Cancelar",
        "error_password_change": "Error al cambiar la contraseña.",
        "loading_stats": "Cargando estadísticas...",
        "welcome_title": "Bienvenido a la Gestión de Inventarios",
        "welcome_subtitle": "Optimiza tus recursos, administra tus pedidos y mantén tus operaciones al día.",
        "pending_orders": "Pedidos Pendientes",
        "inventory_products": "Productos en Inventario",
        "registered_stores": "Tiendas Registradas",
        "manage_orders": "Gestionar Pedidos",
        "view_inventory": "Ver Inventario",
        "query_stores": "Consultar Tiendas",
        "session_required": "Debes iniciar sesión para acceder a esta página",
        "session_expired": "Tu sesión ha caducado, por favor inicia sesión de nuevo",
        "invalid_token": "Token inválido",
        "CREATE AN ACCOUNT TO ACCESS THE SYSTEM": "CREA UNA CUENTA PARA ACCEDER AL SISTEMA",
        "REGISTRANDO...": "REGISTRANDO...",
        "BACK TO LOGIN": "VOLVER AL INICIO DE SESIÓN",
        "register": {
          "title": "REGISTRO",
          "username": "Usuario",
          "password": "Contraseña",
          "submit_button": "REGISTRARSE",
          "success_message": "Usuario registrado correctamente",
          "user_exists": "El nombre de usuario ya existe",
          "error_message": "Error al registrar usuario"
        },
        "WELCOME TO RAM": "BIENVENIDO A RAM",
        "SIGN IN WITH YOUR EMAIL OR USER ACCOUNT": "INICIA SESIÓN CON TU EMAIL O CUENTA DE USUARIO",
        "Username": "Usuario",
        "Password": "Contraseña",
        "SIGN IN": "INICIAR SESIÓN",
        "REGISTER": "REGISTRARSE",
        "FORGOT YOUR PASSWORD?": "¿OLVIDASTE TU CONTRASEÑA?",
        "PARAMETERS": "PARÁMETROS",
        "Parametrización de artículos": "Parametrización de artículos",
        "Consulta de tienda": "Consulta de tienda",
        "Consulta y nuevo Alias": "Consulta y nuevo Alias",
        "Consulta stocks": "Consulta stocks",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('appLanguage') || 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;