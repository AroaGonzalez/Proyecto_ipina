import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaSearch, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/nuevoArticulo.css';
import { LanguageContext } from '../context/LanguageContext';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const NuevoArticulo = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [allAjenos, setAllAjenos] = useState([]);
  const [preselectedArticles, setPreselectedArticles] = useState([]);
  const searchInputRef = useRef(null);
  const { languageId } = useContext(LanguageContext);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    const fetchAllAjenos = async () => {
      try {
        setSearching(true);
        const response = await axios.get(`${BASE_URL}/ajenos/all?idIdioma=${languageId}`);
        if (response.data && Array.isArray(response.data)) {
          setAllAjenos(response.data);
          setSearchResults(response.data);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error al obtener ajenos:', error);
      } finally {
        setSearching(false);
      }
    };
    
    fetchAllAjenos();
  }, [languageId]);

  useEffect(() => {
    const allValid = selectedArticles.every(
      article => 
        article.unidadesBox && 
        article.unidadEmpaquetado && 
        article.multiploMinimo
    );
    
    setFormValid(allValid && selectedArticles.length > 0);
  }, [selectedArticles]);

  const handleFilterChange = (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
    
    if (!searchValue.trim()) {
      setSearchResults(allAjenos);
      setShowResults(allAjenos.length > 0);
      return;
    }
    
    const isSearchById = !isNaN(searchValue.trim());
    let filtered;
    
    if (isSearchById) {
      filtered = allAjenos.filter(ajeno =>
        ajeno.idAjeno.toString().includes(searchValue.trim())
      );
    } else {
      if (searchValue.trim().length < 5) {
        setShowHelp(true);
        return;
      }
      
      filtered = allAjenos.filter(ajeno =>
        ajeno.nombreAjeno?.toLowerCase().includes(searchValue.trim().toLowerCase())
      );
    }
    
    setSearchResults(filtered);
    setShowResults(filtered.length > 0);
  };

  const handleSelectItem = (article) => {
    setPreselectedArticles(prev => {
      if (prev.some(a => a.idAjeno === article.idAjeno)) {
        return prev.filter(a => a.idAjeno !== article.idAjeno);
      }
      return [...prev, {
        ...article,
        unidadesBox: '',
        unidadEmpaquetado: '',
        multiploMinimo: ''
      }];
    });
  };

  const handleAddSelected = () => {
    const newSelectedArticles = [...selectedArticles];
    preselectedArticles.forEach(article => {
      if (!selectedArticles.some(a => a.idAjeno === article.idAjeno)) {
        newSelectedArticles.push({
          ...article,
          unidadesBox: '',
          unidadEmpaquetado: '', 
          multiploMinimo: ''
        });
      }
    });
    setSelectedArticles(newSelectedArticles);
    
    setPreselectedArticles([]);
    setShowResults(false);
  };

  const handleRemoveArticle = (id) => {
    setSelectedArticles(selectedArticles.filter(article => article.idAjeno !== id));
  };

  const handleSelectAllResults = () => {
    if (!selectAll) {
      setPreselectedArticles(searchResults.map(item => ({
        ...item, 
        unidadesBox: '',
        unidadEmpaquetado: '',
        multiploMinimo: ''
      })));
    } else {
      setPreselectedArticles([]);
    }
    setSelectAll(!selectAll);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleCreate = async () => {
    if (!formValid) {
      alert(t('Por favor, complete todos los campos requeridos para cada artículo'));
      return;
    }
    
    try {
      await axios.post(`${BASE_URL}/ajenos/create`, {
        ajenos: selectedArticles.map(article => ({
          idAjeno: article.idAjeno,
          unidadesBox: article.unidadesBox,
          unidadEmpaquetado: article.unidadEmpaquetado,
          multiploMinimo: article.multiploMinimo
        }))
      });
      
      navigate('/parametrizacion-articulos');
    } catch (error) {
      console.error('Error al crear artículos:', error);
      alert(t('Error al crear artículos. Por favor, inténtalo de nuevo.'));
    }
  };

  const handleSearchFocus = () => {
    setShowHelp(true);
    setShowResults(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowHelp(false);
    }, 200);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(allAjenos);
    setShowResults(true);
  };

  const handleArticleFieldChange = (id, field, value) => {
    setSelectedArticles(prev => 
      prev.map(article => 
        article.idAjeno === id 
          ? { ...article, [field]: value }
          : article
      )
    );
  };

  const handleClearField = (id, field) => {
    setSelectedArticles(prev => 
      prev.map(article => 
        article.idAjeno === id 
          ? { ...article, [field]: '' }
          : article
      )
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="nuevo-articulo-container">
      <div className="nuevo-articulo-header">
        <h1>
  {t('NUEVOS ARTÍCULOS')} 
  <div className="tooltip-container">
    <FaInfoCircle className="info-icon" />
    <div className="tooltip-text">
      Los campos de "UNIDADES BOX", "UNIDADES DE EMPAQUETADO" y "MÚLTIPLO MÍNIMO" son obligatorios para la creación de un artículo
    </div>
  </div>
</h1>
        <p>{t('BUSCAR Y AÑADIR LOS ARTÍCULOS QUE SE INCLUIRÁN EN LA APLICACIÓN RAM')}</p>
      </div>

      <div className="search-section">
        <div className="search-box-container" ref={searchInputRef}>
          <div className="search-box">
            <input
              type="text"
              placeholder={t('Buscar por id o nombre de artículo')}
              value={searchQuery}
              onChange={handleFilterChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="search-input"
            />
            <div className="dropdown-arrow">▼</div>
            {searchQuery && (
              <button className="clear-search-button" onClick={handleClearSearch}>
                <FaTimes />
              </button>
            )}
          </div>
          
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(article => (
                <div key={article.idAjeno} className="search-result-item">
                  <input
                    type="checkbox"
                    checked={preselectedArticles.some(a => a.idAjeno === article.idAjeno)}
                    onChange={() => handleSelectItem(article)}
                    className="result-checkbox"
                  />
                  <span className="result-text">{article.idAjeno} - {article.nombreAjeno}</span>
                </div>
              ))}
              <div className="search-result-all">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllResults}
                  className="result-checkbox"
                />
                <span className="result-text">{t('Seleccionar todo')}</span>
              </div>
            </div>
          )}
          
          {showHelp && !isNaN(searchQuery) && searchQuery.length > 0 && searchResults.length === 0 && (
            <div className="search-help">
              <div className="search-help-text">
                <p>{t('No se encontraron resultados para este ID.')}</p>
              </div>
            </div>
          )}
          
          {showHelp && isNaN(searchQuery) && searchQuery.length > 0 && searchQuery.length < 5 && (
            <div className="search-help">
              <div className="search-help-text">
                <p>{t('INTRODUCIR AL MENOS 5 CARACTERES PARA VER RESULTADOS POR NOMBRE.')}</p>
                <p>{t('BÚSQUEDA POR ID MUESTRA RESULTADOS QUE TENGAN COINCIDENCIA EXACTA')}</p>
              </div>
            </div>
          )}
        </div>
        <button
          className="add-button"
          disabled={preselectedArticles.length === 0}
          onClick={handleAddSelected}
        >
          {t('AÑADIR')}
        </button>
      </div>

      <div className="content-area">
        {selectedArticles.length === 0 ? (
          <div className="empty-state">
            <div className="search-icon-container">
              <FaSearch className="big-search-icon" />
            </div>
            <p>{t('UTILIZAR EL CAMPO "BUSCAR POR ID O NOMBRE DE ARTÍCULO" PARA SELECCIONAR Y AGREGAR LOS ARTÍCULOS QUE SE QUIEREN DAR DE ALTA')}</p>
          </div>
        ) : (
          <div className="selected-articles">
            <table>
              <thead>
                <tr>
                  <th>{t('ID ARTÍCULO')}</th>
                  <th>{t('ARTÍCULO')}</th>
                  <th>{t('UNIDADES BOX')}</th>
                  <th>{t('UNIDAD DE EMPAQUETADO')}</th>
                  <th>{t('MÚLTIPLO MÍNIMO')}</th>
                  <th>{t('ACCIÓN')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedArticles.map(article => (
                  <tr key={article.idAjeno}>
                    <td>{article.idAjeno}</td>
                    <td>{article.nombreAjeno}</td>
                    <td>
                      <select 
                        className="row-select" 
                        value={article.unidadesBox || ''}
                        onChange={(e) => handleArticleFieldChange(article.idAjeno, 'unidadesBox', e.target.value)}
                        required
                      >
                        <option value="">{t('Seleccionar')}</option>
                        <option value="BULTO-PACKAGE">{t('BULTO-PACKAGE')}</option>
                        <option value="UNIDAD">{t('UNIDAD')}</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="quantity-input">
                          <input
                            type="number"
                            value={article.unidadEmpaquetado || ''}
                            onChange={(e) => handleArticleFieldChange(article.idAjeno, 'unidadEmpaquetado', e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                        <span 
                          className="clear-button"
                          onClick={() => handleClearField(article.idAjeno, 'unidadEmpaquetado')}
                        >×</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="quantity-input">
                          <input
                            type="number"
                            value={article.multiploMinimo || ''}
                            onChange={(e) => handleArticleFieldChange(article.idAjeno, 'multiploMinimo', e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                        <span 
                          className="clear-button"
                          onClick={() => handleClearField(article.idAjeno, 'multiploMinimo')}
                        >×</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="remove-button"
                        onClick={() => handleRemoveArticle(article.idAjeno)}
                      >
                        {t('ELIMINAR')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="cancel-button" onClick={handleCancel}>{t('CANCELAR')}</button>
        <button
          className="create-button"
          onClick={handleCreate}
          disabled={!formValid}
        >
          {t('CREAR')}
        </button>
      </div>
    </div>
  );
};

export default NuevoArticulo;