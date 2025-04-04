import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt, FaSearch, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/consultaTienda.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ConsultaTienda = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [dataRequested, setDataRequested] = useState(false);
  const [error, setError] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(true); // Mostrar filtros por defecto
  const [totalElements, setTotalElements] = useState(0);

  // Estados para opciones de filtro
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);

  // Estados para los filtros
  const [filtroMercado, setFiltroMercado] = useState('');
  const [filtroLocalizacion, setFiltroLocalizacion] = useState('');
  const [filtroGrupoCadena, setFiltroGrupoCadena] = useState('');
  const [filtroCadena, setFiltroCadena] = useState('');
  
  // Cargar opciones de filtro al iniciar el componente
  useEffect(() => {
    fetchFilterOptions();
  }, [languageId]);

  // Función para cargar datos de filtros
  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      // Solo cargar mercados y grupos cadena, las cadenas se cargarán bajo demanda
      const [mercadosRes, gruposCadenaRes] = await Promise.all([
        axios.get(`${BASE_URL}/tiendas/mercados?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/tiendas/grupos-cadena?idIdioma=${languageId}`)
      ]);
      
      setMercados(mercadosRes.data || []);
      setGruposCadena(gruposCadenaRes.data || []);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Cargar cadenas cuando se selecciona un grupo cadena
  useEffect(() => {
    if (filtroGrupoCadena) {
      const fetchCadenas = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/tiendas/cadenas?idGrupoCadena=${filtroGrupoCadena}&idIdioma=${languageId}`
          );
          setCadenas(response.data || []);
        } catch (error) {
          console.error('Error al cargar cadenas:', error);
        }
      };
      fetchCadenas();
    } else {
      setCadenas([]);
      setFiltroCadena('');
    }
  }, [filtroGrupoCadena, languageId]);

  // Función para cargar tiendas con paginación
  const fetchTiendas = async (filters = {}) => {
    setLoading(true);
    setError(null);
    setDataRequested(true);
    
    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('idIdioma', languageId);
      params.append('page', 0); // Primera página
      params.append('size', 50); // Limitar a 50 registros por página
      
      if (filters.idsMercado) params.append('idsMercado', filters.idsMercado);
      if (filters.idsGrupoCadena) params.append('idsGrupoCadena', filters.idsGrupoCadena);
      if (filters.idsCadena) params.append('idsCadena', filters.idsCadena);
      if (filters.idLocalizacion) params.append('idLocalizacion', filters.idLocalizacion);
      
      const response = await axios.get(`${BASE_URL}/tiendas?${params.toString()}`);
      
      if (response.data && response.data.content) {
        // Procesamos los datos para garantizar que estadoTiendaMtu nunca sea null
        const processedData = response.data.content.map(item => ({
          ...item,
          estadoTiendaMtu: item.estadoTiendaMtu || 'Sin estado'
        }));
        
        setTiendas(processedData);
        setTotalElements(response.data.totalElements || 0);
        
        // Debug
        console.log('Respuesta API:', response.data);
        if (processedData.length > 0) {
          console.log('Primer elemento procesado:', processedData[0]);
        }
      } else {
        setTiendas([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setError(t('No se pudieron cargar las tiendas'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(tiendas.map((item) => item.idLocalizacionRam));
    }
    setSelectAll(!selectAll);
  };

  const getEstadoClass = (estado) => {
    if (!estado || estado === 'Sin estado') return 'estado-desconocido';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('activ')) return 'estado-activa';
    if (estadoLower.includes('reform')) return 'estado-reforma';
    if (estadoLower.includes('abiert')) return 'estado-abierta';
    if (estadoLower.includes('cerrad')) return 'estado-cerrada';
    return 'estado-otro';
  };

  const handleSearch = () => {
    // Construir objeto de filtros
    const filters = {};
    
    if (filtroMercado) filters.idsMercado = filtroMercado;
    if (filtroGrupoCadena) filters.idsGrupoCadena = filtroGrupoCadena;
    if (filtroCadena) filters.idsCadena = filtroCadena;
    if (filtroLocalizacion) filters.idLocalizacion = filtroLocalizacion;
    
    // Buscar tiendas con los filtros
    fetchTiendas(filters);
  };

  const handleDownload = () => {
    alert(t('Función de descarga en desarrollo'));
  };

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // CSS dinámico para los filtros
  const filterContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '20px'
  };

  const filterGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 200px'
  };

  const filterLabelStyle = {
    fontSize: '14px',
    marginBottom: '5px'
  };

  const filterSelectStyle = {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  };

  return (
    <div className="consulta-tienda-container">
      <div className="header">
        <h1 className="main-title">{t('CONSULTA TIENDA')}</h1>
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
        </button>
      </div>

      {showFilters && (
        <div style={filterContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Id o Mercado</label>
            <select 
              style={filterSelectStyle}
              value={filtroMercado}
              onChange={(e) => setFiltroMercado(e.target.value)}
              disabled={loadingFilters}
            >
              <option value="">Seleccionar</option>
              {mercados.map(mercado => (
                <option key={mercado.id} value={mercado.id}>
                  {mercado.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Id Localización</label>
            <input 
              style={filterSelectStyle}
              type="text" 
              value={filtroLocalizacion}
              onChange={(e) => setFiltroLocalizacion(e.target.value)}
              placeholder=""
            />
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Id o Grupo Cadena (T6)</label>
            <select 
              style={filterSelectStyle}
              value={filtroGrupoCadena}
              onChange={(e) => setFiltroGrupoCadena(e.target.value)}
              disabled={loadingFilters}
            >
              <option value="">Seleccionar</option>
              {gruposCadena.map(grupo => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Id o Cadena</label>
            <select 
              style={filterSelectStyle}
              value={filtroCadena}
              onChange={(e) => setFiltroCadena(e.target.value)}
              disabled={!filtroGrupoCadena || loadingFilters}
            >
              <option value="">Seleccionar</option>
              {cadenas.map(cadena => (
                <option key={cadena.id} value={cadena.id}>
                  {cadena.descripcion}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="results-info">
        <span className="results-count">
          {loading ? t('Cargando...') : dataRequested 
            ? t('Cargados {{count}} resultados de {{total}} encontrados', {
                count: tiendas.length,
                total: totalElements
              })
            : t('Utilice los filtros para buscar tiendas')
          }
        </span>
        <div className="update-info">
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </div>
        <button className="download-button" onClick={handleDownload}>
          <FaDownload />
          <span>{t('DESCARGAR')}</span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div style={{marginTop: '10px', marginBottom: '20px', textAlign: 'right'}}>
        <button 
          className="buscar-button" 
          style={{
            padding: '8px 20px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={handleSearch}
          disabled={loading}
        >
          <FaSearch style={{marginRight: '8px'}} />
          <span>{t('BUSCAR')}</span>
        </button>
      </div>

      <div className="table-container">
        <table className="tiendas-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  checked={selectAll} 
                  onChange={handleSelectAll} 
                  disabled={tiendas.length === 0}
                />
              </th>
              <th>{t('CÓDIGO DE TIENDA')}</th>
              <th>{t('TIENDA')}</th>
              <th>{t('MERCADO')}</th>
              <th>{t('GRUPO CADENA')}</th>
              <th>{t('CADENA')}</th>
              <th>{t('ESTADO DE TIENDA MTU')}</th>
              <th>{t('ESTADO DE TIENDA RAM')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">
                  {t('Cargando datos...')}
                </td>
              </tr>
            ) : !dataRequested ? (
              <tr>
                <td colSpan="8" className="instruction-cell">
                  {t('Utilice los filtros para buscar tiendas')}
                </td>
              </tr>
            ) : tiendas.length > 0 ? (
              tiendas.map((tienda) => (
                <tr key={tienda.idLocalizacionRam || tienda.codigoTienda}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(tienda.idLocalizacionRam)} 
                      onChange={() => handleSelectItem(tienda.idLocalizacionRam)} 
                    />
                  </td>
                  <td>{tienda.codigoTienda}</td>
                  <td>{tienda.nombreTienda}</td>
                  <td>
                    <div className="mercado-cell">
                      <span className="flag">
                        {tienda.codigoIsoMercado === 'ES' ? `🇪🇸` : (
                          tienda.codigoIsoMercado === 'AR' ? `🇦🇷` : ''
                        )}
                      </span>
                      <span>{tienda.nombreMercado}</span>
                    </div>
                  </td>
                  <td>{tienda.nombreGrupoCadena}</td>
                  <td>{tienda.nombreCadena}</td>
                  <td>
                    <span className={`estado-tag ${getEstadoClass(tienda.estadoTiendaMtu)}`}>
                      {tienda.estadoTiendaMtu}
                    </span>
                  </td>
                  <td>
                    <span className={`estado-tag ${getEstadoClass(tienda.descripcionTipoEstadoLocalizacionRam)}`}>
                      {tienda.descripcionTipoEstadoLocalizacionRam || ''}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-table-message">
                  {t('No hay datos disponibles')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsultaTienda;