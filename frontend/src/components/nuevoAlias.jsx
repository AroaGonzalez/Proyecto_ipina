import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaSearch, FaCheck, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/nuevoAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const CreacionAlias = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAliasesIds, setSelectedAliasesIds] = useState([]);
  const [showDeleteAliasIcon, setShowDeleteAliasIcon] = useState(false);
    
  const [tiposAlias, setTiposAlias] = useState([]);
  const [selectedTipoAlias, setSelectedTipoAlias] = useState('');
  const [estacionalidades, setEstacionalidades] = useState([]);
  const [selectedEstacionalidad, setSelectedEstacionalidad] = useState('');
  
  const [idiomas, setIdiomas] = useState([]);
  const [selectedIdiomas, setSelectedIdiomas] = useState([]);
  const [idiomasAliasValues, setIdiomasAliasValues] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [checkAll, setCheckAll] = useState(false);
  
  const [articulos, setArticulos] = useState([]);
  const [articulosDisponibles, setArticulosDisponibles] = useState([]);
  const [filteredArticulos, setFilteredArticulos] = useState([]);
  const [articuloSearchText, setArticuloSearchText] = useState('');
  const [isArticulosDropdownOpen, setIsArticulosDropdownOpen] = useState(false);
  const [checkAllArticulos, setCheckAllArticulos] = useState(false);

  const [gruposCadenaDisponibles, setGruposCadenaDisponibles] = useState([]);
  const [cadenasDisponibles, setCadenasDisponibles] = useState([]);
  const [mercadosDisponibles, setMercadosDisponibles] = useState([]);
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState('');
  const [selectedCadena, setSelectedCadena] = useState('');
  const [selectedMercado, setSelectedMercado] = useState('');
  const [ambitosTable, setAmbitosTable] = useState([]);
  const [selectedAmbitos, setSelectedAmbitos] = useState([]);
  
  const [grupoSearchText, setGrupoSearchText] = useState('');
  const [cadenaSearchText, setCadenaSearchText] = useState('');
  const [mercadoSearchText, setMercadoSearchText] = useState('');
  const [filteredGruposCadena, setFilteredGruposCadena] = useState([]);
  const [filteredCadenas, setFilteredCadenas] = useState([]);
  const [filteredMercados, setFilteredMercados] = useState([]);
  const [isGrupoCadenaDropdownOpen, setIsGrupoCadenaDropdownOpen] = useState(false);
  const [isCadenaDropdownOpen, setIsCadenaDropdownOpen] = useState(false);
  const [isMercadoDropdownOpen, setIsMercadoDropdownOpen] = useState(false);

  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedCadenas, setSelectedCadenas] = useState([]);
  const [selectedMercados, setSelectedMercados] = useState([]);
  const dropdownRef = useRef(null);
  const articulosDropdownRef = useRef(null);
  const grupoCadenaDropdownRef = useRef(null);
  const cadenaDropdownRef = useRef(null);
  const mercadoDropdownRef = useRef(null);

  const [selectedArticulosIds, setSelectedArticulosIds] = useState([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);

  const [selectedTipoConexion, setSelectedTipoConexion] = useState('');
  const [tiposConexion, setTiposConexion] = useState([]);

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

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [
                tiposAliasRes,
                estacionalidadesRes,
                idiomasRes,
                articulosRes,
                gruposCadenaRes,
                cadenasRes,
                mercadosRes,
                tiposConexionRes,
                aliasesResponse
            ] = await Promise.all([
                axios.get(`${BASE_URL}/creacion/tipos-alias?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/tipos-estacionalidad?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/idiomas?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/ajenos?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/grupos-cadena?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/cadenas?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/mercados?idIdioma=${languageId}`),                
                axios.get(`${BASE_URL}/creacion/tipo-Conexion-Origen-Dato?idIdioma=${languageId}`),
                axios.get(`${BASE_URL}/creacion/alias-info?idIdioma=${languageId}`)
            ]);

            setTiposAlias(tiposAliasRes.data || []);
            setEstacionalidades(estacionalidadesRes.data || []);
            setIdiomas(idiomasRes.data || []);
            setAliasesPrincipales(aliasesResponse.data || []);
            
            if (idiomasRes.data) {
                const principalesIds = [1, 3];
                setSelectedIdiomas(principalesIds);
                
                const idiomasValues = {};
                principalesIds.forEach(id => {
                  idiomasValues[id] = { nombre: '', descripcion: '' };
                });
                setIdiomasAliasValues(idiomasValues);
            }
            
            setArticulosDisponibles(articulosRes.data || []);
            setFilteredArticulos(articulosRes.data || []);
            setTiposConexion(tiposConexionRes.data || []);
            const gruposCadena = gruposCadenaRes.data || [];
            setGruposCadenaDisponibles(gruposCadena);
            setFilteredGruposCadena(gruposCadena);
            
            const cadenas = cadenasRes.data || [];
            setCadenasDisponibles(cadenas);
            setFilteredCadenas(cadenas);
            
            const mercados = mercadosRes.data || [];
            setMercadosDisponibles(mercados);
            setFilteredMercados(mercados);

        } catch (error) {
            console.error('Error fetching initial data:', error);
            setError('No se pudieron cargar los datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    fetchInitialData();
  }, [languageId]);

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

  const handleDropdownToggle = (dropdownName) => {
      setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
      setSearchText('');
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

  const normalizeText = (text) => {
      if (!text) return '';
  
      let normalizedText = text;
  
      normalizedText = normalizedText
      .replace(/ESPA.?.'A/g, 'ESPAÑA')
      .replace(/ESPA.?.A/g, 'ESPAÑA')
      .replace(/ESPA.A/g, 'ESPAÑA')
      .replace('ESPAÃ\'A', 'ESPAÑA')
      .replace('ESPAÃA', 'ESPAÑA')
      .replace('ESPAÃ±A', 'ESPAÑA')
      .replace('ESPAÑA', 'ESPAÑA');
  
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

  useEffect(() => {
    if (selectedGruposCadena.length > 0 && selectedCadenas.length > 0 && selectedMercados.length > 0) {
      generateAmbitosTable();
    } else {
      setAmbitosTable([]);
    }
  }, [selectedGruposCadena, selectedCadenas, selectedMercados]);
      
  const generateAmbitosTable = () => {
      const newAmbitos = [];
      let ambitoId = 1;
    
      selectedGruposCadena.forEach(grupoId => {
        const grupoCadena = gruposCadenaDisponibles.find(g => g.id === grupoId);
        
        const cadenasFiltradas = selectedCadenas.filter(cadenaId => 
          cadenasDisponibles.find(c => c.id === cadenaId && c.idGrupoCadena === grupoId)
        );
        
        cadenasFiltradas.forEach(cadenaId => {
          const cadena = cadenasDisponibles.find(c => c.id === cadenaId);
          
          selectedMercados.forEach(mercadoId => {
            const mercado = mercadosDisponibles.find(m => m.id === mercadoId);
            
            if (grupoCadena && cadena && mercado) {
              newAmbitos.push({
                id: ambitoId++,
                grupoCadena: {
                  id: grupoId,
                  descripcion: grupoCadena.descripcion
                },
                cadena: {
                  id: cadenaId,
                  descripcion: cadena.descripcion
                },
                mercado: {
                  id: mercadoId,
                  descripcion: mercado.descripcion
                }
              });
            }
          });
        });
      });
    
      setAmbitosTable(newAmbitos);
  };

  const handleSelectAllCadenas = () => {
      if (filteredCadenas.every(c => selectedCadenas.includes(c.id))) {
      setSelectedCadenas(selectedCadenas.filter(id => 
          !filteredCadenas.some(c => c.id === id)
      ));
      } else {
      const newIds = filteredCadenas.map(c => c.id).filter(id => !selectedCadenas.includes(id));
      setSelectedCadenas([...selectedCadenas, ...newIds]);
      }
  };

  const handleDeleteSelectedArticulos = () => {
    setArticulos(prev => prev.filter(articulo => 
      !selectedArticulosIds.includes(articulo.idAjeno || articulo.id)
    ));
    setSelectedArticulosIds([]);
    setShowDeleteIcon(false);
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
      
      if (selectedGruposCadena.length > 0) {
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

  const handleSelectAllArticulos = () => {
    const allSelected = filteredArticulos.every(articulo => articulo.selected);
    
    setCheckAllArticulos(!allSelected);
    
    setFilteredArticulos(prev => 
      prev.map(a => ({...a, selected: !allSelected}))
    );
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
      descripcionEstadoCompras: articulo.descripcionEstadoCompras,
      descripcionTipoEstadoRam: articulo.descripcionTipoEstadoRam,
      descripcionTipoEstadoAliasAjenoRam: 'ACTIVO',
      idTipoEstadoRam: articulo.idTipoEstadoRam,
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
  
  const clearGrupoSearch = () => {
    setGrupoSearchText('');
    setFilteredGruposCadena(gruposCadenaDisponibles);
  };
  
  const clearMercadoSearch = () => {
    setMercadoSearchText('');
    setFilteredMercados(mercadosDisponibles);
  };

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

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
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

  const handleIdiomaAliasChange = (idiomaId, field, value) => {
    setIdiomasAliasValues(prev => ({
      ...prev,
      [idiomaId]: {
        ...prev[idiomaId],
        [field]: value
      }
    }));
  };

  const handleClearInputValue = (idiomaId, field) => {
    handleIdiomaAliasChange(idiomaId, field, '');
  };

  const handleClearSearchText = () => {
    setSearchText('');
  };

    const handleGrupoCadenaSelect = (grupo) => {
        const newSelectedGrupos = selectedGruposCadena.includes(grupo.id)
        ? selectedGruposCadena.filter(id => id !== grupo.id)
        : [...selectedGruposCadena, grupo.id];
        
        setSelectedGruposCadena(newSelectedGrupos);

        if (newSelectedGrupos.length === 0) {
          setAmbitosTable([]);
        }
        
        const cadenasFiltradas = cadenasDisponibles.filter(
        cadena => newSelectedGrupos.includes(cadena.idGrupoCadena)
        );
        
        setFilteredCadenas(cadenasFiltradas);
        
        if (newSelectedGrupos.length > 0) {
        if (!selectedGruposCadena.includes(grupo.id) && newSelectedGrupos.includes(grupo.id)) {
            const cadenaIds = cadenasFiltradas
            .filter(cadena => cadena.idGrupoCadena === grupo.id)
            .map(cadena => cadena.id);
            
            setSelectedCadenas(prev => [...prev, ...cadenaIds.filter(id => !prev.includes(id))]);
        }
        else if (selectedGruposCadena.includes(grupo.id) && !newSelectedGrupos.includes(grupo.id)) {
            const cadenasDelGrupo = cadenasDisponibles
            .filter(cadena => cadena.idGrupoCadena === grupo.id)
            .map(cadena => cadena.id);
            
            setSelectedCadenas(prev => prev.filter(id => !cadenasDelGrupo.includes(id)));
        }
        } else {
        setSelectedCadenas([]);
        }
        
        setSelectedGrupoCadena(grupo.id);
    };

  const handleCadenaSelect = (cadena) => {
    const newSelectedCadenas = selectedCadenas.includes(cadena.id)
      ? selectedCadenas.filter(id => id !== cadena.id)
      : [...selectedCadenas, cadena.id];
    
    setSelectedCadenas(newSelectedCadenas);
    setSelectedCadena(cadena.id);
    
    if (newSelectedCadenas.length === 0) {
      setAmbitosTable([]);
    }
    
    if (selectedGruposCadena.length > 0 && newSelectedCadenas.length > 0 && selectedMercados.length > 0) {
      generateAmbitosTable();
    }
  };

  const handleMercadoSelect = (mercado) => {
    const newSelectedMercados = selectedMercados.includes(mercado.id)
      ? selectedMercados.filter(id => id !== mercado.id)
      : [...selectedMercados, mercado.id];
    
    setSelectedMercados(newSelectedMercados);
    setSelectedMercado(mercado.id);
    
    if (newSelectedMercados.length === 0) {
      setAmbitosTable([]);
    }
    
    if (selectedGruposCadena.length > 0 && selectedCadenas.length > 0 && newSelectedMercados.length > 0) {
      generateAmbitosTable();
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleCrear = async () => {
        if (!selectedTipoAlias || !selectedEstacionalidad) {
            alert(t('Debe seleccionar el tipo de alias y la estacionalidad'));
            return;
        }
    
        const faltanDatosIdioma = selectedIdiomas.some(idiomaId => 
            !idiomasAliasValues[idiomaId]?.nombre || !idiomasAliasValues[idiomaId]?.descripcion
        );
        
        if (faltanDatosIdioma) {
            alert(t('Debe introducir nombre y descripción para todos los idiomas'));
            return;
        }
    
        if (articulos.length === 0) {
            alert(t('Debe seleccionar al menos un artículo'));
            return;
        }
        if (ambitosTable.length === 0) {
            alert(t('Debe definir al menos un ámbito'));
            return;
        }
    
        try {
            setLoading(true);
            
            let idTipoConexionOrigenDatoAlias = 1;
            if (selectedTipoAlias === '2' && selectedTipoConexion === '2') {
              idTipoConexionOrigenDatoAlias = 2;
            }
            
            const nuevoAlias = {
              idTipoAlias: parseInt(selectedTipoAlias),
              idTipoEstacionalidad: parseInt(selectedEstacionalidad),
              idTipoEstadoAlias: 2,
              idTipoConexionOrigenDatoAlias: idTipoConexionOrigenDatoAlias,
              idTipoOrigenDatoAlias: 1,
              informacionOrigenDato: null,
              
              idiomas: selectedIdiomas.map(idIdioma => ({
                idIdioma: parseInt(idIdioma),
                nombre: idiomasAliasValues[idIdioma]?.nombre || '',
                descripcion: idiomasAliasValues[idIdioma]?.descripcion || ''
              })),
              
              aliasAjeno: articulos.map(articulo => ({
                idAjeno: parseInt(articulo.idAjeno || articulo.id),
                idTipoEstadoAjenoRam: articulo.idTipoEstadoRam,
                idSint: articulo.idSint && articulo.idSint !== '-' ? parseInt(articulo.idSint) : null
              })),
              
              aliasAmbito: {
                idsGrupoCadena: [...new Set(ambitosTable.map(ambito => ambito.grupoCadena.id))],
                idsCadena: [...new Set(ambitosTable.map(ambito => ambito.cadena.id))],
                idsMercado: [...new Set(ambitosTable.map(ambito => ambito.mercado.id))]
              }
            };

            if (selectedTipoAlias === '2' && selectedTipoConexion === '2' && selectedAliasesPrincipales.length > 0) {
              nuevoAlias.acoples = selectedAliasesPrincipales.map(alias => ({
                idAlias: parseInt(alias.idAlias),
                ratioAcople: parseFloat(acoplesRatio[alias.idAlias] || 1),
                idTipoAlias: parseInt(alias.idTipoAlias || 1)
              }));
            }
            
            const response = await axios.post(`${BASE_URL}/creacion/creacion-Alias`, nuevoAlias);

            console.log('Alias creado con ID:', response.data.id);
            
            alert(t('Alias creado correctamente'));
            navigate(-1);
        
        } catch (error) {
            console.error('Error creating alias:', error);
            setError('Error al crear el alias');
            alert(t('Error al crear el alias'));
        } finally {
            setLoading(false);
        }
    };

  if (loading) {
    return (
      <div className="creacion-alias-loading">
        <span>{t('Cargando...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="creacion-alias-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="creacion-alias-container">
      <div className="creacion-alias-header">
        <h1 className="creacion-alias-title">
          {t('NUEVO ALIAS')}
        </h1>
      </div>

      <div className="creacion-alias-content">
        <div className="creacion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 1')}</span> - <span className="paso-descripcion">{t('DATOS ALIAS')}</span>
          </div>
          <div className="paso-content">
            <p className="section-description">{t('Cubre los campos para la descripción del alias.')}</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>{t('Tipo de Alias')}</label>
                <select 
                  value={selectedTipoAlias}
                  onChange={(e) => {
                    setSelectedTipoAlias(e.target.value);
                    if (e.target.value !== '2') {
                      setSelectedTipoConexion('');
                    }
                  }}
                  className="form-select"
                >
                    <option value="">{t('Seleccionar...')}</option>
                        {tiposAlias.map(tipo => (
                            <option 
                                key={tipo.id} 
                                value={tipo.id}
                                disabled={tipo.id === 3}
                            >
                                {tipo.descripcion}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTipoAlias === '2' && (
                    <div className="form-group">
                    <label>{t('Tipo de conexión a origen')}</label>
                    <select 
                        value={selectedTipoConexion}
                        onChange={(e) => setSelectedTipoConexion(e.target.value)}
                        className="form-select"
                    >
                        <option value="">{t('Seleccionar...')}</option>
                        {tiposConexion.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                            {tipo.descripcion}
                        </option>
                        ))}
                    </select>
                    </div>
                )}
              
              <div className="form-group">
                <label>{t('Estacionalidad')}</label>
                <select 
                  value={selectedEstacionalidad}
                  onChange={(e) => setSelectedEstacionalidad(e.target.value)}
                  className="form-select"
                >
                  <option value="">{t('Seleccionar...')}</option>
                  {estacionalidades.map(estacionalidad => (
                    <option key={estacionalidad.id} value={estacionalidad.id}>
                      {estacionalidad.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedTipoAlias === '2' && selectedTipoConexion === '2' && (
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
                        <button className="aliasesPrincipales-search-clear-btn" onClick={clearAliasSearch}>
                          <FaTimes />
                        </button>
                      )}
                      <button className="aliasesPrincipales-search-toggle-btn" onClick={toggleAliasesDropdown}>
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
                          <button className="aliasesPrincipales-dropdown-clear-btn" onClick={clearAliasSearch}>
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
                                  <span className={`estado-tag ${alias.descripcion?.toUpperCase().includes('PRODUCCION') ? 'produccion' : 'borrador'}`}>
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
                      {idiomas
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
                        const allIds = idiomas
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
                  {selectedIdiomas.map(idiomaId => {
                    const idiomaInfo = idiomas.find(i => i.id === idiomaId);
                    return (
                      <tr key={idiomaId}>
                        <td>{idiomaInfo ? idiomaInfo.descripcion : idiomaId}</td>
                        <td>
                          <div className="editable-cell">
                            <input 
                              type="text" 
                              value={idiomasAliasValues[idiomaId]?.nombre || ''} 
                              onChange={(e) => handleIdiomaAliasChange(idiomaId, 'nombre', e.target.value)}
                              placeholder={t('Introduzca el nombre')}
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
                              placeholder={t('Introduzca la descripción')}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="creacion-alias-section">
        <div className="paso-title">
            <span>{t('PASO 2')}</span> - <span className="paso-descripcion">{t('ARTÍCULOS*')}</span>
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
                <div className="articulos-dropdown" style={{zIndex: 100000}}>
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
            {showDeleteIcon && (
                <div className="articulos-actions-bar">
                    <div className="articulos-selection-info">
                    <span className="articulos-selected-count">
                        {selectedArticulosIds.length} {t('seleccionados')}
                    </span>
                    </div>
                    <button
                    className="articulos-action-btn delete-btn"
                    onClick={handleDeleteSelectedArticulos}
                    title={t('Eliminar artículos seleccionados')}
                    >
                    <FaTrash className="action-icon" />
                    <span>{t('Eliminar')}</span>
                    </button>
                </div>
            )}
            {articulos.length === 0 ? (
            <div className="articulos-empty-message">
                <div className="empty-icon">
                <FaSearch size={30} />
                </div>
                <p>{t('UTILIZAR EL CAMPO "BUSCAR POR ID O NOMBRE DE ARTÍCULO" PARA SELECCIONAR Y AGREGAR ARTÍCULOS AL ALIAS')}</p>
            </div>
            ) : (
            <div className="articulos-table-container">
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
                            <div className="custom-checkbox" onClick={() => handleArticuloCheckboxChange(articulo.idAjeno || articulo.id)}>
                                {selectedArticulosIds.includes(articulo.idAjeno || articulo.id) && <FaCheck className="checkbox-icon" />}
                            </div>
                        </td>
                        <td>{articulo.idAjeno || articulo.id}</td>
                        <td className="articulo-name">
                            {articulo.nombreAjeno || articulo.descripcion || articulo.nombre}
                        </td>
                        <td className="unidades-box">{articulo.unidadesMedida?.descripcion || articulo.descripcionUnidadesMedida}</td>
                        <td>{articulo.unidadesEmpaquetado}</td>
                        <td className="text-center">{articulo.multiploMinimo}</td>
                        <td className="estado-column">
                            <span className={`estado-tag ${articulo.descripcionEstadoCompras?.toLowerCase().includes("activo") ? "activo" : ""}`}>
                                {articulo.descripcionEstadoCompras}
                            </span>
                        </td>
                        <td className="estado-column">
                            <span className={`estado-tag ${articulo.descripcionTipoEstadoRam?.toLowerCase().includes("activo") ? "activo" : ""}`}>
                                {normalizeText(articulo.descripcionTipoEstadoRam)}
                            </span>
                        </td>
                        <td className="estado-column">
                            <span className="estado-tag activo">
                                ACTIVO
                            </span>
                        </td>
                        <td>{articulo.fechaAlta || new Date().toISOString().split('T')[0]}</td>
                        <td>{articulo.idSint || '-'}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
        </div>

        <div className="creacion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 3')}</span> - <span className="paso-descripcion">{t('DEFINICIÓN DEL ÁMBITO')}</span>
          </div>
          
          <div className="paso-content">
            <div className="ambito-header">
              <div className="ambito-tipo">
                <p className="ambito-tipo-label">{t('Tipo ámbito: Grupo cadena y mercado')}</p>
              </div>
            </div>

            <div className="ambito-row">
              <div className="ambito-field grupo-cadena-field" ref={grupoCadenaDropdownRef}>
                <label className="ambito-label">{t('Id o Grupo Cadena (T6)*')}</label>
                <div 
                  className="dropdown-field" 
                  onClick={toggleGrupoCadenaDropdown}
                >
                   <span>
                        {selectedGruposCadena.length > 1 
                            ? `${selectedGruposCadena.length} seleccionados`
                            : selectedGruposCadena.length === 1 
                              ? (() => {
                                const grupo = gruposCadenaDisponibles.find(g => g.id === selectedGrupoCadena);
                                return grupo ? `${grupo.id} - ${normalizeText(grupo.descripcion)}` : selectedGrupoCadena;
                              })() 
                              : t('Seleccionar grupo cadena')
                        }
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
                        {filteredGruposCadena.map((grupo) => (
                            <div 
                            key={grupo.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGrupoCadenaSelect(grupo);
                            }}
                            >
                            <div className="custom-checkbox">
                                {selectedGruposCadena.includes(grupo.id) && <FaCheck className="checkbox-icon" />}
                            </div>
                            <span className="dropdown-item-text">
                                {grupo.id} - {normalizeText(grupo.descripcion)}
                            </span>
                            </div>
                        ))}
                        </div>
                        
                        <div className="select-all-fixed">
                        <div className="dropdown-item select-all">
                            <div className="custom-checkbox">
                            {filteredGruposCadena.length > 0 && 
                                filteredGruposCadena.every(g => selectedGruposCadena.includes(g.id)) && 
                                <FaCheck className="checkbox-icon" />
                            }
                            </div>
                            <span>{t('Seleccionar todo')}</span>
                        </div>
                        </div>
                    </div>
                )}
            </div>              
            <div className="ambito-field cadena-field" ref={cadenaDropdownRef}>
                <label className="ambito-label">{t('Id o Cadena*')}</label>
                <div 
                    className={`dropdown-field ${selectedGruposCadena.length === 0 ? 'disabled' : ''}`} 
                    onClick={selectedGruposCadena.length > 0 ? toggleCadenaDropdown : null}
                    >
                    <span>
                      {selectedCadenas.length > 0 
                        ? `${selectedCadenas.length} seleccionados`
                        : selectedCadenas.length === 1 && selectedCadena
                          ? (() => {
                              const cadena = cadenasDisponibles.find(c => c.id === selectedCadena);
                              return cadena ? `${cadena.id} - ${normalizeText(cadena.descripcion)}` : selectedCadena;
                            })() 
                          : t('Seleccionar cadena')
                      }
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
                        </div>
                        
                        <div className="dropdown-items">
                        {filteredCadenas.map((cadena) => (
                            <div 
                            key={cadena.id} 
                            className={`dropdown-item ${selectedCadenas.includes(cadena.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCadenaSelect(cadena);
                            }}
                            >
                            <input 
                                type="checkbox" 
                                checked={selectedCadenas.includes(cadena.id)} 
                                onChange={() => {}} 
                                onClick={(e) => e.stopPropagation()} 
                            />
                            <span className="dropdown-item-text">
                                {cadena.id} - {normalizeText(cadena.descripcion)}
                            </span>
                            </div>
                        ))}
                        </div>
                        
                        <div className="select-all-fixed">
                        <div className="dropdown-item select-all" onClick={() => handleSelectAllCadenas()}>
                            <input 
                            type="checkbox" 
                            checked={filteredCadenas.length > 0 && filteredCadenas.every(c => selectedCadenas.includes(c.id))} 
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()} 
                            />
                            <span>Seleccionar todo</span>
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
                    {selectedMercados.length > 0 
                      ? `${selectedMercados.length} seleccionados`
                      : selectedMercados.length === 1 && selectedMercado
                        ? (() => {
                            const mercado = mercadosDisponibles.find(m => m.id === selectedMercado);
                            return mercado ? `${mercado.id} - ${normalizeText(mercado.descripcion)}` : selectedMercado;
                          })() 
                        : t('Seleccionar mercado')
                    }
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
                        {filteredMercados.map((mercado) => (
                            <div 
                            key={mercado.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMercadoSelect(mercado);
                            }}
                            >
                            <div className="custom-checkbox">
                                {selectedMercados?.includes(mercado.id) && <FaCheck className="checkbox-icon" />}
                            </div>
                            <span className="dropdown-item-text">
                                {mercado.id} - {normalizeText(mercado.descripcion)}
                            </span>
                            </div>
                        ))}
                        </div>
                        
                        <div className="select-all-fixed">
                        <div className="dropdown-item select-all">
                            <div className="custom-checkbox">
                            {filteredMercados.length > 0 && 
                                filteredMercados.every(m => selectedMercados?.includes(m.id)) && 
                                <FaCheck className="checkbox-icon" />
                            }
                            </div>
                            <span>{t('Seleccionar todo')}</span>
                        </div>
                        </div>
                    </div>
                    )}
              </div>
            </div>
                            
            <div className="ambitos-table-container">
              {ambitosTable.length > 0 ? (
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
              ) : (
                <div className="ambitos-empty-state">
                  {t('Selecciona los ámbitos de distribución del alias utilizando los campos de búsqueda anteriores.')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="creacion-alias-actions">
        <button className="cancel-button" onClick={handleCancel}>
          {t('CANCELAR')}
        </button>
        <button className="crear-button" onClick={handleCrear}>
          {t('CREAR')}
        </button>
      </div>
    </div>
  );
};

export default CreacionAlias;