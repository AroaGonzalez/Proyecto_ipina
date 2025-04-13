import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaCircle } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/edicionAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

// Mapeo de estados para asegurar compatibilidad entre backend y frontend
const ESTADO_MAPPING = {
  // Si el backend envía IDs numéricos, los mapeamos a strings
  '1': 'BORRADOR',
  '2': 'PRODUCCION',
  '3': 'PAUSADO',
  '0': 'ELIMINADO',
  // Texto directo para mayor flexibilidad
  'BORRADOR': 'BORRADOR',
  'PAUSADO': 'PAUSADO',
  'PRODUCCION': 'PRODUCCION',
  // Descripción completa que podría venir del backend
  'Borrador': 'BORRADOR',
  'Pausado': 'PAUSADO',
  'Producción': 'PRODUCCION'
};

const EdicionAlias = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alias, setAlias] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [ambitos, setAmbitos] = useState([]);

  // Estados para opciones de selección
  const [tiposAlias, setTiposAlias] = useState([]);
  const [idiomasDisponibles, setIdiomasDisponibles] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [mercados, setMercados] = useState([]);

  // Estados para valores seleccionados
  const [selectedTipoAlias, setSelectedTipoAlias] = useState('');
  const [selectedTipoConexion, setSelectedTipoConexion] = useState('');
  const [selectedEstacionalidad, setSelectedEstacionalidad] = useState('');
  const [selectedEstadoAlias, setSelectedEstadoAlias] = useState('');
  const [estadoDesc, setEstadoDesc] = useState(''); // Nuevo estado para guardar la descripción
  const [idiomasAliasValues, setIdiomasAliasValues] = useState({});
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState('');
  const [selectedCadena, setSelectedCadena] = useState('');
  const [selectedMercado, setSelectedMercado] = useState('');

  // Estados para dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Función para mapear el estado del alias
  const getEstadoNormalizado = (estadoId, estadoDesc) => {
    // Si tenemos un mapeo directo, lo usamos
    if (ESTADO_MAPPING[estadoId]) {
      return ESTADO_MAPPING[estadoId];
    }
    
    // Si tenemos la descripción, intentamos normalizarla
    if (estadoDesc) {
      const estadoUpperCase = estadoDesc.toUpperCase();
      if (estadoUpperCase.includes('BORRADOR')) return 'BORRADOR';
      if (estadoUpperCase.includes('PAUSADO')) return 'PAUSADO';
      if (estadoUpperCase.includes('PRODUCCION') || estadoUpperCase.includes('PRODUCCIÓN')) return 'PRODUCCION';
    }
    
    // Por defecto
    return 'PRODUCCION';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch alias details
        const aliasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}?idIdioma=${languageId}`);
        const aliasData = aliasResponse.data;
        setAlias(aliasData);

        // Guardar el ID y descripción del estado
        const estadoId = aliasData.idEstado;
        const estadoDescripcion = aliasData.estado;
        
        // Aquí normalizamos el estado para que coincida con nuestras opciones de UI
        const normalizedEstado = getEstadoNormalizado(estadoId, estadoDescripcion);
        console.log(`Estado del alias: ID=${estadoId}, Desc=${estadoDescripcion}, Normalizado=${normalizedEstado}`);
        
        // Set initial values
        setSelectedTipoAlias(aliasData.idTipoAlias || '');
        setSelectedTipoConexion(aliasData.idTipoConexion || 'PRINCIPAL');
        setSelectedEstacionalidad(aliasData.idEstacionalidad || '');
        setSelectedEstadoAlias(normalizedEstado); // Usamos el estado normalizado
        setEstadoDesc(estadoDescripcion || '');

        // Fetch alias articles
        const articulosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/articulos?idIdioma=${languageId}`);
        setArticulos(articulosResponse.data || []);

        // Fetch alias languages
        const idiomasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/idiomas?idIdioma=${languageId}`);
        const idiomasData = idiomasResponse.data || [];
        setIdiomas(idiomasData);

        // Create idiomas values map
        const idiomasValues = {};
        idiomasData.forEach(idioma => {
          idiomasValues[idioma.idIdioma] = {
            nombre: idioma.nombre || '',
            descripcion: idioma.descripcion || ''
          };
        });
        setIdiomasAliasValues(idiomasValues);

        // Fetch ambitos (cadenas, grupos y mercados)
        const ambitosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/ambitos?idIdioma=${languageId}`);
        setAmbitos(ambitosResponse.data || []);
        if (ambitosResponse.data && ambitosResponse.data.gruposCadena && ambitosResponse.data.gruposCadena.length > 0) {
          setSelectedGrupoCadena(ambitosResponse.data.gruposCadena[0].id);
        }
        if (ambitosResponse.data && ambitosResponse.data.cadenas && ambitosResponse.data.cadenas.length > 0) {
          setSelectedCadena(ambitosResponse.data.cadenas[0].id);
        }
        if (ambitosResponse.data && ambitosResponse.data.mercados && ambitosResponse.data.mercados.length > 0) {
          setSelectedMercado(ambitosResponse.data.mercados[0].id);
        }

        // Fetch selection options in parallel
        const [
          tiposAliasRes,
          idiomasDisponiblesRes,
          gruposCadenaRes,
          cadenasRes,
          mercadosRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/idiomas?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/cadenas?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/mercados?idIdioma=${languageId}`)
        ]);

        setTiposAlias(tiposAliasRes.data || []);
        setIdiomasDisponibles(idiomasDisponiblesRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setCadenas(cadenasRes.data || []);
        setMercados(mercadosRes.data || []);
      } catch (error) {
        console.error('Error fetching alias data:', error);
        setError('No se pudieron cargar los datos del alias');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, languageId]);

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleEstadoAliasChange = (estadoId) => {
    setSelectedEstadoAlias(estadoId);
  };

  const handleIdiomaAliasChange = (idiomaId, field, value) => {
    setIdiomasAliasValues(prev => ({
      ...prev,
      [idiomaId]: {
        ...prev[idiomaId],
        [field]: value
      }
    }));
  };

  const handleGrupoCadenaSelect = (grupoId) => {
    setSelectedGrupoCadena(grupoId);
    setOpenDropdown(null);
  };

  const handleCadenaSelect = (cadenaId) => {
    setSelectedCadena(cadenaId);
    setOpenDropdown(null);
  };

  const handleMercadoSelect = (mercadoId) => {
    setSelectedMercado(mercadoId);
    setOpenDropdown(null);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedAlias = {
        id: alias.id,
        idTipoAlias: selectedTipoAlias,
        idTipoConexion: selectedTipoConexion,
        idEstacionalidad: selectedEstacionalidad,
        idEstado: selectedEstadoAlias,
        idiomas: Object.keys(idiomasAliasValues).map(idIdioma => ({
          idIdioma,
          nombre: idiomasAliasValues[idIdioma].nombre,
          descripcion: idiomasAliasValues[idIdioma].descripcion
        })),
        ambitos: [{
          idGrupoCadena: selectedGrupoCadena,
          idCadena: selectedCadena,
          idMercado: selectedMercado
        }]
      };

      await axios.put(`${BASE_URL}/alias/${id}`, updatedAlias);
      navigate(-1);
    } catch (error) {
      console.error('Error saving alias:', error);
      setError('Error al guardar los cambios del alias');
    } finally {
      setLoading(false);
    }
  };

  const getIdiomaNombre = (idiomaId) => {
    const idioma = idiomasDisponibles.find(i => i.id === idiomaId);
    return idioma ? idioma.descripcion : idiomaId;
  };

  const getGrupoCadenaNombre = (grupoId) => {
    const grupo = gruposCadena.find(g => g.id === grupoId);
    return grupo ? `${grupoId} - ${grupo.descripcion}` : grupoId;
  };

  const getCadenaNombre = (cadenaId) => {
    const cadena = cadenas.find(c => c.id === cadenaId);
    return cadena ? `${cadenaId} - ${cadena.descripcion}` : cadenaId;
  };

  const getMercadoNombre = (mercadoId) => {
    const mercado = mercados.find(m => m.id === mercadoId);
    return mercado ? `${mercadoId} - ${mercado.descripcion}` : mercadoId;
  };

  if (loading) {
    return (
      <div className="edicion-alias-loading">
        <span>{t('Cargando datos del alias...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edicion-alias-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!alias) {
    return (
      <div className="edicion-alias-error">
        <span>{t('No se encontró el alias solicitado')}</span>
      </div>
    );
  }

  return (
    <div className="edicion-alias-container">
      <div className="edicion-alias-header">
        <h1 className="edicion-alias-title">
          {t('EDICIÓN DE ALIAS')} - {alias.id} / {alias.descripcion || alias.nombreAlias}
        </h1>
      </div>

      <div className="edicion-alias-content">
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 1')}</span> - <span className="paso-descripcion">{t('DATOS ALIAS')}</span> 
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <p className="section-description">{t('Cubre los campos para la descripción del alias.')}</p>
            
            <div className="simple-form-row">
              <div className="simple-form-group">
                <div className="simple-label">{t('Tipo de Alias')}</div>
                <div className="simple-value">Tipo Alias I</div>
              </div>
              
              <div className="simple-form-group">
                <div className="simple-label">{t('Tipo de conexión a origen')}</div>
                <div className="simple-value">PRINCIPAL</div>
              </div>
              
              <div className="simple-form-group">
                <div className="simple-label">{t('Estacionalidad')}</div>
                <div className="simple-value">Siempre</div>
              </div>
              
              <div className="estado-alias-group">
                <div className="simple-label">{t('Estado del alias')}</div>
                <div className="estado-buttons">
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'BORRADOR' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('BORRADOR')}
                  >
                    {t('BORRADOR')}
                  </button>
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'PAUSADO' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('PAUSADO')}
                  >
                    {t('PAUSADO')}
                  </button>
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'PRODUCCION' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('PRODUCCION')}
                  >
                    {t('PRODUCCIÓN')}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <p className="idiomas-description">{t('Añade los idiomas de los mercados donde se distribuirá este alias.')}</p>
            </div>
            
            <div className="form-row idiomas-dropdown-row">
              <div className="readonly-field idiomas-dropdown">
                <span>{idiomas.length} {t('seleccionados')}</span>
              </div>
            </div>
            
            <div className="idiomas-table-container">
              <div className="idiomas-count">{idiomas.length} {t('idiomas añadidos')}</div>
              <table className="idiomas-table">
                <thead>
                  <tr>
                    <th className="checkbox-column"></th>
                    <th>{t('IDIOMA')}</th>
                    <th>{t('ALIAS EN CADA IDIOMA*')}</th>
                    <th>{t('DESCRIPCIÓN DEL ALIAS*')}</th>
                  </tr>
                </thead>
                <tbody>
                  {idiomas.map(idioma => (
                    <tr key={idioma.idIdioma}>
                      <td className="checkbox-column">
                        <input type="checkbox" checked readOnly />
                      </td>
                      <td>{getIdiomaNombre(idioma.idIdioma)}</td>
                      <td>
                        <div className="editable-cell">
                          <input 
                            type="text" 
                            value={idiomasAliasValues[idioma.idIdioma]?.nombre || ''} 
                            onChange={(e) => handleIdiomaAliasChange(idioma.idIdioma, 'nombre', e.target.value)}
                          />
                          <FaTimes className="clear-input" />
                        </div>
                      </td>
                      <td>
                        <div className="editable-cell">
                          <input 
                            type="text" 
                            value={idiomasAliasValues[idioma.idIdioma]?.descripcion || ''} 
                            onChange={(e) => handleIdiomaAliasChange(idioma.idIdioma, 'descripcion', e.target.value)}
                          />
                          <FaTimes className="clear-input" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 2')}</span> - <span className="paso-descripcion">{t('ARTÍCULOS*')}</span>
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <p className="section-description">{t('Busca y añade los artículos que desea incluir en el alias.')}</p>
            
            <div className="search-bar-container">
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder={t('Buscar por id o nombre de artículo')} 
                />
                <FaChevronDown className="search-dropdown-arrow" />
              </div>
              
              <button className="add-button">{t('AÑADIR')}</button>
            </div>
            
            <div className="articulos-count">{articulos.length} {t('artículos añadidos')}</div>
            
            <div className="articulos-table-container">
              <table className="articulos-table">
                <thead>
                  <tr>
                    <th className="checkbox-column"></th>
                    <th>{t('ID ARTÍCULO')}</th>
                    <th>{t('ARTÍCULO')}</th>
                    <th>{t('UNIDADES BOX')}</th>
                    <th>{t('UNIDAD DE EMPAQUETADO')}</th>
                    <th>{t('MÚLTIPLO MÍNIMO')}</th>
                    <th>{t('ESTADO ARTÍCULO SPI')}</th>
                    <th>{t('ESTADO ARTÍCULO RAM')}</th>
                    <th>{t('ESTADO ARTÍCULO EN EL ALIAS')}</th>
                    <th>{t('FECHA DE ALTA')}</th>
                    <th>{t('ID SINT')}</th>
                  </tr>
                </thead>
                <tbody>
                  {articulos.map(articulo => (
                    <tr key={articulo.idAjeno || articulo.id}>
                      <td className="checkbox-column">
                        <input type="checkbox" checked readOnly />
                      </td>
                      <td>{articulo.idAjeno || articulo.id}</td>
                      <td className="articulo-name">{articulo.nombreAjeno || articulo.descripcion || articulo.nombre}</td>
                      <td>{articulo.unidadesBox || '-'}</td>
                      <td>{articulo.unidadEmpaquetado || articulo.unidadesMedida?.descripcion || 'UNIDAD'}</td>
                      <td className="text-center">{articulo.multiploMinimo || '1'}</td>
                      <td>
                        <span className="estado-tag activo">
                          {articulo.tipoEstadoCompras?.descripcion || 'ACTIVO'}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag activo">
                          {articulo.tipoEstadoRam?.descripcion || 'ACTIVO'}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag activo">
                          {articulo.descripcionTipoEstadoAliasAjenoRam || 'ACTIVO'}
                        </span>
                      </td>
                      <td>{articulo.fechaAlta || '2025-04-11'}</td>
                      <td>{articulo.idSint || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 3')}</span> - <span className="paso-descripcion">{t('DEFINICIÓN DEL ÁMBITO')}</span>
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <div className="form-row ambito-row">
              <div className="form-field ambito-field">
                <span className="ambito-label">{t('Tipo ámbito')}</span>
                <div className="ambito-value">
                  {t('Grupo cadena y mercado')}
                </div>
              </div>
              
              <div className="form-field grupo-cadena-field">
                <label>{t('Id o Grupo Cadena (TG)*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('grupoCadena')}>
                  <span>{getGrupoCadenaNombre(selectedGrupoCadena)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'grupoCadena' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {gruposCadena
                          .filter(grupo => 
                            searchText === '' || 
                            grupo.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            grupo.id.toString().includes(searchText)
                          )
                          .map(grupo => (
                            <div 
                              key={grupo.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGrupoCadenaSelect(grupo.id, grupo.descripcion);
                              }}
                            >
                              {grupo.id} - {grupo.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-field cadena-field">
                <label>{t('Id o Cadena*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('cadena')}>
                  <span>{getCadenaNombre(selectedCadena)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'cadena' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {cadenas
                          .filter(cadena => 
                            searchText === '' || 
                            cadena.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            cadena.id.toString().includes(searchText)
                          )
                          .map(cadena => (
                            <div 
                              key={cadena.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCadenaSelect(cadena.id, cadena.descripcion);
                              }}
                            >
                              {cadena.id} - {cadena.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-field mercado-field">
                <label>{t('Id o Mercado*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('mercado')}>
                  <span>{getMercadoNombre(selectedMercado)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'mercado' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {mercados
                          .filter(mercado => 
                            searchText === '' || 
                            mercado.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            mercado.id.toString().includes(searchText)
                          )
                          .map(mercado => (
                            <div 
                              key={mercado.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMercadoSelect(mercado.id, mercado.descripcion);
                              }}
                            >
                              {mercado.id} - {mercado.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ambitos-table-container">
              <table className="ambitos-table">
                <thead>
                  <tr>
                    <th>{t('ID/GRUPO CADENA')}</th>
                    <th>{t('ID/CADENA')}</th>
                    <th>{t('MERCADO')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ambitos && ambitos.gruposCadena && ambitos.gruposCadena.length > 0 ? (
                    ambitos.gruposCadena.map((grupo, index) => {
                      const cadena = ambitos.cadenas && ambitos.cadenas.length > index ? ambitos.cadenas[index] : null;
                      const mercado = ambitos.mercados && ambitos.mercados.length > index ? ambitos.mercados[index] : null;
                      return (
                        <tr key={index}>
                          <td>{getGrupoCadenaNombre(grupo.id)}</td>
                          <td>{cadena ? getCadenaNombre(cadena.id) : '-'}</td>
                          <td className="mercado-column">
                            {mercado && mercado.codigoIsoMercado && (
                              <span className="mercado-flag">
                                {mercado.codigoIsoMercado === 'ES' ? '🇪🇸' : 
                                 mercado.codigoIsoMercado === 'FR' ? '🇫🇷' : '🌐'}
                              </span>
                            )}
                            <span>{mercado ? getMercadoNombre(mercado.id) : '-'}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td>{getGrupoCadenaNombre(selectedGrupoCadena)}</td>
                      <td>{getCadenaNombre(selectedCadena)}</td>
                      <td className="mercado-column">
                        <span className="mercado-flag">🇪🇸</span>
                        <span>{getMercadoNombre(selectedMercado)}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="edicion-alias-actions">
        <button className="cancel-button" onClick={handleCancel}>
          {t('CANCELAR')}
        </button>
        <button className="save-button" onClick={handleSave}>
          {t('GUARDAR')}
        </button>
      </div>
    </div>
  );
};

export default EdicionAlias;