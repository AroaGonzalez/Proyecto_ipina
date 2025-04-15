const handleRemoveAmbito = (ambitoId) => {
  setAmbitosTable(prev => prev.filter(a => a.id !== ambitoId));
  setSelectedAmbitos(prev => prev.filter(id => id !== ambitoId));
};import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaCircle, FaSearch, FaCheck, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/edicionAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ESTADO_MAPPING = {
'1': 'BORRADOR',
'2': 'PRODUCCION',
'3': 'PAUSADO',
'0': 'ELIMINADO',
'BORRADOR': 'BORRADOR',
'PAUSADO': 'PAUSADO',
'PRODUCCION': 'PRODUCCION',
'Borrador': 'BORRADOR',
'Pausado': 'PAUSADO',
'Producción': 'PRODUCCION'
};

const EdicionAlias = () => {
const { id } = useParams();
const navigate = useNavigate();
const { t } = useTranslation();
const { languageId } = useContext(LanguageContext);
const dropdownRef = useRef(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [alias, setAlias] = useState(null);
const [articulos, setArticulos] = useState([]);
const [articulosDisponibles, setArticulosDisponibles] = useState([]);
const [idiomas, setIdiomas] = useState([]);
const [ambitosData, setAmbitosData] = useState({});
const [tiposAlias, setTiposAlias] = useState([]);
const [idiomasDisponibles, setIdiomasDisponibles] = useState([]);
const [gruposCadenaDisponibles, setGruposCadenaDisponibles] = useState([]);
const [cadenasDisponibles, setCadenasDisponibles] = useState([]);
const [mercadosDisponibles, setMercadosDisponibles] = useState([]);
const [selectedTipoAlias, setSelectedTipoAlias] = useState('');
const [selectedTipoConexion, setSelectedTipoConexion] = useState('');
const [selectedEstacionalidad, setSelectedEstacionalidad] = useState('');
const [selectedEstadoAlias, setSelectedEstadoAlias] = useState('');
const [estadoDesc, setEstadoDesc] = useState('');
const [idiomasAliasValues, setIdiomasAliasValues] = useState({});
const [selectedGrupoCadena, setSelectedGrupoCadena] = useState('');
const [selectedCadena, setSelectedCadena] = useState('');
const [selectedMercado, setSelectedMercado] = useState('');
const [selectedIdiomas, setSelectedIdiomas] = useState([]);
const [openDropdown, setOpenDropdown] = useState(null);
const [searchText, setSearchText] = useState('');
const [checkAll, setCheckAll] = useState(false);
const [checkAllArticulos, setCheckAllArticulos] = useState(false);
const [filteredArticulos, setFilteredArticulos] = useState([]);
const [articuloSearchText, setArticuloSearchText] = useState('');
const [isArticulosDropdownOpen, setIsArticulosDropdownOpen] = useState(false);
const [ambitosTable, setAmbitosTable] = useState([]);
const [selectedAmbitos, setSelectedAmbitos] = useState([]);

// Estados para filtros de ámbito
const [grupoSearchText, setGrupoSearchText] = useState('');
const [cadenaSearchText, setCadenaSearchText] = useState('');
const [mercadoSearchText, setMercadoSearchText] = useState('');
const [filteredGruposCadena, setFilteredGruposCadena] = useState([]);
const [filteredCadenas, setFilteredCadenas] = useState([]);
const [filteredMercados, setFilteredMercados] = useState([]);
const [isGrupoCadenaDropdownOpen, setIsGrupoCadenaDropdownOpen] = useState(false);
const [isCadenaDropdownOpen, setIsCadenaDropdownOpen] = useState(false);
const [isMercadoDropdownOpen, setIsMercadoDropdownOpen] = useState(false);
const [ambitoToAdd, setAmbitoToAdd] = useState({
  grupoCadena: null,
  cadena: null,
  mercado: null
});

// Función para ejecutar handleAddAmbito después de actualizar el estado
const updateAmbitoAndCheck = (newAmbito, callback) => {
  setAmbitoToAdd(newAmbito);
  // Usamos setTimeout para asegurar que el estado se ha actualizado
  setTimeout(() => {
    if (newAmbito.grupoCadena && newAmbito.cadena && newAmbito.mercado) {
      handleAddAmbito();
    }
    if (callback) callback();
  }, 0);
};

// Refs para detectar clicks fuera de los dropdowns
const grupoCadenaDropdownRef = useRef(null);
const cadenaDropdownRef = useRef(null);
const mercadoDropdownRef = useRef(null);
const articulosDropdownRef = useRef(null);

useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setOpenDropdown(null);
    }
    if (articulosDropdownRef.current && !articulosDropdownRef.current.contains(event.target)) {
      setIsArticulosDropdownOpen(false);
    }
    if (grupoCadenaDropdownRef.current && !grupoCadenaDropdownRef.current.contains(event.target)) {
      setIsGrupoCadenaDropdownOpen(false);
    }
    if (cadenaDropdownRef.current && !cadenaDropdownRef.current.contains(event.target)) {
      setIsCadenaDropdownOpen(false);
    }
    if (mercadoDropdownRef.current && !mercadoDropdownRef.current.contains(event.target)) {
      setIsMercadoDropdownOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

const getEstadoNormalizado = (estadoId, estadoDesc) => {
  if (ESTADO_MAPPING[estadoId]) {
    return ESTADO_MAPPING[estadoId];
  }
  
  if (estadoDesc) {
    const estadoUpperCase = estadoDesc.toUpperCase();
    if (estadoUpperCase.includes('BORRADOR')) return 'BORRADOR';
    if (estadoUpperCase.includes('PAUSADO')) return 'PAUSADO';
    if (estadoUpperCase.includes('PRODUCCION') || estadoUpperCase.includes('PRODUCCIÓN')) return 'PRODUCCION';
  }
  
  return 'PRODUCCION';
};

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const aliasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}?idIdioma=${languageId}`);
      const aliasData = aliasResponse.data;
      setAlias(aliasData);

      const estadoId = aliasData.idEstado;
      const estadoDescripcion = aliasData.estado;
      
      const normalizedEstado = getEstadoNormalizado(estadoId, estadoDescripcion);
      console.log(`Estado del alias: ID=${estadoId}, Desc=${estadoDescripcion}, Normalizado=${normalizedEstado}`);
      
      setSelectedTipoAlias(aliasData.idTipoAlias || '');
      setSelectedTipoConexion(aliasData.idTipoConexion || 'PRINCIPAL');
      setSelectedEstacionalidad(aliasData.idEstacionalidad || '');
      setSelectedEstadoAlias(normalizedEstado);
      setEstadoDesc(estadoDescripcion || '');

      const articulosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/articulos?idIdioma=${languageId}`);
      setArticulos(articulosResponse.data || []);

      const idiomasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/idiomas?idIdioma=${languageId}`);
      const idiomasData = idiomasResponse.data || [];
      setIdiomas(idiomasData);
      setSelectedIdiomas(idiomasData.map(i => i.idIdioma));

      const idiomasValues = {};
      idiomasData.forEach(idioma => {
        idiomasValues[idioma.idIdioma] = {
          nombre: idioma.nombre || '',
          descripcion: idioma.descripcion || ''
        };
      });
      setIdiomasAliasValues(idiomasValues);

      const ambitosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/ambitos?idIdioma=${languageId}`);
      setAmbitosData(ambitosResponse.data || {});
      
      const generatedAmbitosTable = [];
      
      // Si hay datos de ámbitos, construimos la tabla combinando los datos
      if (ambitosResponse.data && 
          ambitosResponse.data.gruposCadena && 
          ambitosResponse.data.cadenas && 
          ambitosResponse.data.mercados) {
          
        const { gruposCadena, cadenas, mercados } = ambitosResponse.data;
        
        // Para cada mercado, vamos a crear una combinación con cada cadena
        mercados.forEach(mercado => {
          cadenas.forEach(cadena => {
            // Encontramos el grupo cadena relacionado con esta cadena
            const grupoCadena = gruposCadena.find(g => g.id === cadena.idGrupoCadena) || gruposCadena[0];
            
            if (grupoCadena) {
              generatedAmbitosTable.push({
                id: `${grupoCadena.id}-${cadena.id}-${mercado.id}`,
                grupoCadena: {
                  id: grupoCadena.id,
                  descripcion: grupoCadena.descripcion
                },
                cadena: {
                  id: cadena.id,
                  descripcion: cadena.descripcion
                },
                mercado: {
                  id: mercado.id,
                  descripcion: mercado.descripcion,
                  codigoIsoMercado: mercado.codigoIsoMercado
                }
              });
            }
          });
        });
      }
      
      setAmbitosTable(generatedAmbitosTable);
      setSelectedAmbitos(generatedAmbitosTable.map(a => a.id));

      // Si tenemos datos iniciales de ámbitos, establecemos los valores seleccionados
      if (ambitosResponse.data) {
        if (ambitosResponse.data.gruposCadena && ambitosResponse.data.gruposCadena.length > 0) {
          setSelectedGrupoCadena(ambitosResponse.data.gruposCadena[0].id);
          setAmbitoToAdd(prev => ({
            ...prev,
            grupoCadena: ambitosResponse.data.gruposCadena[0]
          }));
        }
        
        if (ambitosResponse.data.cadenas && ambitosResponse.data.cadenas.length > 0) {
          setSelectedCadena(ambitosResponse.data.cadenas[0].id);
          setAmbitoToAdd(prev => ({
            ...prev,
            cadena: ambitosResponse.data.cadenas[0]
          }));
        }
        
        if (ambitosResponse.data.mercados && ambitosResponse.data.mercados.length > 0) {
          setSelectedMercado(ambitosResponse.data.mercados[0].id);
          setAmbitoToAdd(prev => ({
            ...prev,
            mercado: ambitosResponse.data.mercados[0]
          }));
        }
      }

      const [
        tiposAliasRes,
        idiomasDisponiblesRes,
        gruposCadenaRes,
        cadenasRes,
        mercadosRes,
        articulosDisponiblesRes
      ] = await Promise.all([
        axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/edicion/idiomas?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/edicion/grupos-cadena?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/edicion/cadenas?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/edicion/mercados?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/edicion/all?idIdioma=${languageId}`)
      ]);

      setTiposAlias(tiposAliasRes.data || []);
      setIdiomasDisponibles(idiomasDisponiblesRes.data || []);
      
      const gruposCadena = gruposCadenaRes.data || [];
      setGruposCadenaDisponibles(gruposCadena);
      setFilteredGruposCadena(gruposCadena);
      
      const cadenas = cadenasRes.data || [];
      setCadenasDisponibles(cadenas);
      setFilteredCadenas(cadenas);
      
      const mercados = mercadosRes.data || [];
      setMercadosDisponibles(mercados);
      setFilteredMercados(mercados);
      
      setArticulosDisponibles(articulosDisponiblesRes.data || []);
      setFilteredArticulos(articulosDisponiblesRes.data || []);
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
  setSearchText('');
};

const handleSearchChange = (e) => {
  setSearchText(e.target.value);
  
  if (openDropdown === 'articulos') {
    const searchValue = e.target.value.toLowerCase();
    const filtered = articulosDisponibles.filter(
      articulo => 
        articulo.idAjeno?.toString().toLowerCase().includes(searchValue) || 
        articulo.nombreAjeno?.toLowerCase().includes(searchValue)
    );
    setFilteredArticulos(filtered);
  }
};

const handleArticuloSearchChange = (e) => {
  const value = e.target.value;
  setArticuloSearchText(value);
  
  if (value) {
    const searchValue = value.toLowerCase();
    const filtered = articulosDisponibles.filter(
      articulo => 
        articulo.idAjeno?.toString().toLowerCase().includes(searchValue) || 
        articulo.nombreAjeno?.toLowerCase().includes(searchValue)
    );
    setFilteredArticulos(filtered);
  } else {
    setFilteredArticulos(articulosDisponibles);
  }
};

const handleGrupoSearchChange = (e) => {
  const value = e.target.value;
  setGrupoSearchText(value);
  
  if (value) {
    const searchValue = value.toLowerCase();
    const filtered = gruposCadenaDisponibles.filter(
      grupo => 
        grupo.id?.toString().toLowerCase().includes(searchValue) || 
        grupo.descripcion?.toLowerCase().includes(searchValue)
    );
    setFilteredGruposCadena(filtered);
  } else {
    setFilteredGruposCadena(gruposCadenaDisponibles);
  }
};

const handleCadenaSearchChange = (e) => {
  const value = e.target.value;
  setCadenaSearchText(value);
  
  if (value) {
    const searchValue = value.toLowerCase();
    const filtered = cadenasDisponibles.filter(
      cadena => 
        cadena.id?.toString().toLowerCase().includes(searchValue) || 
        cadena.descripcion?.toLowerCase().includes(searchValue)
    );
    setFilteredCadenas(filtered);
  } else {
    setFilteredCadenas(cadenasDisponibles);
  }
};

const handleMercadoSearchChange = (e) => {
  const value = e.target.value;
  setMercadoSearchText(value);
  
  if (value) {
    const searchValue = value.toLowerCase();
    const filtered = mercadosDisponibles.filter(
      mercado => 
        mercado.id?.toString().toLowerCase().includes(searchValue) || 
        mercado.descripcion?.toLowerCase().includes(searchValue)
    );
    setFilteredMercados(filtered);
  } else {
    setFilteredMercados(mercadosDisponibles);
  }
};

const toggleArticulosDropdown = () => {
  setIsArticulosDropdownOpen(!isArticulosDropdownOpen);
  setIsGrupoCadenaDropdownOpen(false);
  setIsCadenaDropdownOpen(false);
  setIsMercadoDropdownOpen(false);
  if (!isArticulosDropdownOpen) {
    setArticuloSearchText('');
    setFilteredArticulos(articulosDisponibles);
  }
};

const toggleGrupoCadenaDropdown = () => {
  setIsGrupoCadenaDropdownOpen(!isGrupoCadenaDropdownOpen);
  setIsCadenaDropdownOpen(false);
  setIsMercadoDropdownOpen(false);
  setIsArticulosDropdownOpen(false);
  if (!isGrupoCadenaDropdownOpen) {
    setGrupoSearchText('');
    setFilteredGruposCadena(gruposCadenaDisponibles);
  }
};

const toggleCadenaDropdown = () => {
  setIsCadenaDropdownOpen(!isCadenaDropdownOpen);
  setIsGrupoCadenaDropdownOpen(false);
  setIsMercadoDropdownOpen(false);
  setIsArticulosDropdownOpen(false);
  if (!isCadenaDropdownOpen) {
    setCadenaSearchText('');
    setFilteredCadenas(cadenasDisponibles);
  }
};

const toggleMercadoDropdown = () => {
  setIsMercadoDropdownOpen(!isMercadoDropdownOpen);
  setIsGrupoCadenaDropdownOpen(false);
  setIsCadenaDropdownOpen(false);
  setIsArticulosDropdownOpen(false);
  if (!isMercadoDropdownOpen) {
    setMercadoSearchText('');
    setFilteredMercados(mercadosDisponibles);
  }
};

const clearArticuloSearch = () => {
  setArticuloSearchText('');
  setFilteredArticulos(articulosDisponibles);
};

const clearGrupoSearch = () => {
  setGrupoSearchText('');
  setFilteredGruposCadena(gruposCadenaDisponibles);
};

const clearCadenaSearch = () => {
  setCadenaSearchText('');
  setFilteredCadenas(cadenasDisponibles);
};

const clearMercadoSearch = () => {
  setMercadoSearchText('');
  setFilteredMercados(mercadosDisponibles);
};

const handleSelectAllArticulos = () => {
  const newCheckAllArticulos = !checkAllArticulos;
  setCheckAllArticulos(newCheckAllArticulos);
  
  if (newCheckAllArticulos) {
    const articulosToAdd = filteredArticulos.filter(
      articulo => !articulos.some(a => a.idAjeno === articulo.idAjeno)
    );
    
    if (articulosToAdd.length > 0) {
      setArticulos(prev => [...prev, ...articulosToAdd]);
    }
  } else {
    const filteredIds = filteredArticulos.map(a => a.idAjeno);
    setArticulos(prev => prev.filter(a => !filteredIds.includes(a.idAjeno)));
  }
};

const handleGrupoCadenaSelect = (grupo) => {
  // Comprobamos si este grupo ya está en algún ámbito
  const existingAmbitos = ambitosTable.filter(
    ambito => ambito.grupoCadena.id === grupo.id && selectedAmbitos.includes(ambito.id)
  );
  
  // Si existe algún ámbito con este grupo, los quitamos todos y retornamos
  if (existingAmbitos.length > 0) {
    existingAmbitos.forEach(ambito => {
      removeAmbitoIfExists(grupo.id, null, null);
    });
    return;
  }
  
  // Nuevo valor a establecer
  const newAmbitoToAdd = {
    ...ambitoToAdd,
    grupoCadena: grupo
  };
  
  setSelectedGrupoCadena(grupo.id);
  setAmbitoToAdd(newAmbitoToAdd);
  
  // Verificamos si tenemos todos los campos con los nuevos valores
  if (newAmbitoToAdd.cadena && newAmbitoToAdd.mercado) {
    addAmbitoWithValues(newAmbitoToAdd);
  }
};

const handleCadenaSelect = (cadena) => {
  // Comprobamos si esta cadena ya está en algún ámbito
  const existingAmbitos = ambitosTable.filter(
    ambito => ambito.cadena.id === cadena.id && selectedAmbitos.includes(ambito.id)
  );
  
  // Si existe algún ámbito con esta cadena, los quitamos todos y retornamos
  if (existingAmbitos.length > 0) {
    existingAmbitos.forEach(ambito => {
      removeAmbitoIfExists(null, cadena.id, null);
    });
    return;
  }
  
  // Nuevo valor a establecer
  const newAmbitoToAdd = {
    ...ambitoToAdd,
    cadena: cadena
  };
  
  setSelectedCadena(cadena.id);
  setAmbitoToAdd(newAmbitoToAdd);
  
  // Verificamos si tenemos todos los campos con los nuevos valores
  if (newAmbitoToAdd.grupoCadena && newAmbitoToAdd.mercado) {
    addAmbitoWithValues(newAmbitoToAdd);
  }
};

const handleMercadoSelect = (mercado) => {
  // Comprobamos si este mercado ya está en algún ámbito
  const existingAmbitos = ambitosTable.filter(
    ambito => ambito.mercado.id === mercado.id && selectedAmbitos.includes(ambito.id)
  );
  
  // Si existe algún ámbito con este mercado, los quitamos todos y retornamos
  if (existingAmbitos.length > 0) {
    existingAmbitos.forEach(ambito => {
      removeAmbitoIfExists(null, null, mercado.id);
    });
    return;
  }
  
  // Nuevo valor a establecer
  const newAmbitoToAdd = {
    ...ambitoToAdd,
    mercado: mercado
  };
  
  setSelectedMercado(mercado.id);
  setAmbitoToAdd(newAmbitoToAdd);
  
  // Verificamos si tenemos todos los campos con los nuevos valores
  if (newAmbitoToAdd.grupoCadena && newAmbitoToAdd.cadena) {
    addAmbitoWithValues(newAmbitoToAdd);
  }
};

const handleArticuloSelect = (articulo) => {
  const isSelected = articulos.some(a => a.idAjeno === articulo.idAjeno);
  
  if (isSelected) {
    setArticulos(prev => prev.filter(a => a.idAjeno !== articulo.idAjeno));
  } else {
    setArticulos(prev => [...prev, articulo]);
  }
};

const handleAmbitoSelect = (ambitoId) => {
  if (selectedAmbitos.includes(ambitoId)) {
    setSelectedAmbitos(prev => prev.filter(id => id !== ambitoId));
  } else {
    setSelectedAmbitos(prev => [...prev, ambitoId]);
  }
};

const handleAddArticulo = () => {
  setIsArticulosDropdownOpen(false);
};

// Función auxiliar para añadir ámbito usando valores específicos
const addAmbitoWithValues = (ambitoValues) => {
  // Verificamos que tengamos seleccionados los tres elementos necesarios
  if (ambitoValues.grupoCadena && ambitoValues.cadena && ambitoValues.mercado) {
    const newAmbitoId = `${ambitoValues.grupoCadena.id}-${ambitoValues.cadena.id}-${ambitoValues.mercado.id}`;
    
    // Verificamos si ya existe un ámbito con esta combinación
    const existingAmbito = ambitosTable.find(a => a.id === newAmbitoId);
    
    if (!existingAmbito) {
      const newAmbito = {
        id: newAmbitoId,
        grupoCadena: ambitoValues.grupoCadena,
        cadena: ambitoValues.cadena,
        mercado: ambitoValues.mercado
      };
      
      setAmbitosTable(prev => [...prev, newAmbito]);
      setSelectedAmbitos(prev => [...prev, newAmbitoId]);
    }
  }
};

// Esta función busca y elimina un ámbito si existe
const removeAmbitoIfExists = (grupoId, cadenaId, mercadoId) => {
  // Buscamos todas las combinaciones que coinciden con los criterios
  const ambitosToRemove = ambitosTable.filter(ambito => 
    (grupoId ? ambito.grupoCadena.id === grupoId : true) &&
    (cadenaId ? ambito.cadena.id === cadenaId : true) &&
    (mercadoId ? ambito.mercado.id === mercadoId : true)
  );
  
  if (ambitosToRemove.length > 0) {
    // Eliminamos todos los encontrados
    const idsToRemove = ambitosToRemove.map(a => a.id);
    setAmbitosTable(prev => prev.filter(a => !idsToRemove.includes(a.id)));
    setSelectedAmbitos(prev => prev.filter(id => !idsToRemove.includes(id)));
    return true;
  }
  
  return false;
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

const handleIdiomaCheckboxChange = (idiomaId, isChecked) => {
  if (isChecked) {
    if (!selectedIdiomas.includes(idiomaId)) {
      setSelectedIdiomas([...selectedIdiomas, idiomaId]);
      if (!idiomasAliasValues[idiomaId]) {
        setIdiomasAliasValues(prev => ({
          ...prev,
          [idiomaId]: { nombre: '', descripcion: '' }
        }));
      }
    }
  } else {
    setSelectedIdiomas(selectedIdiomas.filter(id => id !== idiomaId));
  }
};

const handleClearSearchText = () => {
  setSearchText('');
};

const handleClearInputValue = (idiomaId, field) => {
  handleIdiomaAliasChange(idiomaId, field, '');
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
      idiomas: selectedIdiomas.map(idIdioma => ({
        idIdioma,
        nombre: idiomasAliasValues[idIdioma]?.nombre || '',
        descripcion: idiomasAliasValues[idIdioma]?.descripcion || ''
      })),
      ambitos: ambitosTable
        .filter(ambito => selectedAmbitos.includes(ambito.id))
        .map(ambito => ({
          idGrupoCadena: ambito.grupoCadena.id,
          idCadena: ambito.cadena.id,
          idMercado: ambito.mercado.id
        }))
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
        {t('EDICIÓN DE ALIAS')} - {alias.idAlias} / {alias.descripcion || alias.nombreAlias}
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
            <div className="idiomas-dropdown" ref={dropdownRef}>
              <div 
                className="idiomas-dropdown-field" 
                onClick={() => handleDropdownToggle('idiomas')}
              >
                <span>{selectedIdiomas.length} {t('seleccionados')}</span>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'idiomas' && (
                <div className="idiomas-dropdown-menu">
                  <div className="idiomas-dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar idioma...')}
                      value={searchText}
                      onChange={handleSearchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchText && (
                      <FaTimes className="clear-search-icon" onClick={handleClearSearchText} />
                    )}
                  </div>
                  
                  <div className="idiomas-dropdown-items">
                    <div className="idiomas-dropdown-item select-all">
                      <div className="custom-checkbox">
                        {checkAll && <FaCheck className="checkbox-icon" />}
                      </div>
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                    
                    {idiomasDisponibles
                      .filter(idioma => 
                        searchText === '' || 
                        idioma.descripcion.toLowerCase().includes(searchText.toLowerCase())
                      )
                      .map(idioma => (
                        <div 
                          key={idioma.id} 
                          className="idiomas-dropdown-item"
                          onClick={() => handleIdiomaCheckboxChange(idioma.id, !selectedIdiomas.includes(idioma.id))}
                        >
                          <div className="custom-checkbox">
                            {selectedIdiomas.includes(idioma.id) && <FaCheck className="checkbox-icon" />}
                          </div>
                          <label>
                            {idioma.descripcion}
                          </label>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="idiomas-count">{selectedIdiomas.length} {t('idiomas añadidos')}</div>
          
          <div className="idiomas-table-container">
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
                {selectedIdiomas.map(idiomaId => (
                  <tr key={idiomaId}>
                    <td className="checkbox-column">
                      <div className="custom-checkbox" onClick={() => handleIdiomaCheckboxChange(idiomaId, false)}>
                        <FaCheck className="checkbox-icon" />
                      </div>
                    </td>
                    <td>{getIdiomaNombre(idiomaId)}</td>
                    <td>
                      <div className="editable-cell">
                        <input 
                          type="text" 
                          value={idiomasAliasValues[idiomaId]?.nombre || ''} 
                          onChange={(e) => handleIdiomaAliasChange(idiomaId, 'nombre', e.target.value)}
                          placeholder="QA Prueba"
                        />
                        {idiomasAliasValues[idiomaId]?.nombre && (
                          <FaTimes 
                            className="clear-input" 
                            onClick={() => handleClearInputValue(idiomaId, 'nombre')}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="editable-cell">
                        <input 
                          type="text" 
                          value={idiomasAliasValues[idiomaId]?.descripcion || ''} 
                          onChange={(e) => handleIdiomaAliasChange(idiomaId, 'descripcion', e.target.value)}
                          placeholder="QA Prueba"
                        />
                        {idiomasAliasValues[idiomaId]?.descripcion && (
                          <FaTimes 
                            className="clear-input" 
                            onClick={() => handleClearInputValue(idiomaId, 'descripcion')}
                          />
                        )}
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
          
          <div className="articulos-search-container" ref={articulosDropdownRef}>
            <div className="articulos-search-input-container">
              <input 
                type="text" 
                value={articuloSearchText}
                onChange={handleArticuloSearchChange}
                onClick={toggleArticulosDropdown}
                className="articulos-search-input"
                placeholder={t('Buscar por id o nombre de artículo')}
              />
              
              {articuloSearchText && (
                <button
                  className="articulos-search-clear-btn"
                  onClick={clearArticuloSearch}
                >
                  <FaTimes />
                </button>
              )}
              
              <button 
                className="articulos-search-toggle-btn" 
                onClick={toggleArticulosDropdown}
              >
                <FaChevronDown />
              </button>
            </div>
            
            <button className="articulos-add-btn" onClick={handleAddArticulo}>
              {t('AÑADIR')}
            </button>
            
            {isArticulosDropdownOpen && (
              <div className="articulos-dropdown">
                <div className="articulos-search-box">
                  <FaSearch className="articulos-search-icon" />
                  <input 
                    type="text"
                    value={articuloSearchText}
                    onChange={handleArticuloSearchChange}
                    placeholder={t('Buscar artículo...')}
                    className="articulos-dropdown-search-input"
                    autoFocus
                  />
                  {articuloSearchText && (
                    <button
                      className="articulos-dropdown-clear-btn"
                      onClick={clearArticuloSearch}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                
                <div className="articulos-dropdown-items">
                  {filteredArticulos.length === 0 ? (
                    <div className="articulos-no-results">{t('No se encontraron artículos')}</div>
                  ) : (
                    <>
                      {filteredArticulos.map(articulo => (
                        <div 
                          key={articulo.idAjeno || articulo.id} 
                          className="articulos-dropdown-item"
                          onClick={() => handleArticuloSelect(articulo)}
                        >
                          <div className="custom-checkbox">
                            {articulos.some(a => a.idAjeno === articulo.idAjeno) && <FaCheck className="checkbox-icon" />}
                          </div>
                          <div className="articulos-item-info">
                            <div className="articulos-item-id">
                              ID: {articulo.idAjeno || articulo.id}
                            </div>
                            <div className="articulos-item-nombre">
                              {articulo.nombreAjeno || articulo.descripcion || articulo.nombre}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="articulos-select-all" onClick={handleSelectAllArticulos}>
                        <div className="custom-checkbox">
                          {checkAllArticulos && <FaCheck className="checkbox-icon" />}
                        </div>
                        <span>{t('Seleccionar todo')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="articulos-count">{articulos.length} {t('artículos añadidos')}</div>
          
          <div className="articulos-table-container">
            <div className="articulos-table-scroll">
              <table className="articulos-table">
                <thead>
                  <tr>
                    <th className="checkbox-column"></th>
                    <th className="id-column">{t('ID ARTÍCULO')}</th>
                    <th className="articulo-column">{t('ARTÍCULO')}</th>
                    <th className="unidades-column">{t('UNIDADES BOX')}</th>
                    <th className="unidad-column">
                      <div>{t('UNIDAD DE')}</div>
                      <div>{t('EMPAQUETADO')}</div>
                    </th>
                    <th className="multiplo-column">
                      <div>{t('MÚLTIPLO')}</div>
                      <div>{t('MÍNIMO')}</div>
                    </th>
                    <th className="estado-spi-column">
                      <div>{t('ESTADO ARTÍCULO')}</div>
                      <div>{t('SFI')}</div>
                    </th>
                    <th className="estado-ram-column">
                      <div>{t('ESTADO ARTÍCULO')}</div>
                      <div>{t('RAM')}</div>
                    </th>
                    <th className="estado-alias-column">
                      <div>{t('ESTADO ARTÍCULO')}</div>
                      <div>{t('EN EL ALIAS')}</div>
                    </th>
                    <th className="fecha-column">
                      <div>{t('FECHA DE')}</div>
                      <div>{t('ALTA')}</div>
                    </th>
                    <th className="sint-column">{t('ID SINT')}</th>
                  </tr>
                </thead>
                <tbody>
                  {articulos.map(articulo => (
                    <tr key={articulo.idAjeno || articulo.id}>
                      <td className="checkbox-column">
                        <div className="custom-checkbox">
                          <FaCheck className="checkbox-icon" />
                        </div>
                      </td>
                      <td>{articulo.idAjeno || articulo.id}</td>
                      <td className="articulo-name">
                        {articulo.nombreAjeno || articulo.descripcion || articulo.nombre}
                      </td>
                      <td className="unidades-box">{articulo.unidadesMedida?.descripcion}</td>
                      <td>{articulo.unidadesEmpaquetado}</td>
                      <td className="text-center">{articulo.multiploMinimo}</td>
                      <td className="estado-column">
                        <span className="estado-tag activo">
                          {articulo.tipoEstadoCompras?.descripcion}
                        </span>
                      </td>
                      <td className="estado-column">
                        <span className="estado-tag activo">
                          {articulo.tipoEstadoRam?.descripcion}
                        </span>
                      </td>
                      <td className="estado-column">
                        <span className="estado-tag activo">
                          {articulo.descripcionTipoEstadoAliasAjenoRam}
                        </span>
                      </td>
                      <td>{articulo.fechaAlta}</td>
                      <td>{articulo.idSint || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="edicion-alias-section">
        <div className="paso-title">
          <span>{t('PASO 3')}</span> - <span className="paso-descripcion">{t('DEFINICIÓN DEL ÁMBITO')}</span>
          <FaCircle className="paso-icon completed" />
        </div>
        
        <div className="paso-content">
          <p className="section-description">{t('Define el ámbito de aplicación del alias seleccionando el grupo cadena y mercado.')}</p>
          
          <div className="ambito-row">
            <div className="ambito-field grupo-cadena-field" ref={grupoCadenaDropdownRef}>
              <label className="ambito-label">{t('Id o Grupo Cadena (T6)*')}</label>
              <div 
                className="dropdown-field" 
                onClick={toggleGrupoCadenaDropdown}
              >
                <span>
                  {(() => {
                    // Contar cuántos grupos de cadena únicos están seleccionados
                    const gruposSeleccionados = new Set();
                    ambitosTable.forEach(ambito => {
                      if (selectedAmbitos.includes(ambito.id)) {
                        gruposSeleccionados.add(ambito.grupoCadena.id);
                      }
                    });
                    
                    if (gruposSeleccionados.size === 0) {
                      return t('Seleccionar grupo cadena');
                    } else if (gruposSeleccionados.size === 1) {
                      const grupoId = [...gruposSeleccionados][0];
                      const grupo = ambitosTable.find(a => a.grupoCadena.id === grupoId)?.grupoCadena;
                      return `${grupo.id} - ${grupo.descripcion}`;
                    } else {
                      return `${gruposSeleccionados.size} ${t('seleccionados')}`;
                    }
                  })()}
                </span>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {isGrupoCadenaDropdownOpen && (
                <div className="filter-dropdown-content">
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar grupo cadena...')}
                      value={grupoSearchText}
                      onChange={handleGrupoSearchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {grupoSearchText && (
                      <FaTimes 
                        className="clear-search-icon" 
                        onClick={clearGrupoSearch} 
                      />
                    )}
                  </div>
                  
                  <div className="dropdown-items">
                    {filteredGruposCadena.map((grupo) => {
                      // Verificar si este grupo ya está en la tabla
                      const isInTable = ambitosTable.some(ambito => 
                        ambito.grupoCadena.id === grupo.id && 
                        selectedAmbitos.includes(ambito.id)
                      );
                      
                      return (
                        <div 
                          key={grupo.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGrupoCadenaSelect(grupo);
                          }}
                        >
                          <div className="custom-checkbox">
                            {isInTable && <FaCheck className="checkbox-icon" />}
                          </div>
                          <span className="dropdown-item-text">
                            {grupo.id} - {grupo.descripcion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="ambito-field cadena-field" ref={cadenaDropdownRef}>
              <label className="ambito-label">{t('Id o Cadena*')}</label>
              <div 
                className="dropdown-field" 
                onClick={toggleCadenaDropdown}
              >
                <span>
                  {(() => {
                    // Contar cuántas cadenas únicas están seleccionadas
                    const cadenasSeleccionadas = new Set();
                    ambitosTable.forEach(ambito => {
                      if (selectedAmbitos.includes(ambito.id)) {
                        cadenasSeleccionadas.add(ambito.cadena.id);
                      }
                    });
                    
                    if (cadenasSeleccionadas.size === 0) {
                      return t('Seleccionar cadena');
                    } else if (cadenasSeleccionadas.size === 1) {
                      const cadenaId = [...cadenasSeleccionadas][0];
                      const cadena = ambitosTable.find(a => a.cadena.id === cadenaId)?.cadena;
                      return `${cadena.id} - ${cadena.descripcion}`;
                    } else {
                      return `${cadenasSeleccionadas.size} ${t('seleccionados')}`;
                    }
                  })()}
                </span>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {isCadenaDropdownOpen && (
                <div className="filter-dropdown-content">
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar cadena...')}
                      value={cadenaSearchText}
                      onChange={handleCadenaSearchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {cadenaSearchText && (
                      <FaTimes 
                        className="clear-search-icon" 
                        onClick={clearCadenaSearch} 
                      />
                    )}
                  </div>
                  
                  <div className="dropdown-items">
                    {filteredCadenas.map((cadena) => {
                      // Verificar si esta cadena ya está en la tabla
                      const isInTable = ambitosTable.some(ambito => 
                        ambito.cadena.id === cadena.id && 
                        selectedAmbitos.includes(ambito.id)
                      );
                      
                      return (
                        <div 
                          key={cadena.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCadenaSelect(cadena);
                          }}
                        >
                          <div className="custom-checkbox">
                            {isInTable && <FaCheck className="checkbox-icon" />}
                          </div>
                          <span className="dropdown-item-text">
                            {cadena.id} - {cadena.descripcion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="ambito-field mercado-field" ref={mercadoDropdownRef}>
              <label className="ambito-label">{t('Id o Mercado*')}</label>
              <div 
                className="dropdown-field" 
                onClick={toggleMercadoDropdown}
              >
                <span>
                  {(() => {
                    // Contar cuántos mercados únicos están seleccionados
                    const mercadosSeleccionados = new Set();
                    ambitosTable.forEach(ambito => {
                      if (selectedAmbitos.includes(ambito.id)) {
                        mercadosSeleccionados.add(ambito.mercado.id);
                      }
                    });
                    
                    if (mercadosSeleccionados.size === 0) {
                      return t('Seleccionar mercado');
                    } else if (mercadosSeleccionados.size === 1) {
                      const mercadoId = [...mercadosSeleccionados][0];
                      const mercado = ambitosTable.find(a => a.mercado.id === mercadoId)?.mercado;
                      return `${mercado.id} - ${mercado.descripcion}`;
                    } else {
                      return `${mercadosSeleccionados.size} ${t('seleccionados')}`;
                    }
                  })()}
                </span>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {isMercadoDropdownOpen && (
                <div className="filter-dropdown-content">
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar mercado...')}
                      value={mercadoSearchText}
                      onChange={handleMercadoSearchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {mercadoSearchText && (
                      <FaTimes 
                        className="clear-search-icon" 
                        onClick={clearMercadoSearch} 
                      />
                    )}
                  </div>
                  
                  <div className="dropdown-items">
                    {filteredMercados.map((mercado) => {
                      // Verificar si este mercado ya está en la tabla
                      const isInTable = ambitosTable.some(ambito => 
                        ambito.mercado.id === mercado.id && 
                        selectedAmbitos.includes(ambito.id)
                      );
                      
                      return (
                        <div 
                          key={mercado.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMercadoSelect(mercado);
                          }}
                        >
                          <div className="custom-checkbox">
                            {isInTable && <FaCheck className="checkbox-icon" />}
                          </div>
                          <span className="dropdown-item-text">
                            {mercado.id} - {mercado.descripcion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="ambitos-table-container">
            <table className="ambitos-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>{t('ID/GRUPO CADENA')}</th>
                  <th>{t('ID/CADENA')}</th>
                  <th>{t('MERCADO')}</th>
                </tr>
              </thead>
              <tbody>
                {ambitosTable.map(ambito => (
                  <tr key={ambito.id}>
                    <td className="checkbox-column">
                      <div className="custom-checkbox" onClick={() => handleAmbitoSelect(ambito.id)}>
                        {selectedAmbitos.includes(ambito.id) && <FaCheck className="checkbox-icon" />}
                      </div>
                    </td>
                    <td>{ambito.grupoCadena.id} - {ambito.grupoCadena.descripcion}</td>
                    <td>{ambito.cadena.id} - {ambito.cadena.descripcion}</td>
                    <td className="mercado-column">
                      <span>{ambito.mercado.id} - {ambito.mercado.descripcion}</span>
                      <FaTimes 
                        className="remove-ambito-icon" 
                        onClick={() => handleRemoveAmbito(ambito.id)}
                        style={{ marginLeft: 'auto', cursor: 'pointer', color: '#999' }}
                      />
                    </td>
                  </tr>
                ))}
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