import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/nuevoEvento.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const NuevoEvento = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const dropdownRef = useRef(null);
  
  const [nombreEvento, setNombreEvento] = useState('');
  const [descripcionEvento, setDescripcionEvento] = useState('');
  const [tiposTarea, setTiposTarea] = useState([]);
  const [selectedTipoTarea, setSelectedTipoTarea] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const [estadoSolicitud, setEstadoSolicitud] = useState('PROPUESTA');
  const [selectedRowsForDelete, setSelectedRowsForDelete] = useState([]);
  const [showDeleteAction, setShowDeleteAction] = useState(false);
  
  const [showTipoTareaDropdown, setShowTipoTareaDropdown] = useState(false);
  const [showTareaDropdown, setShowTareaDropdown] = useState(false);
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [tareaSearchTerm, setTareaSearchTerm] = useState('');
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTipoTareaDropdown(false);
        setShowTareaDropdown(false);
        setShowEstadoDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    setShowDeleteAction(selectedRowsForDelete.length > 0);
  }, [selectedRowsForDelete]);
  
  useEffect(() => {
    const loadTiposTarea = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/eventos/tipos-tarea?idIdioma=${languageId}`);
        setTiposTarea(response.data || []);
      } catch (error) {
        console.error('Error al cargar tipos de tarea:', error);
      }
    };
    
    loadTiposTarea();
  }, [languageId]);
  
  useEffect(() => {
    const loadTareas = async () => {
      if (!selectedTipoTarea) return;
      
      try {
        const response = await axios.get(`${BASE_URL}/eventos/tareas/list`, {
          params: {
            idIdioma: languageId,
            idTipoTarea: selectedTipoTarea.id
          }
        });
        
        setTareas(response.data || []);
      } catch (error) {
        console.error('Error al cargar tareas:', error);
      }
    };
    
    loadTareas();
  }, [selectedTipoTarea, languageId]);
  
  const normalizeText = (text) => {
    if (!text) return '';
    
    let normalizedText = String(text);
    
    normalizedText = normalizedText
      .replace(/ESPA.?.'A/g, 'ESPAÑA')
      .replace(/ESPA.?.A/g, 'ESPAÑA')
      .replace(/PEQUE.?.AS/g, 'PEQUEÑAS')
      .replace(/PEQUE.?.A/g, 'PEQUEÑA')
      .replace(/CAMPA.?.A/g, 'CAMPAÑA')
      .replace(/PEQUE.?.OS/g, 'PEQUEÑOS');
  
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
  
  const handleDeleteSelectedRows = () => {
    setSelectedTareas(selectedTareas.filter(tarea => !selectedRowsForDelete.includes(tarea.idTarea)));
    setSelectedRowsForDelete([]);
  };
  
  const handleSubmit = async () => {
    try {
      if (!nombreEvento || !descripcionEvento || selectedTareas.length === 0) {
        alert('Por favor, complete todos los campos obligatorios');
        return;
      }
      
      const eventoData = {
        nombreEvento: nombreEvento,
        descripcion: descripcionEvento,
        idTipoEvento: 2,
        idTipoEstadoEvento: 2,
        idsTarea: selectedTareas.map(tarea => tarea.idTarea),
        estadoSolicitud: isDistribucion() ? 'PROPUESTA' : null
      };
      
      console.log('Enviando payload:', eventoData);
      await axios.post(`${BASE_URL}/eventos/create`, eventoData);
      navigate('/eventos');
      
    } catch (error) {
      console.error('Error al crear el evento:', error);
    }
  };
  
  const handleCancel = () => {
    navigate('/eventos');
  };
  
  const toggleDropdown = (dropdown) => {
    if (dropdown === 'tipoTarea') {
      setShowTipoTareaDropdown(!showTipoTareaDropdown);
      setShowTareaDropdown(false);
      setShowEstadoDropdown(false);
    } else if (dropdown === 'tarea') {
      setShowTareaDropdown(!showTareaDropdown);
      setShowTipoTareaDropdown(false);
      setShowEstadoDropdown(false);
    } else if (dropdown === 'estado') {
      setShowEstadoDropdown(!showEstadoDropdown);
      setShowTipoTareaDropdown(false);
      setShowTareaDropdown(false);
    }
  };
  
  const handleSelectTipoTarea = (tipoTarea) => {
    setSelectedTipoTarea(tipoTarea);
    setShowTipoTareaDropdown(false);
    setSelectedTareas([]);
    
    if (tipoTarea.id === 1) {
      setEstadoSolicitud('PROPUESTA');
    }
  };
  
  const isDistribucion = () => {
    return selectedTipoTarea && selectedTipoTarea.id === 1;
  };
  
  const handleSelectTarea = (tarea) => {
    const isSelected = selectedTareas.some(t => t.idTarea === tarea.idTarea);
    
    if (isSelected) {
      setSelectedTareas(selectedTareas.filter(t => t.idTarea !== tarea.idTarea));
    } else {
      setSelectedTareas([...selectedTareas, tarea]);
    }
  };
  
  const handleToggleSelectForDelete = (tareaId) => {
    if (selectedRowsForDelete.includes(tareaId)) {
      setSelectedRowsForDelete(selectedRowsForDelete.filter(id => id !== tareaId));
    } else {
      setSelectedRowsForDelete([...selectedRowsForDelete, tareaId]);
    }
  };
  
  const handleSelectAllForDelete = (event) => {
    if (event.target.checked) {
      setSelectedRowsForDelete(selectedTareas.map(tarea => tarea.idTarea));
    } else {
      setSelectedRowsForDelete([]);
    }
  };
  
  const filteredTareas = tareas.filter(tarea => {
    if (!tareaSearchTerm) return true;
    
    const nombreStr = normalizeText(String(tarea.nombreTarea || '')).toLowerCase();
    const idStr = String(tarea.idTarea || '');
    const search = tareaSearchTerm.toLowerCase().trim();
    
    return nombreStr.includes(search) || idStr.includes(search);
  });
  
  return (
    <div className="nuevo-evento-container">
      <h1 className="nuevo-evento-title">
        NUEVO EVENTO
      </h1>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 1</span> - DATOS EVENTO
        </div>
        
        <div className="input-container">
          <input
            type="text"
            className="evento-input"
            placeholder="Nombre del evento *"
            value={nombreEvento}
            onChange={(e) => setNombreEvento(e.target.value)}
            maxLength={50}
          />
          <small className="counter">{nombreEvento.length} / 50</small>
        </div>
        
        <div className="input-container">
          <textarea
            className="evento-textarea"
            placeholder="Descripción evento *"
            value={descripcionEvento}
            onChange={(e) => setDescripcionEvento(e.target.value)}
            maxLength={200}
          />
          <small className="counter">{descripcionEvento.length} / 200</small>
        </div>
      </div>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 2</span> - TAREAS ASOCIADAS
          {selectedTareas.length > 0 && <span className="success-icon">✓</span>}
        </div>
        
        <div className="dropdowns-container" ref={dropdownRef}>
          <div className="dropdown-wrapper">
            <div 
              className="custom-dropdown"
              onClick={() => toggleDropdown('tipoTarea')}
            >
              <span>{selectedTipoTarea ? selectedTipoTarea.descripcion : "Tipo de Tarea"}</span>
              <span className="dropdown-icon">▼</span>
              
              {showTipoTareaDropdown && (
                <div className="dropdown-menu">
                  {tiposTarea.map(tipoTarea => (
                    <div 
                      key={tipoTarea.id} 
                      className="dropdown-item"
                      onClick={() => handleSelectTipoTarea(tipoTarea)}
                    >
                      {tipoTarea.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="dropdown-wrapper">
            <div 
              className="custom-dropdown"
              onClick={() => toggleDropdown('tarea')}
              style={{ opacity: selectedTipoTarea ? 1 : 0.6, pointerEvents: selectedTipoTarea ? 'auto' : 'none' }}
            >
              <span>Id o Nombre de Tareas *</span>
              <span className="dropdown-icon">▼</span>
              
              {showTareaDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-search">
                    <input 
                      type="text" 
                      placeholder="Buscar tarea..." 
                      value={tareaSearchTerm}
                      onChange={(e) => setTareaSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items-container">
                    <div className="dropdown-items">
                      {filteredTareas.length > 0 ? (
                        filteredTareas.map(tarea => (
                          <div 
                            key={tarea.idTarea} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTarea(tarea);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTareas.some(t => t.idTarea === tarea.idTarea)}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>{`${tarea.idTarea} - ${normalizeText(tarea.nombreTarea)}`}</span>
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item no-results">
                          No se encontraron resultados
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {selectedTareas.length > 0 ? (
          <div className="tareas-table-container">                      
            {showDeleteAction && (
              <div className="articulos-actions-bar">
                <div className="articulos-selection-info">
                  <span className="articulos-selected-count">
                    {selectedRowsForDelete.length} tareas seleccionadas
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={handleDeleteSelectedRows}
                  disabled={selectedRowsForDelete.length === 0}
                >
                  <FaTrash className="action-icon" />
                  Eliminar
                </button>
              </div>
            )}
            
            <table className="tareas-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllForDelete}
                      checked={selectedRowsForDelete.length === selectedTareas.length && selectedTareas.length > 0}
                    />
                  </th>
                  <th>ID TAREA</th>
                  <th>TAREA</th>
                  <th>TIPO DE TAREA</th>
                  <th>ESTADO DE LA TAREA</th>
                  <th>MERCADOS</th>
                  <th>CADENAS</th>
                  <th>ALIAS</th>
                </tr>
              </thead>
              <tbody>
                {selectedTareas.map(tarea => (
                  <tr key={tarea.idTarea}>
                    <td className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={selectedRowsForDelete.includes(tarea.idTarea)}
                        onChange={() => handleToggleSelectForDelete(tarea.idTarea)}
                      />
                    </td>
                    <td>{tarea.idTarea}</td>
                    <td>{normalizeText(tarea.nombreTarea)}</td>
                    <td><span className="tipo-tarea-badge">{tarea.descripcionTipoTarea}</span></td>
                    <td><span className="estado-tarea-badge activa">{tarea.descripcionTipoEstadoTarea || 'ACTIVA'}</span></td>
                    <td>{normalizeText(tarea.mercados?.join(', ') || '-')}</td>
                    <td>{normalizeText(tarea.cadenas?.join(', ') || '-')}</td>
                    <td>{tarea.idsAlias?.length || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-tareas-container">
            <div className="no-tareas-icon">⚠️</div>
            <div className="no-tareas-message">
              <p>NO HAY TAREAS SELECCIONADAS</p>
              <p>UTILIZAR LOS CAMPOS NECESARIOS PARA AÑADIR TAREAS AL EVENTO</p>
            </div>
          </div>
        )}
      </div>
      
      {isDistribucion() && (
        <div>
          <div className="paso-title">
            <span className="paso-number">PASO 3</span> - PROPIEDADES DE LA SOLICITUD EN SFI COMPRAS
            <span className="info-icon" title="Información adicional">ⓘ</span>
            <span className="success-icon">✓</span>
          </div>
          
          <div className="dropdown-wrapper">
            <div 
              className="custom-dropdown selected-value"
              onClick={() => toggleDropdown('estado')}
              style={{ maxWidth: '250px' }}
            >
              <span>PROPUESTA</span>
              <span className="dropdown-icon">▼</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="buttons-container">
        <button className="cancel-button" onClick={handleCancel}>
          CANCELAR
        </button>
        <button
          className="create-button"
          onClick={handleSubmit}
          disabled={!nombreEvento || !descripcionEvento || selectedTareas.length === 0}
        >
          CREAR
        </button>
      </div>
    </div>
  );
};

export default NuevoEvento;