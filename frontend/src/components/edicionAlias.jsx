import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaCircle, FaSearch, FaCheck, FaTrash } from 'react-icons/fa';
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
  const [selectedAliasesIds, setSelectedAliasesIds] = useState([]);
  const [showDeleteAliasIcon, setShowDeleteAliasIcon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alias, setAlias] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [articulosDisponibles, setArticulosDisponibles] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [idiomasDisponibles, setIdiomasDisponibles] = useState([]);
  const [tiposAlias, setTiposAlias] = useState([]);
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
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
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
  const [ambitosData, setAmbitosData] = useState({});
  const [selectedAmbitos, setSelectedAmbitos] = useState([]);
  const [selectedArticulosIds, setSelectedArticulosIds] = useState([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);
  
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

  const grupoCadenaDropdownRef = useRef(null);
  const cadenaDropdownRef = useRef(null);
  const mercadoDropdownRef = useRef(null);
  const articulosDropdownRef = useRef(null);

  const [aliasesPrincipales, setAliasesPrincipales] = useState([]);
  const [selectedAliasesPrincipales, setSelectedAliasesPrincipales] = useState([]);
  const [aliasSearchText, setAliasSearchText] = useState('');
  const [filteredAliasesPrincipales, setFilteredAliasesPrincipales] = useState([]);
  const [isAliasesDropdownOpen, setIsAliasesDropdownOpen] = useState(false);
  const [acoplesRatio, setAcoplesRatio] = useState({});
  const aliasesDropdownRef = useRef(null);

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
      if (aliasesDropdownRef.current && !aliasesDropdownRef.current.contains(event.target)) {
        setIsAliasesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleAliasesDropdown = () => {
    setIsAliasesDropdownOpen(!isAliasesDropdownOpen);
    setIsGrupoCadenaDropdownOpen(false);
    setIsCadenaDropdownOpen(false);
    setIsMercadoDropdownOpen(false);
    setIsArticulosDropdownOpen(false);
    
    if (!isAliasesDropdownOpen) {
      setAliasSearchText('');
      setFilteredAliasesPrincipales(aliasesPrincipales);
    }
  };

  const handleAliasPrincipalCheckboxChange = (aliasId) => {
    setSelectedAliasesIds(prev => {
      if (prev.includes(aliasId)) {
        const newSelected = prev.filter(id => id !== aliasId);
        setShowDeleteAliasIcon(newSelected.length > 0);
        return newSelected;
      }
      else {
        setShowDeleteAliasIcon(true);
        return [...prev, aliasId];
      }
    });
  };

  const handleDeleteSelectedAliases = () => {
    setSelectedAliasesPrincipales(prev => 
      prev.filter(alias => !selectedAliasesIds.includes(alias.idAlias))
    );
    setSelectedAliasesIds([]);
    setShowDeleteAliasIcon(false);
  };

  const handleAliasSearchChange = (e) => {
    const value = e.target.value;
    setAliasSearchText(value);
    
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = aliasesPrincipales.filter(
        alias => 
          alias.idAlias.toString().toLowerCase().includes(searchValue) || 
          alias.nombre.toLowerCase().includes(searchValue)
      );
      setFilteredAliasesPrincipales(filtered);
    } else {
      setFilteredAliasesPrincipales(aliasesPrincipales);
    }
  };

  const clearAliasSearch = () => {
    setAliasSearchText('');
    setFilteredAliasesPrincipales(aliasesPrincipales);
  };

  const handleAliasPrincipalSelect = (alias) => {
    setSelectedAliasesPrincipales(prev => {
      if (prev.some(a => a.idAlias === alias.idAlias)) {
        return prev.filter(a => a.idAlias !== alias.idAlias);
      }
      return [...prev, alias];
    });
  };

  const handleAcopleRatioChange = (idAlias, value) => {
    setAcoplesRatio(prev => ({
      ...prev,
      [idAlias]: parseFloat(value) || 0
    }));
  };

  const normalizeText = (text) => {
    if (!text) return '';

    let normalizedText = text;

    normalizedText = normalizedText
    .replace(/ESPA.?.A/g, 'ESPAÑA')
    .replace(/PEQUE.?.O/g, 'PEQUEÑO')
    .replace(/PEQUE.?.A/g, 'PEQUEÑA');
    

    const replacements = {
      'Ã\u0081': 'Á', 'Ã\u0089': 'É', 'Ã\u008D': 'Í', 'Ã\u0093': 'Ó', 'Ã\u009A': 'Ú',
      'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
      'Ã\u0091': 'Ñ', 'Ã±': 'ñ',
      'Ã¼': 'ü', 'Ã\u009C': 'Ü',
      'Âº': 'º', 'Âª': 'ª',
      'Ã\u0084': 'Ä', 'Ã\u008B': 'Ë', 'Ã\u008F': 'Ï', 'Ã\u0096': 'Ö', 'Ã\u009C': 'Ü',
      'Ã¤': 'ä', 'Ã«': 'ë', 'Ã¯': 'ï', 'Ã¶': 'ö', 'Ã¼': 'ü',
      'â‚¬': '€',
      'â€"': '–', 'â€"': '—',
      'â€œ': '"', 'â€': '"',
      'â€¢': '•',
      'â€¦': '…',
      'Â¡': '¡', 'Â¿': '¿'
    };

    Object.entries(replacements).forEach(([badChar, goodChar]) => {
      normalizedText = normalizedText.replace(new RegExp(badChar, 'g'), goodChar);
    });

    return normalizedText;
  };

  const StatusTag = ({ status, type }) => {
      let className = 'status-tag';
      
      const normalizedStatus = status ? status.toUpperCase().trim() : '';
      
      if (normalizedStatus === '04.BLOQUEADO') {
        className += ' status-bloqueado';
      } else if (normalizedStatus === 'PAUSADO') {
        className += ' status-paused';
      } else if (normalizedStatus === 'ACTIVO' || normalizedStatus === '02.ACTIVO') {
        className += ' status-active';
      }
      
      return <div className={className}>{status || '-'}</div>;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const idsGrupoCadena = [...new Set(
        ambitosTable
          .filter(ambito => selectedAmbitos.includes(ambito.id))
          .map(ambito => ambito.grupoCadena.id)
      )];
      
      const idsCadena = [...new Set(
        ambitosTable
          .filter(ambito => selectedAmbitos.includes(ambito.id))
          .map(ambito => ambito.cadena.id)
      )];
      
      const idsMercado = [...new Set(
        ambitosTable
          .filter(ambito => selectedAmbitos.includes(ambito.id))
          .map(ambito => ambito.mercado.id)
      )];

      const idEstadoMap = {
        'BORRADOR': 1,
        'PRODUCCION': 2,
        'PAUSADO': 3
      };
      
      const idTipoEstadoAlias = idEstadoMap[selectedEstadoAlias] || 2;

      const updatedAlias = {
        idAlias: parseInt(id),
        idTipoAlias: parseInt(selectedTipoAlias) || alias.idTipoAlias,
        idTipoEstacionalidad: parseInt(selectedEstacionalidad) || alias.idEstacionalidad,
        idTipoEstadoAlias: idTipoEstadoAlias,
        idTipoConexionOrigenDatoAlias: parseInt(selectedTipoConexion) || alias.idTipoConexion || 1,
        idTipoOrigenDatoAlias: 1,
        informacionOrigenDato: null,
        
        idiomas: selectedIdiomas.map(idIdioma => ({
          idIdioma: parseInt(idIdioma),
          nombre: idiomasAliasValues[idIdioma]?.nombre || '',
          descripcion: idiomasAliasValues[idIdioma]?.descripcion || ''
        })),
        
        aliasAjeno: articulos.map(articulo => ({
          idAjeno: parseInt(articulo.idAjeno || articulo.id),
          idTipoEstadoAjenoRam: parseInt(articulo.idTipoEstadoAliasAjenoRam || articulo.idTipoEstadoAjenoRam || 1),
          idSint: articulo.idSint && articulo.idSint !== '-' ? parseInt(articulo.idSint) : null
        })),
        
        aliasAmbito: {
          idsGrupoCadena,
          idsCadena,
          idsMercado
        }
      };
      
      if (parseInt(selectedTipoAlias) === 2) {
        updatedAlias.acoples = selectedAliasesPrincipales.map(alias => ({
          idAlias: parseInt(alias.idAlias),
          ratioAcople: parseFloat(acoplesRatio[alias.idAlias] || 1),
          idTipoAlias: parseInt(alias.idTipoAlias || 1)
        }));
      } else if (alias.acoples && alias.acoples.length > 0) {
        updatedAlias.acoples = alias.acoples.map(acople => ({
          idAlias: parseInt(acople.idAlias),
          ratioAcople: parseFloat(acople.ratioAcople) || 1,
          idTipoAlias: parseInt(acople.idTipoAlias) || 2
        }));
      }

      console.log('Enviando datos al servidor:', updatedAlias);
      
      await axios.put(`${BASE_URL}/edicion/alias/${id}`, updatedAlias);
      
      try {
        const refreshResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}?idIdioma=${languageId}`);
        const refreshedData = refreshResponse.data;
        
        setAlias(refreshedData);
        
        const refreshedEstadoId = refreshedData.idTipoEstadoAlias;
        const refreshedEstadoDesc = refreshedData.descripcionTipoEstadoAlias;
        const refreshedNormalizedEstado = getEstadoNormalizado(refreshedEstadoId, refreshedEstadoDesc);
        
        console.log(`Estado actualizado del alias: ID=${refreshedEstadoId}, Desc=${refreshedEstadoDesc}, Normalizado=${refreshedNormalizedEstado}`);
        setSelectedEstadoAlias(refreshedNormalizedEstado);
        setEstadoDesc(refreshedEstadoDesc || '');
      } catch (refreshError) {
        console.warn('No se pudo actualizar el estado después de guardar', refreshError);
      }
      
      alert(t('Alias actualizado correctamente'));
      
      navigate(-1);
    } catch (error) {
      console.error('Error saving alias:', error);
      setError('Error al guardar los cambios del alias');
      alert(t('Error al guardar los cambios del alias'));
    } finally {
      setLoading(false);
    }
  };

  const handleArticuloCheckboxChange = (articuloId) => {
    setSelectedArticulosIds(prev => {
      if (prev.includes(articuloId)) {
        const newSelected = prev.filter(id => id !== articuloId);
        setShowDeleteIcon(newSelected.length > 0);
        return newSelected;
      }
      else {
        setShowDeleteIcon(true);
        return [...prev, articuloId];
      }
    });
  };

  const handleDeleteSelectedArticulos = () => {
    setArticulos(prev => prev.filter(articulo => 
      !selectedArticulosIds.includes(articulo.idAjeno || articulo.id)
    ));
    setSelectedArticulosIds([]);
    setShowDeleteIcon(false);
  };

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

        const estadoId = aliasData.idTipoEstadoAlias || aliasData.idEstado;
        const estadoDescripcion = aliasData.descripcionTipoEstadoAlias || aliasData.estado;
        
        const normalizedEstado = getEstadoNormalizado(estadoId, estadoDescripcion);
        console.log(`Estado del alias: ID=${estadoId}, Desc=${estadoDescripcion}, Normalizado=${normalizedEstado}`);
        
        setSelectedTipoAlias(aliasData.idTipoAlias || '');
        setSelectedTipoConexion(aliasData.idTipoConexionOrigenDatoAlias || aliasData.idTipoConexion || 'PRINCIPAL');
        setSelectedEstacionalidad(aliasData.idTipoEstacionalidad || aliasData.idEstacionalidad || '');
        setSelectedEstadoAlias(normalizedEstado);
        setEstadoDesc(estadoDescripcion || '');

        const articulosAliasData = aliasData.ajenos || [];
        setArticulos(articulosAliasData);

        if (aliasData.idTipoAlias === 2 || aliasData.idTipoAlias === '2') {
          try {
            const aliasesResponse = await axios.get(`${BASE_URL}/edicion/alias-info?idIdioma=${languageId}`);
            setAliasesPrincipales(aliasesResponse.data || []);
            setFilteredAliasesPrincipales(aliasesResponse.data || []);
            
            if (aliasData.acoples && aliasData.acoples.length > 0) {
              const selectedAliases = aliasesResponse.data.filter(a => 
                aliasData.acoples.some(acople => acople.idAlias === a.idAlias)
              );
              
              setSelectedAliasesPrincipales(selectedAliases);
              
              const ratios = {};
              aliasData.acoples.forEach(acople => {
                ratios[acople.idAlias] = acople.ratioAcople || 1;
              });
              
              setAcoplesRatio(ratios);
            }
          } catch (aliasesError) {
            console.error('Error al cargar alias principales:', aliasesError);
          }
        }

        const idiomasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/idiomas?idIdioma=${languageId}`);
        const idiomasData = idiomasResponse.data || [];
        setIdiomas(idiomasData);
        setSelectedIdiomas(idiomasData.map(i => i.idIdioma));

        const idiomasValues = {};
        idiomasData.forEach(idioma => {
          idiomasValues[idioma.idIdioma] = {
            nombre: idioma.nombre || '',
            descripcion: normalizeText(idioma.descripcion) || ''
          };
        });
        setIdiomasAliasValues(idiomasValues);

        const ambitosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/ambitos?idIdioma=${languageId}`);
        setAmbitosData(ambitosResponse.data || {});
        
        const generatedAmbitosTable = [];
        
        if (ambitosResponse.data && 
            ambitosResponse.data.gruposCadena && 
            ambitosResponse.data.cadenas && 
            ambitosResponse.data.mercados) {
            
          const { gruposCadena, cadenas, mercados } = ambitosResponse.data;
          
          mercados.forEach(mercado => {
            cadenas.forEach(cadena => {
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

        if (ambitosResponse.data) {
          if (ambitosResponse.data.gruposCadena && ambitosResponse.data.gruposCadena.length > 0) {
            const gruposCadenaIds = ambitosResponse.data.gruposCadena.map(g => g.id);
            setSelectedGruposCadena(gruposCadenaIds);
            setSelectedGrupoCadena(gruposCadenaIds[0] || '');
            
            if (ambitosResponse.data.gruposCadena[0]) {
              setAmbitoToAdd(prev => ({
                ...prev,
                grupoCadena: ambitosResponse.data.gruposCadena[0]
              }));
            }
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
        
        if (selectedGruposCadena && selectedGruposCadena.length > 0) {
          const cadenasFiltradas = cadenas.filter(
            cadena => selectedGruposCadena.includes(cadena.idGrupoCadena)
          );
          setFilteredCadenas(cadenasFiltradas);
        } else {
            setFilteredCadenas(cadenas);
        }
        const mercados = mercadosRes.data || [];
        setMercadosDisponibles(mercados);
        setFilteredMercados(mercados);
        
        const articulosConSelected = (articulosDisponiblesRes.data || []).map(articulo => ({
          ...articulo,
          selected: articulosAliasData.some(a => 
            a.idAjeno === articulo.idAjeno || 
            a.id === articulo.idAjeno
          )
        }));
        
        setArticulosDisponibles(articulosConSelected);
        setFilteredArticulos(articulosConSelected);
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
      
      setFilteredArticulos(filtered.map(articulo => ({
        ...articulo,
        selected: articulo.selected || articulos.some(a => 
          a.idAjeno === articulo.idAjeno || 
          a.id === articulo.idAjeno
        )
      })));
    } else {
      setFilteredArticulos(articulosDisponibles.map(articulo => ({
        ...articulo,
        selected: articulo.selected || articulos.some(a => 
          a.idAjeno === articulo.idAjeno || 
          a.id === articulo.idAjeno
        )
      })));
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
    if (!isArticulosDropdownOpen) {
      setArticuloSearchText('');
      setFilteredArticulos(articulosDisponibles.map(articulo => ({
        ...articulo,
        selected: articulos.some(a => 
          a.idAjeno === articulo.idAjeno || 
          a.id === articulo.idAjeno
        )
      })));
    }
    
    setIsArticulosDropdownOpen(!isArticulosDropdownOpen);
    setIsGrupoCadenaDropdownOpen(false);
    setIsCadenaDropdownOpen(false);
    setIsMercadoDropdownOpen(false);
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
      if (selectedGruposCadena && selectedGruposCadena.length > 0) {
        const cadenasFiltradas = cadenasDisponibles.filter(
          cadena => selectedGruposCadena.includes(cadena.idGrupoCadena)
        );
        setFilteredCadenas(cadenasFiltradas);
      } else {
        setFilteredCadenas([]);
      }
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
    setFilteredArticulos(articulosDisponibles.map(articulo => ({
      ...articulo,
      selected: articulo.selected || articulos.some(a => 
        a.idAjeno === articulo.idAjeno || 
        a.id === articulo.idAjeno
      )
    })));
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
    const allSelected = filteredArticulos.every(articulo => articulo.selected);
    
    setCheckAllArticulos(!allSelected);
    
    setFilteredArticulos(prev => 
      prev.map(a => ({...a, selected: !allSelected}))
    );
  };

  const handleGrupoCadenaSelect = (grupo) => {
    const grupoIndex = selectedGruposCadena.findIndex(g => g === grupo.id);
    let newSelectedGrupos;
    
    if (grupoIndex >= 0) {
      newSelectedGrupos = selectedGruposCadena.filter(g => g !== grupo.id);
      
      removeAmbitoIfExists(grupo.id, null, null);
    } else {
      newSelectedGrupos = [...selectedGruposCadena, grupo.id];
      
      setAmbitoToAdd(prev => ({
        ...prev,
        grupoCadena: grupo
      }));
      
      addCadenasForGrupoCadena(grupo);
    }
    
    setSelectedGruposCadena(newSelectedGrupos);
    setSelectedGrupoCadena(newSelectedGrupos.length > 0 ? newSelectedGrupos[0] : '');
    
    updateCadenasBySelectedGrupos(newSelectedGrupos);
  };

  const updateCadenasBySelectedGrupos = (selectedGrupos) => {
    if (selectedGrupos.length === 0) {
      setFilteredCadenas([]);
      return;
    }
    
    const cadenasFiltradas = cadenasDisponibles.filter(
      cadena => selectedGrupos.includes(cadena.idGrupoCadena)
    );
    
    setFilteredCadenas(cadenasFiltradas);
  };

  const addCadenasForGrupoCadena = (grupo) => {
    const cadenasDelGrupo = cadenasDisponibles.filter(
      cadena => cadena.idGrupoCadena === grupo.id
    );
    
    const mercadosSeleccionados = new Set();
    ambitosTable.forEach(ambito => {
      if (selectedAmbitos.includes(ambito.id)) {
        mercadosSeleccionados.add(JSON.stringify(ambito.mercado)); 
      }
    });
    
    if (mercadosSeleccionados.size === 0 && ambitoToAdd.mercado) {
      cadenasDelGrupo.forEach(cadena => {
        const ambitoToAddWithCadena = {
          grupoCadena: grupo,
          cadena: cadena,
          mercado: ambitoToAdd.mercado
        };
        
        addAmbitoWithValues(ambitoToAddWithCadena);
      });
    } 
    else if (mercadosSeleccionados.size > 0) {
      cadenasDelGrupo.forEach(cadena => {
        mercadosSeleccionados.forEach(mercadoStr => {
          const mercado = JSON.parse(mercadoStr);
          const ambitoToAddWithCadena = {
            grupoCadena: grupo,
            cadena: cadena,
            mercado: mercado
          };
          
          addAmbitoWithValues(ambitoToAddWithCadena);
        });
      });
    }
  };

  const handleCadenaSelect = (cadena) => {
    const existingAmbitos = ambitosTable.filter(
      ambito => ambito.cadena.id === cadena.id && selectedAmbitos.includes(ambito.id)
    );
    
    if (existingAmbitos.length > 0) {
      existingAmbitos.forEach(ambito => {
        removeAmbitoIfExists(null, cadena.id, null);
      });
      return;
    }
    
    setSelectedCadena(cadena.id);
    setAmbitoToAdd(prev => ({
      ...prev,
      cadena: cadena
    }));
    
    const grupoCadena = gruposCadenaDisponibles.find(g => g.id === cadena.idGrupoCadena);
    
    if (!grupoCadena) {
      console.error("No se encontró el grupo cadena para esta cadena");
      return;
    }
    
    const mercadosSeleccionados = new Set();
    ambitosTable.forEach(ambito => {
      if (selectedAmbitos.includes(ambito.id)) {
        mercadosSeleccionados.add(JSON.stringify(ambito.mercado));
      }
    });
    
    if (mercadosSeleccionados.size === 0 && ambitoToAdd.mercado) {
      const newAmbitoToAdd = {
        grupoCadena: grupoCadena,
        cadena: cadena,
        mercado: ambitoToAdd.mercado
      };
      addAmbitoWithValues(newAmbitoToAdd);
      return;
    }
    
    mercadosSeleccionados.forEach((mercadoStr) => {
      const mercado = JSON.parse(mercadoStr);
      const newAmbitoToAdd = {
        grupoCadena: grupoCadena,
        cadena: cadena,
        mercado: mercado
      };
      addAmbitoWithValues(newAmbitoToAdd);
    });
  };

  const handleMercadoSelect = (mercado) => {
    const existingAmbitos = ambitosTable.filter(
      ambito => ambito.mercado.id === mercado.id && selectedAmbitos.includes(ambito.id)
    );
    
    if (existingAmbitos.length > 0) {
      existingAmbitos.forEach(ambito => {
        removeAmbitoIfExists(null, null, mercado.id);
      });
      return;
    }
    
    setSelectedMercado(mercado.id);
    setAmbitoToAdd(prev => ({
      ...prev,
      mercado: mercado
    }));
    const gruposCadenaCombinations = new Map();
    
    ambitosTable.forEach(ambito => {
      if (selectedAmbitos.includes(ambito.id)) {
        const key = `${ambito.grupoCadena.id}-${ambito.cadena.id}`;
        if (!gruposCadenaCombinations.has(key)) {
          gruposCadenaCombinations.set(key, {
            grupoCadena: ambito.grupoCadena,
            cadena: ambito.cadena
          });
        }
      }
    });
    
    if (gruposCadenaCombinations.size === 0 && ambitoToAdd.grupoCadena && ambitoToAdd.cadena) {
      const newAmbitoToAdd = {
        grupoCadena: ambitoToAdd.grupoCadena,
        cadena: ambitoToAdd.cadena,
        mercado: mercado
      };
      addAmbitoWithValues(newAmbitoToAdd);
      return;
    }
    
    gruposCadenaCombinations.forEach((combination) => {
      const newAmbitoToAdd = {
        grupoCadena: combination.grupoCadena,
        cadena: combination.cadena,
        mercado: mercado
      };
      addAmbitoWithValues(newAmbitoToAdd);
    });
  };

  const handleArticuloSelect = (articulo) => {
    const isSelected = filteredArticulos.find(a => a.selected)?.idAjeno === articulo.idAjeno;
    
    setFilteredArticulos(prev => 
      prev.map(a => {
        if (a.idAjeno === articulo.idAjeno || a.id === articulo.idAjeno) {
          return { ...a, selected: !isSelected };
        }
        return a;
      })
    );
  };

  const handleAddArticulo = () => {
    const selectedArticulosToAdd = filteredArticulos.filter(a => a.selected);
    
    const formattedArticulos = selectedArticulosToAdd.map(articulo => ({
      idAjeno: articulo.idAjeno,
      nombreAjeno: articulo.nombreAjeno,
      unidadesMedida: {
        descripcion: articulo.descripcionUnidadesMedida
      },
      unidadesEmpaquetado: articulo.unidadesEmpaquetado,
      multiploMinimo: articulo.multiploMinimo,
      tipoEstadoCompras: {
        descripcion: articulo.descripcionEstadoCompras
      },
      tipoEstadoRam: {
        descripcion: articulo.descripcionTipoEstadoRam
      },
      descripcionTipoEstadoAliasAjenoRam: 'ACTIVO',
      fechaAlta: new Date().toISOString().split('T')[0],
      idSint: articulo.idSint || '-'
    }));
    
    const newArticulos = formattedArticulos.filter(newArticulo => 
      !articulos.some(existingArticulo => 
        existingArticulo.idAjeno === newArticulo.idAjeno || 
        existingArticulo.id === newArticulo.idAjeno
      )
    );
    
    if (newArticulos.length > 0) {
      setArticulos(prev => [...prev, ...newArticulos]);
    }
    
    setIsArticulosDropdownOpen(false);
    setFilteredArticulos(prev => prev.map(a => ({ ...a, selected: false })));
    setArticuloSearchText('');
  };

  const addAmbitoWithValues = (ambitoValues) => {
    if (ambitoValues.grupoCadena && ambitoValues.cadena && ambitoValues.mercado) {
      const newAmbitoId = `${ambitoValues.grupoCadena.id}-${ambitoValues.cadena.id}-${ambitoValues.mercado.id}`;
      
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

  const removeAmbitoIfExists = (grupoId, cadenaId, mercadoId) => {
    const ambitosToRemove = ambitosTable.filter(ambito => 
      (grupoId ? ambito.grupoCadena.id === grupoId : true) &&
      (cadenaId ? ambito.cadena.id === cadenaId : true) &&
      (mercadoId ? ambito.mercado.id === mercadoId : true)
    );
    
    if (ambitosToRemove.length > 0) {
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
                <div className="simple-value">{alias.descripcionTipoAlias || 'No especificado'}</div>
              </div>
              <div className="simple-form-group">
                <div className="simple-label">{t('Tipo de conexión a origen')}</div>
                <div className="simple-value">{alias.descripcionTipoConexionOrigenDatoAlias || 'No especificado'}</div>
              </div>
              <div className="simple-form-group">
                <div className="simple-label">{t('Estacionalidad')}</div>
                <div className="simple-value">{alias.descripcionTipoEstacionalidad || 'No especificado'}</div>
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
            {(selectedTipoAlias === '2' || selectedTipoAlias === 2 || alias.idTipoAlias === 2) && 
              (selectedTipoConexion === '2' || selectedTipoConexion === 2 || alias.idTipoConexionOrigenDatoAlias === 2) && (
              <div className="acople-section">
                <p className="section-description">{t('Selecciona los alias principales a los que quieres acoplar el alias.')}</p>
                <div className="aliasesPrincipales-search-container" ref={aliasesDropdownRef}>
                  <div className="field-container">
                    <label className="dropdown-label">{t('Id o Nombre de Alias')} </label>
                    <div className="aliasesPrincipales-search-input-container">
                      <input 
                        type="text" 
                        value={aliasSearchText}
                        onChange={handleAliasSearchChange}
                        onClick={toggleAliasesDropdown}
                        className="aliasesPrincipales-search-input"
                        placeholder={t('Buscar por id o nombre de alias')}
                      />
                      
                      {aliasSearchText && (
                        <button
                          className="aliasesPrincipales-search-clear-btn"
                          onClick={clearAliasSearch}
                        >
                          <FaTimes />
                        </button>
                      )}
                      
                      <button 
                        className="aliasesPrincipales-search-toggle-btn" 
                        onClick={toggleAliasesDropdown}
                      >
                        <FaChevronDown />
                      </button>
                    </div>
                  </div>
                  
                  {isAliasesDropdownOpen && (
                    <div className="aliasesPrincipales-dropdown">
                      <div className="aliasesPrincipales-search-box">
                        <FaSearch className="aliasesPrincipales-search-icon" />
                        <input 
                          type="text"
                          value={aliasSearchText}
                          onChange={handleAliasSearchChange}
                          placeholder={t('Buscar alias...')}
                          className="aliasesPrincipales-dropdown-search-input"
                          autoFocus
                        />
                        {aliasSearchText && (
                          <button
                            className="aliasesPrincipales-dropdown-clear-btn"
                            onClick={clearAliasSearch}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                      
                      <div className="aliasesPrincipales-dropdown-items">
                        {filteredAliasesPrincipales.length === 0 ? (
                          <div className="aliasesPrincipales-no-results">{t('No se encontraron alias')}</div>
                        ) : (
                          <>
                            {filteredAliasesPrincipales.map(alias => (
                              <div 
                                key={alias.idAlias} 
                                className="aliasesPrincipales-dropdown-item"
                                onClick={() => handleAliasPrincipalSelect(alias)}
                              >
                                <div className="custom-checkbox">
                                  {selectedAliasesPrincipales.some(a => a.idAlias === alias.idAlias) && 
                                    <FaCheck className="checkbox-icon" />
                                  }
                                </div>
                                <div className="aliasesPrincipales-item-info">
                                  <div className="aliasesPrincipales-item-id">
                                    {alias.idAlias} - {normalizeText(alias.nombre)}
                                  </div>
                                  <span className={`estado-tag ${alias.descripcion.toUpperCase().includes('PRODUCCION') ? 'produccion' : 'borrador'}`}>
                                    {normalizeText(alias.descripcion)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="aliasesPrincipales-count">
                  {t('Acoplado a los siguientes')} {selectedAliasesPrincipales.length} {t('alias')}
                </div>
                
                <div className="aliasesPrincipales-table-container">
                  {selectedAliasesPrincipales.length === 0 ? (
                    <div className="aliasesPrincipales-empty-state">
                      {t('No hay alias seleccionados. Utilice la búsqueda para añadir alias principales.')}
                    </div>
                  ) : (
                    <>
                      {showDeleteAliasIcon && (
                        <div className="articulos-actions-bar">
                          <div className="articulos-selection-info">
                            <span className="articulos-selected-count">
                              {selectedAliasesIds.length} {t('seleccionados')}
                            </span>
                          </div>
                          <button
                            className="articulos-action-btn delete-btn"
                            onClick={handleDeleteSelectedAliases}
                            title={t('Eliminar alias seleccionados')}
                          >
                            <FaTrash className="action-icon" />
                            <span>{t('Eliminar')}</span>
                          </button>
                        </div>
                      )}
                      <table className="aliasesPrincipales-table">
                        <thead>
                          <tr>
                            <th className="checkbox-column"></th>
                            <th>{t('ID ALIAS PRINCIPAL')}</th>
                            <th>{t('ALIAS PRINCIPAL')}</th>
                            <th>{t('RATIO DE ACOPLE (POR UNIDAD PRINCIPAL)')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAliasesPrincipales.map(alias => (
                            <tr key={alias.idAlias}>
                              <td className="checkbox-column">
                                <div 
                                  className="custom-checkbox"
                                  onClick={() => handleAliasPrincipalCheckboxChange(alias.idAlias)}
                                >
                                  {selectedAliasesIds.includes(alias.idAlias) && <FaCheck className="checkbox-icon" />}
                                </div>
                              </td>
                              <td>{alias.idAlias}</td>
                              <td>{normalizeText(alias.nombre)}</td>
                              <td>
                                <input 
                                  type="number" 
                                  value={acoplesRatio[alias.idAlias] || 1}
                                  onChange={(e) => handleAcopleRatioChange(alias.idAlias, e.target.value)}
                                  min="0"
                                  step="1"
                                  className="ratio-input"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            )}
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
                              {normalizeText(idioma.descripcion)}
                            </label>
                          </div>
                        ))
                      }
                      <div className="idiomas-dropdown-item select-all" onClick={() => {
                        const allIds = idiomasDisponibles
                          .filter(idioma => searchText === '' || idioma.descripcion.toLowerCase().includes(searchText.toLowerCase()))
                          .map(idioma => idioma.id);
                          
                        const isAllSelected = allIds.every(id => selectedIdiomas.includes(id));
                        setCheckAll(!isAllSelected);
                        
                        if (isAllSelected) {
                          setSelectedIdiomas(selectedIdiomas.filter(id => !allIds.includes(id)));
                        } else {
                          const newIds = allIds.filter(id => !selectedIdiomas.includes(id));
                          setSelectedIdiomas([...selectedIdiomas, ...newIds]);
                          
                          const newIdiomasValues = { ...idiomasAliasValues };
                          newIds.forEach(id => {
                            if (!newIdiomasValues[id]) {
                              newIdiomasValues[id] = { nombre: '', descripcion: '' };
                            }
                          });
                          setIdiomasAliasValues(newIdiomasValues);
                        }
                      }}>
                        <div className="custom-checkbox">
                          {checkAll && <FaCheck className="checkbox-icon" />}
                        </div>
                        <span>{t(' Seleccionar todo')}</span>
                      </div>
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
                    <th>{t('IDIOMA')}</th>
                    <th>{t('ALIAS EN CADA IDIOMA*')}</th>
                    <th>{t('DESCRIPCIÓN DEL ALIAS*')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedIdiomas.map(idiomaId => (
                    <tr key={idiomaId}>
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
                              {articulo.selected && <FaCheck className="checkbox-icon" />}
                            </div>
                            <div className="articulos-item-info">
                              <div className="articulos-item-id">
                                ID: {articulo.idAjeno || articulo.id}
                              </div>
                              <div className="articulos-item-nombre">
                                {normalizeText(articulo.nombreAjeno || articulo.descripcion || articulo.nombre)}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="articulos-select-all" onClick={handleSelectAllArticulos}>
                          <div className="custom-checkbox">
                            {checkAllArticulos && <FaCheck className="checkbox-icon" />}
                          </div>
                          <span>{t(' Seleccionar todo')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="articulos-count">{articulos.length} {t('artículos añadidos')}</div>
            <div className="articulos-actions-bar">
              <div className="articulos-selection-info">
                {selectedArticulosIds.length > 0 && (
                  <span className="articulos-selected-count">
                    {selectedArticulosIds.length} {t('seleccionados')}
                  </span>
                )}
              </div>
              {selectedArticulosIds.length > 0 && (
                <button
                  className="articulos-action-btn delete-btn"
                  onClick={handleDeleteSelectedArticulos}
                  title={t('Eliminar artículos seleccionados')}
                >
                  <FaTrash className="action-icon" />
                  <span>{t('Eliminar')}</span>
                </button>
              )}
            </div>
            <div className="articulos-table-container">
              {articulos.length === 0 ? (
                <div className="articulos-empty-state">
                  {t('No hay artículos seleccionados. Utilice la búsqueda para añadir artículos al alias.')}
                </div>
              ) : (
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
                      {articulos.map(articulo => {
                        const articuloId = articulo.idAjeno || articulo.id;
                        const isSelected = selectedArticulosIds.includes(articuloId);
                        
                        return (
                          <tr key={articuloId} className={isSelected ? 'selected-row' : ''}>
                            <td className="checkbox-column">
                              <div 
                                className="custom-checkbox"
                                onClick={() => handleArticuloCheckboxChange(articuloId)}
                              >
                                {isSelected && <FaCheck className="checkbox-icon" />}
                              </div>
                            </td>
                            <td>{articuloId}</td>
                            <td className="articulo-name">
                              {normalizeText(articulo.nombreAjeno || articulo.descripcion || articulo.nombre)}
                            </td>
                            <td className="unidades-box">{articulo.unidadesMedida?.descripcion || articulo.descripcionUnidadesMedida}</td>
                            <td>{articulo.unidadesEmpaquetado}</td>
                            <td className="text-center">{articulo.multiploMinimo}</td>
                            <td className="estado-column">
                              <StatusTag status={articulo.tipoEstadoCompras?.descripcion} />
                            </td>
                            <td className="estado-column">
                              <StatusTag status={articulo.tipoEstadoRam?.descripcion} />
                            </td>
                            <td className="estado-column">
                              <StatusTag status={articulo.descripcionTipoEstadoAliasAjenoRam} />
                            </td>
                            <td>{articulo.fechaAlta}</td>
                            <td>{articulo.idSint || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 3')}</span> - <span className="paso-descripcion">{t('DEFINICIÓN DEL ÁMBITO')}</span>
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">

            <div className="ambito-row">
              <div className="ambito-field grupo-cadena-field" ref={grupoCadenaDropdownRef}>
                <label className="ambito-label">{t('Id o Grupo Cadena (T6)*')}</label>
                <div 
                  className="dropdown-field" 
                  onClick={toggleGrupoCadenaDropdown}
                >
                  <span>
                    {(() => {
                      if (selectedGruposCadena.length === 0) {
                        return t('Seleccionar grupo cadena');
                      } else if (selectedGruposCadena.length === 1) {
                        const grupoId = selectedGruposCadena[0];
                        const grupo = gruposCadenaDisponibles.find(g => g.id === grupoId);
                        return grupo ? `${grupo.id} - ${normalizeText(grupo.descripcion)}` : grupoId;
                      } else {
                        return `${selectedGruposCadena.length} ${t('seleccionados')}`;
                      }
                    })()}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                
                {isGrupoCadenaDropdownOpen && (
                <div className="filter-dropdown-content">
                  <div className="dropdown-search">
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
                      const isSelected = selectedGruposCadena.includes(grupo.id);
                      
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
                            {isSelected && <FaCheck className="checkbox-icon" />}
                          </div>
                          <span className="dropdown-item-text">
                            {grupo.id} - {normalizeText(grupo.descripcion)}
                          </span>
                        </div>
                      );
                    })}
                    
                    <div className="dropdown-item select-all" onClick={(e) => {
                      e.stopPropagation();
                      const allSelected = filteredGruposCadena.every(grupo => 
                        selectedGruposCadena.includes(grupo.id)
                      );
                      
                      if (allSelected) {
                        setSelectedGruposCadena([]);
                        setSelectedGrupoCadena('');
                        
                        filteredGruposCadena.forEach(grupo => {
                          removeAmbitoIfExists(grupo.id, null, null);
                        });
                      } else {
                        const nuevosGruposIds = filteredGruposCadena
                          .filter(grupo => !selectedGruposCadena.includes(grupo.id))
                          .map(grupo => grupo.id);
                        
                        const nuevosGrupos = filteredGruposCadena
                          .filter(grupo => !selectedGruposCadena.includes(grupo.id));
                        
                        setSelectedGruposCadena([...selectedGruposCadena, ...nuevosGruposIds]);
                        
                        if (!selectedGrupoCadena && nuevosGruposIds.length > 0) {
                          setSelectedGrupoCadena(nuevosGruposIds[0]);
                        }
                        
                        nuevosGrupos.forEach(grupo => {
                          setAmbitoToAdd(prev => ({
                            ...prev,
                            grupoCadena: grupo
                          }));
                          addCadenasForGrupoCadena(grupo);
                        });
                      }
                      
                      updateCadenasBySelectedGrupos(
                        allSelected ? [] : [...selectedGruposCadena, ...filteredGruposCadena.map(g => g.id)]
                      );
                    }}>
                      <div className="custom-checkbox">
                        {filteredGruposCadena.every(grupo => selectedGruposCadena.includes(grupo.id)) && 
                          <FaCheck className="checkbox-icon" />
                        }
                      </div>
                      <span>{t(' Seleccionar todo')}</span>
                    </div>
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
                      if (!selectedGrupoCadena) {
                        return t('Seleccione primero un grupo cadena');
                      }
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
                        return `${cadena.id} - ${normalizeText(cadena.descripcion)}`;
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
                            {cadena.id} - {normalizeText(cadena.descripcion)}
                          </span>
                        </div>
                      );
                    })}
                    
                    <div className="dropdown-item select-all" onClick={(e) => {
                      e.stopPropagation();
                      const cadenasIds = filteredCadenas.map(c => c.id);
                      
                      const allSelected = cadenasIds.every(cadenaId => 
                        ambitosTable.some(ambito => 
                          ambito.cadena.id === cadenaId && 
                          selectedAmbitos.includes(ambito.id)
                        )
                      );
                      
                      if (allSelected) {
                        filteredCadenas.forEach(cadena => {
                          removeAmbitoIfExists(null, cadena.id, null);
                        });
                      } else {
                        filteredCadenas.forEach(cadena => {
                          const grupoCadena = gruposCadenaDisponibles.find(g => g.id === cadena.idGrupoCadena);
                          
                          if (grupoCadena) {
                            const mercadosSeleccionados = new Set();
                            ambitosTable.forEach(ambito => {
                              if (selectedAmbitos.includes(ambito.id)) {
                                mercadosSeleccionados.add(JSON.stringify(ambito.mercado));
                              }
                            });
                            
                            if (mercadosSeleccionados.size === 0 && ambitoToAdd.mercado) {
                              const newAmbitoToAdd = {
                                grupoCadena: grupoCadena,
                                cadena: cadena,
                                mercado: ambitoToAdd.mercado
                              };
                              addAmbitoWithValues(newAmbitoToAdd);
                            } else if (mercadosSeleccionados.size > 0) {
                              mercadosSeleccionados.forEach(mercadoStr => {
                                const mercado = JSON.parse(mercadoStr);
                                const newAmbitoToAdd = {
                                  grupoCadena: grupoCadena,
                                  cadena: cadena,
                                  mercado: mercado
                                };
                                addAmbitoWithValues(newAmbitoToAdd);
                              });
                            }
                          }
                        });
                      }
                    }}>
                      <div className="custom-checkbox">
                        {filteredCadenas.length > 0 && filteredCadenas.every(cadena => 
                          ambitosTable.some(ambito => 
                            ambito.cadena.id === cadena.id && 
                            selectedAmbitos.includes(ambito.id)
                          )
                        ) && <FaCheck className="checkbox-icon" />}
                      </div>
                      <span>{t(' Seleccionar todo')}</span>
                    </div>
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
                        return `${mercado.id} - ${normalizeText(mercado.descripcion)}`;
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
                            {mercado.id} - {normalizeText(mercado.descripcion)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="dropdown-item select-all" onClick={(e) => {
                      e.stopPropagation();
                      const mercadosIds = filteredMercados.map(m => m.id);
                      
                      const allSelected = mercadosIds.every(mercadoId => 
                        ambitosTable.some(ambito => 
                          ambito.mercado.id === mercadoId && 
                          selectedAmbitos.includes(ambito.id)
                        )
                      );
                      if (allSelected) {
                        filteredMercados.forEach(mercado => {
                          removeAmbitoIfExists(null, null, mercado.id);
                        });
                      } else {
                        const gruposCadenaCombinations = new Map();
                        ambitosTable.forEach(ambito => {
                          if (selectedAmbitos.includes(ambito.id)) {
                            const key = `${ambito.grupoCadena.id}-${ambito.cadena.id}`;
                            if (!gruposCadenaCombinations.has(key)) {
                              gruposCadenaCombinations.set(key, {
                                grupoCadena: ambito.grupoCadena,
                                cadena: ambito.cadena
                              });
                            }
                          }
                        });
                        filteredMercados.forEach(mercado => {
                          if (gruposCadenaCombinations.size === 0 && ambitoToAdd.grupoCadena && ambitoToAdd.cadena) {
                            const newAmbitoToAdd = {
                              grupoCadena: ambitoToAdd.grupoCadena,
                              cadena: ambitoToAdd.cadena,
                              mercado: mercado
                            };
                            addAmbitoWithValues(newAmbitoToAdd);
                          } else {
                            gruposCadenaCombinations.forEach((combination) => {
                              const newAmbitoToAdd = {
                                grupoCadena: combination.grupoCadena,
                                cadena: combination.cadena,
                                mercado: mercado
                              };
                              addAmbitoWithValues(newAmbitoToAdd);
                            });
                          }
                        });
                      }
                    }}>
                      <div className="custom-checkbox">
                        {filteredMercados.length > 0 && filteredMercados.every(mercado => 
                          ambitosTable.some(ambito => 
                            ambito.mercado.id === mercado.id && 
                            selectedAmbitos.includes(ambito.id)
                          )
                        ) && <FaCheck className="checkbox-icon" />}
                      </div>
                      <span>{t(' Seleccionar todo')}</span>
                    </div>
                  </div>
                </div>
              )}
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
                  {ambitosTable.map(ambito => (
                    <tr key={ambito.id}>
                      <td>{ambito.grupoCadena.id} - {normalizeText(ambito.grupoCadena.descripcion)}</td>
                      <td>{ambito.cadena.id} - {normalizeText(ambito.cadena.descripcion)}</td>
                      <td className="mercado-column">
                        <span>{ambito.mercado.id} - {normalizeText(ambito.mercado.descripcion)}</span>
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
}
export default EdicionAlias;